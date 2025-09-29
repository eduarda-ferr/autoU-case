from fastapi import FastAPI, Form, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from PyPDF2 import PdfReader
import requests
import os
import logging
from typing import Optional, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("email-analyzer")

app = FastAPI(title="Email Analyzer API")
app.mount("/static", StaticFiles(directory="static"), name="static")

HF_API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment"

HF_API_KEY = os.getenv("HF_API_KEY")

HF_HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

def read_pdf(file_obj) -> str:
    try:
        reader = PdfReader(file_obj)
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts).strip()
    except Exception as e:
        logger.exception("Erro ao ler PDF: %s", e)
        return ""

def read_txt(file_obj) -> str:
    try:
        return file_obj.read().decode("utf-8").strip()
    except Exception as e:
        logger.exception("Erro ao ler TXT: %s", e)
        return ""

def query_huggingface(payload: dict) -> Any:
    try:
        resp = requests.post(HF_API_URL, headers=HF_HEADERS, json=payload, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        logger.exception("Erro na requisição Hugging Face: %s", e)
        return {"error": str(e)}

@app.get("/")
async def serve_index():
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"error": "Página não encontrada."}, status_code=404)

@app.post("/extract_text")
async def extract_text(file: UploadFile = File(...)):
    fname = (file.filename or "").lower()
    text = ""
    if fname.endswith(".pdf"):
        text = read_pdf(file.file)
    elif fname.endswith(".txt"):
        text = read_txt(file.file)
    else:
        return JSONResponse({"error": "Formato inválido. Use .pdf ou .txt"}, status_code=400)

    if not text:
        return JSONResponse({"error": "Não foi possível extrair texto do arquivo."}, status_code=400)

    return {"text": text}

@app.post("/process")
async def process_email(email_text: Optional[str] = Form(None)):
    if not email_text or not email_text.strip():
        return JSONResponse({"error": "Nenhum texto enviado."}, status_code=400)

    email_text = email_text.strip()
    logger.info("Texto recebido (primeiros 300 chars): %s", email_text[:300])

    result = query_huggingface({"inputs": email_text})
    if isinstance(result, dict) and result.get("error"):
        return JSONResponse({"erro": result.get("error")}, status_code=500)

    label = None
    score = None
    try:
        if isinstance(result, list):
            first = result[0]
            pred = first[0] if isinstance(first, list) else first
            label = pred.get("label")
            score = pred.get("score")
        elif isinstance(result, dict):
            label = result.get("label")
            score = result.get("score")
    except Exception as e:
        logger.exception("Erro ao parsear resposta HF: %s", e)

    percentage = f"{round(score * 100, 0)}%" if isinstance(score, (int, float)) else "N/A"

    text_lower = email_text.lower()
    if any(word in text_lower for word in ["urgente", "problema", "erro", "atraso", "pedido", "entrega", "ajuda"]):
        categoria = "produtivo"
        suggested_reply = "Recebemos seu e-mail e vamos resolver o problema o quanto antes."
    elif any(word in text_lower for word in ["obrigado", "perfeito", "bom"]):
        categoria = "improdutivo"
        suggested_reply = "Ficamos felizes em ajudar! Qualquer dúvida, estamos à disposição."
    else:
        categoria = "improdutivo"
        suggested_reply = "Obrigado pelo feedback!"

    return {
        "input": email_text,
        "categoria": categoria,
        "porcentagem": percentage,
        "resposta_sugerida": suggested_reply,
        "sentimento_label": label,
        "sentimento_score": score
    }