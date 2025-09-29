const form = document.getElementById("formulario_email");
const fileInput = document.getElementById("file"); 
const emailText = document.getElementById("email-text");
const results = document.getElementById("resultado");
const extractBtn = document.getElementById("extract-btn");
const categoryEl = document.getElementById("category");
const replyEl = document.getElementById("resposta");
const confidenceEl = document.getElementById("resposta__percentual");

const spinner = document.createElement("div");
spinner.className = "spinner d-none";
spinner.innerHTML = `<div class="loader"></div>`;
form.appendChild(spinner);

async function extractPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(" ") + "\n";
  }
  return text.trim();
}

async function extractTxt(file) {
  return await file.text();
}

extractBtn.addEventListener("click", async () => {
  if (!fileInput.files.length) {
    alert("Escolha um arquivo primeiro!");
    return;
  }

  const file = fileInput.files[0];
  let text = "";

  try {
    if (file.name.toLowerCase().endsWith(".pdf")) {
      text = await extractPdf(file);
    } else if (file.name.toLowerCase().endsWith(".txt")) {
      text = await extractTxt(file);
    } else {
      alert("Formato não suportado.");
      return;
    }

    emailText.value = text;
  } catch (err) {
    console.error("Erro ao extrair texto:", err);
    alert("Não foi possível extrair o texto do arquivo.");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  if (fileInput.files.length) formData.append("file", fileInput.files[0]);
  formData.append("email_text", emailText.value);

  try {
    spinner.classList.remove("d-none");
    results.classList.add("d-none");

    const response = await fetch("/process", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    spinner.classList.add("d-none");

    if (data.erro) {
      alert(data.erro);
      return;
    }

    results.classList.remove("d-none");
    results.style.opacity = 0;
    setTimeout(() => (results.style.opacity = 1), 50);

    categoryEl.textContent = data.categoria;
    replyEl.textContent = data.resposta_sugerida;
    confidenceEl.textContent = data.porcentagem;

    categoryEl.className =
      data.categoria === "produtivo"
        ? "category productive highlight"
        : "category unproductive highlight";

    setTimeout(() => categoryEl.classList.remove("highlight"), 1500);
  } catch (err) {
    console.error(err);
    alert("Ocorreu um erro ao processar o email.");
  }
});
