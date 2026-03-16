export function limpiarTabla() {
  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = "";
}

export function agregarFila(row) {
  const tbody = document.querySelector("#resultsTable tbody");

  const autoresHtml = row.todosAutores && row.todosAutores.length > 1
    ? `
      <details class="authors-details">
        <summary>${row.primerAutor} <span class="ver-mas">Ver más</span></summary>
        <div class="authors-list">
          ${row.todosAutores.map(a => `<div>${a}</div>`).join("")}
        </div>
      </details>
    `
    : row.primerAutor || "Sin autor";

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${row.title}</td>
    <td>
      <a href="https://doi.org/${row.doi}" target="_blank">${row.doi}</a>
    </td>
    <td>
      <span class="oa-badge">${row.is_oa}</span>
      <div class="oa-links">
        ${row.pdf ? `<a href="${row.pdf}" target="_blank">PDF</a>` : ""}
        ${!row.pdf && row.landing ? `<a href="${row.landing}" target="_blank">Ver OA</a>` : ""}
      </div>
    </td>
    <td>${row.journal}</td>
    <td>${row.year}</td>
    <td>${row.publisher}</td>
    <td>${autoresHtml}</td>
  `;

  tbody.appendChild(tr);
}