export function limpiarTabla() {
  const container = document.getElementById("resultsCards");
  container.innerHTML = "";
}

export function agregarFila(row) {
  const container = document.getElementById("resultsCards");

  const generarAutoresHtml = () => {
    if (!row.todosAutoresConAfiliacion || row.todosAutoresConAfiliacion.length === 0) {
      return `<div class="card-authors"><strong>Autores:</strong> Sin información</div>`;
    }

    const primerAutor = row.todosAutoresConAfiliacion[0];
    const esPrimerAutorSearched = primerAutor.orcid === row.orcidBuscado;

    let html = `
      <div class="card-authors">
        <strong>Autores:</strong>
        <ul class="authors-list">
          <li class="${esPrimerAutorSearched ? 'author-highlighted' : ''}">
            <span class="author-name">${primerAutor.nombre || "Sin nombre"}</span>
            ${primerAutor.institucion ? `<span class="author-affiliation">${primerAutor.institucion}${primerAutor.pais ? `, ${primerAutor.pais}` : ""}</span>` : ""}
            ${esPrimerAutorSearched ? `<span class="author-badge">👤 ORCID Buscado</span>` : ""}
          </li>
        </ul>
    `;

    if (row.todosAutoresConAfiliacion.length > 1) {
      html += `
        <details class="more-authors">
          <summary>Ver todos (${row.todosAutoresConAfiliacion.length})</summary>
          <ul class="authors-list">
            ${row.todosAutoresConAfiliacion.slice(1).map(autor => {
              const esSearched = autor.orcid === row.orcidBuscado;
              return `
                <li class="${esSearched ? 'author-highlighted' : ''}">
                  <span class="author-name">${autor.nombre || "Sin nombre"}</span>
                  ${autor.institucion ? `<span class="author-affiliation">${autor.institucion}${autor.pais ? `, ${autor.pais}` : ""}</span>` : ""}
                  ${esSearched ? `<span class="author-badge">👤 ORCID Buscado</span>` : ""}
                </li>
              `;
            }).join("")}
          </ul>
        </details>
      `;
    }

    html += `</div>`;
    return html;
  };

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
        <strong>Editorial:</strong> ${row.publisherUrl ? `<a href="${row.publisherUrl}" target="_blank">${row.publisher || "N/A"}</a>` : (row.publisher || "N/A")}
      </div>
      <div class="detail-item">
        <strong>Citas:</strong> <span class="citas-badge">${row.citas || 0}</span>
      </div>
      <div class="detail-item">
        <strong>Tema:</strong> ${row.tema || "N/A"}
      </div>
      <div class="detail-item">
        <strong>En DOAJ:</strong> ${row.enDoaj || "N/A"}
      </div>
      <div class="detail-item">
        <strong>Indexado en:</strong> ${row.indexadoEn || "N/A"}
      </div>
      <div class="detail-item">
        <strong>APC:</strong> ${row.apcPricing || "N/A"}
      </div>
    </div>

    ${generarAutoresHtml()}

    <div class="card-links">
      ${row.pdf ? `<a href="${row.pdf}" target="_blank" class="btn-pdf">📄 Descargar PDF</a>` : ""}
      ${!row.pdf && row.landing ? `<a href="${row.landing}" target="_blank" class="btn-landing">🔗 Ver en Open Access</a>` : ""}
      ${row.doi ? `<a href="https://doi.org/${row.doi}" target="_blank" class="btn-doi">DOI</a>` : ""}
    </div>
  `;

  container.appendChild(card);
}