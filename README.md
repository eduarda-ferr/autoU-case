# Classificador de Emails com IA — Projeto (Desafio Simplificado)

---

Este projeto entrega uma aplicação web simples que:

* Recebe o conteúdo de um email (texto e, opcionalmente, anexo/descrição).
* Classifica o email em **Produtivo** ou **Improdutivo**.
* Gera uma sugestão de resposta automática baseada na classificação (modelo de templates + IA).

Objetivo: reduzir trabalho manual de triagem e acelerar o atendimento.

## Tecnologias usadas

* Backend: **FastAPI** (Python)
* Modelo (exemplos):

  * **Baseline**: scikit-learn (Tfidf + LogisticRegression) — rápido e reproduzível localmente.
  * **Opção avançada**: chamada a modelo de linguagem (Hugging Face Inference) para respostas.
* Frontend: HTML + CSS + JavaScript (fetch API) — simples e responsivo.
* Deploy: Render.
* Controle de versão: Git + GitHub

## Estruturação

```
auto-email-classifier/
├── backend/
│   ├── main.py              
│   ├── model
│   ├── requirements.txt
├── frontend/
│   ├── index.html
│   ├── static/
│   │   ├── style.css
│   │   └── sript.js
├── README.md
```

## Instalação e execução local

### Pré-requisitos

* Python 3.10+
* Git

### Passos (Linux / macOS / Windows PowerShell adaptável)

```bash
# clonar repo
git clone https://github.com/SEU_USUARIO/auto-email-classifier.git
cd auto-email-classifier/backend

# criar ambiente virtual
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# instalar dependências
pip install -r requirements.txt

# (opcional) treinar modelo baseline
python model/train.py --input ../data/labeled_dataset.csv --output model/model.joblib

# rodar API
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Abra `frontend/index.html` no navegador (ou sirva a pasta `frontend` com `python -m http.server 5500`) e aponte o formulário para `http://localhost:8000/predict`.

## Interface web

1. Abra a página principal.
2. Cole o texto do email (assunto + corpo) ou faça upload de um `.pdf`/`.txt`.
3. Clique em **Classificar**.
4. A interface mostrará: a categoria (Produtivo/Improdutivo), a confiança (score), e uma resposta sugerida.

Design: simples, campo de texto central, botão de ação principal e área de resultado clara.

## API (endpoints)

**POST /predict**
Request JSON:

```json
{
  "subject": "Assunto do email",
  "body": "Corpo do email textualmente",
  "metadata": { "from": "cliente@exemplo.com" }
}
```

Response JSON:

```json
{
  "label": "Produtivo",
  "score": 0.92,
  "suggested_reply": "Olá [Nome], obrigado pelo contato...",
  "explain": "palavras-chaves: fatura, status"
}
```

**POST /classify-file** — para upload de arquivos `.eml` ou `.txt`.

## Dados de exemplo

Arquivo `data/sample_emails.json` com ~10–30 emails de exemplo (mistura de produtivo/improdutivo). Formato:

```json
[
  {"subject":"Atualização do pedido","body":"Oi, preciso do status do pedido 1234." , "label":"Produtivo"},
  {"subject":"Feliz Natal!","body":"Desejo a você e à família um ótimo Natal!", "label":"Improdutivo"}
]
```

## Deploy

### Render 

* Adicionar `requirements.txt` e `Procfile` (`web: uvicorn main:app --host 0.0.0.0 --port $PORT`).
* Subir no GitHub e conectar o service no Render.
* Configurar variáveis de ambiente (e.g. `HF_API_KEY` ou `OPENAI_API_KEY`).

## Melhorias futuras

* Melhor coleção de dados rotulados; balanceamento de classes; fine-tuning de LLM para o domínio.
* Pipeline de monitoramento (drift detection), feedback loop (re-rotular), UI para revisão humana.

## Licença e contato

* Licença: MIT
* Contato: Maria Eduarda Ferreira Brabosa / mariaeduardafb00gmail.com

---
