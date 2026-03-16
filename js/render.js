export function limpiarTabla() {
  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = "";
}

export function agregarFila(row) {
  const tbody = document.querySelector("#resultsTable tbody");

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${row.title}</td>
    <td><a href="https://doi.org/${row.doi}" target="_blank">${row.doi}</a></td>
    <td>${row.is_oa ? "Sí" : "No"}</td>
    <td>${row.journal}</td>
    <td>${row.year}</td>
    <td>${row.publisher}</td>
  `;

  tbody.appendChild(tr);
}