export function limpiarTabla() {
  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = "";
}

export function agregarFila(row) {
  const tbody = document.querySelector("#resultsTable tbody");

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${row.title}</td>
    <td>${row.doi}</td>
    <td>${row.is_oa}</td>
    <td>${row.journal}</td>
    <td>${row.year}</td>
    <td>${row.publisher}</td>
  `;

  tbody.appendChild(tr);
}