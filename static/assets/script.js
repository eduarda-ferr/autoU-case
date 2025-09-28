const form = document.getElementById("formulario_email");
const fileInput = document.getElementById("file"); // input file
const emailText = document.getElementById("email-text"); // textarea
const results = document.getElementById("resultado");
const extractBtn = document.getElementById("extract-btn");
const categoryEl = document.getElementById("category");
const replyEl = document.getElementById("resposta");
const confidenceEl = document.getElementById("resposta__percentual");

// Função para extrair texto do PDF usando pdf.js
async function extractPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(" ") + "\n";
  }
  return text.trim();
}

// Função para extrair texto de TXT
async function extractTxt(file) {
  return await file.text();
}

// Botão de extração
extractBtn.addEventListener("click", async () => {
  if (!fileInput.files.length) {
    alert("Escolha um arquivo primeiro!");
    return;
  }

  const file = fileInput.files[0];
  let text = "";

  if (file.name.toLowerCase().endsWith(".pdf")) {
    text = await extractPdf(file);
  } else if (file.name.toLowerCase().endsWith(".txt")) {
    text = await extractTxt(file);
  } else {
    alert("Formato não suportado.");
    return;
  }

  emailText.value = text;
});

// Submit único do formulário
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  if (fileInput.files.length) formData.append("file", fileInput.files[0]);
  formData.append("email_text", emailText.value);

  try {
    const response = await fetch("/process", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (data.erro) {
      alert(data.erro);
      return;
    }

    results.classList.remove("d-none");
    categoryEl.textContent = data.categoria;
    replyEl.textContent = data.resposta_sugerida;
    confidenceEl.textContent = data.porcentagem;

    // Ajusta a classe da categoria para estilo visual
    categoryEl.className = data.categoria === "produtivo" ? "category productive" : "category unproductive";

  } catch (err) {
    console.error(err);
    alert("Ocorreu um erro ao processar o email.");
  }
});
