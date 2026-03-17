export function limpiarTabla() {
  const container = document.getElementById("resultsCards");
  container.innerHTML = "";
}

export function agregarFila(row) {
  const container = document.getElementById("resultsCards");

  const autoresHtml = row.todosAutores && row.todosAutores.length > 0
    ? `
      <div class="card-authors">
        <strong>Autores:</strong> ${row.primerAutor}
        ${row.todosAutores.length > 1 ? `
          <details class="more-authors">
            <summary>Ver todos (${row.todosAutores.length})</summary>
            <ul>
              ${row.todosAutores.map(a => `<li>${a}</li>`).join("")}
            </ul>
          </details>
        ` : ""}
      </div>
    `
    : `<div class="card-authors"><strong>Autores:</strong> Sin autor</div>`;

  const oaStatusColor = row.is_oa && row.is_oa !== "closed" ? "oa-badge-green" : "oa-badge-red";

  const card = document.createElement("div");
  card.className = "result-card";

  card.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">${row.title}</h3>
      <span class="oa-badge ${oaStatusColor}">${row.is_oa}</span>
    </div>

    <div class="card-meta">
      <div class="meta-item">
        <strong>Año:</strong> ${row.year || "N/A"}
      </div>
      <div class="meta-item">
        <strong>DOI:</strong> <a href="https://doi.org/${row.doi}" target="_blank">${row.doi || "N/A"}</a>
      </div>
      <div class="meta-item">
        <strong>Revista:</strong> ${row.journal || "N/A"}
      </div>
      <div class="meta-item">
        <strong>Tipo:</strong> ${row.tipoPublicacion || "N/A"}
      </div>
    </div>

    <div class="card-details">
      <div class="detail-item">
        <strong>Editorial:</strong> ${row.publisher || "N/A"}
      </div>
      <div class="detail-item">
        <strong>Citas:</strong> <span class="citas-badge">${row.citas || 0}</span>
      </div>
      <div class="detail-item">
        <strong>Institución:</strong> ${row.institucion || "N/A"}
      </div>
      <div class="detail-item">
        <strong>País:</strong> ${row.pais || "N/A"}
      </div>
      <div class="detail-item">
        <strong>Tema:</strong> ${row.tema || "N/A"}
      </div>
      <div class="detail-item">
        <strong>En DOAJ:</strong> ${row.enDoaj || "N/A"}
      </div>
      <div class="detail-item">
        <strong>Ranking:</strong> ${row.rankingRevista || "N/A"}
      </div>
      <div class="detail-item">
        <strong>APC:</strong> ${row.apcPricing || "N/A"}
      </div>
    </div>

    ${autoresHtml}

    <div class="card-links">
      ${row.pdf ? `<a href="${row.pdf}" target="_blank" class="btn-pdf">📄 Descargar PDF</a>` : ""}
      ${!row.pdf && row.landing ? `<a href="${row.landing}" target="_blank" class="btn-landing">🔗 Ver en Open Access</a>` : ""}
      ${row.doi ? `<a href="https://doi.org/${row.doi}" target="_blank" class="btn-doi">DOI</a>` : ""}
    </div>
  `;

  container.appendChild(card);
}