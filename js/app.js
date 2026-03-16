console.log("app.js cargado");

const btn = document.getElementById("searchBtn");
const input = document.getElementById("orcidInput");
const status = document.getElementById("status");

console.log("Botón encontrado:", btn);
console.log("Input encontrado:", input);
console.log("Status encontrado:", status);

btn.addEventListener("click", () => {
  console.log("Hiciste clic en consultar");
  status.textContent = `Botón funcionando. ORCID: ${input.value.trim()}`;
});