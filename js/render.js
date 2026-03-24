export function limpiarTabla() {
  const container = document.getElementById("resultsCards");
  if (!container) {
    console.warn('resultsCards container no encontrado');
    return;
  }
  container.innerHTML = "";
}

export function agregarFila(row) {
  const container = document.getElementById("resultsCards");
  if (!container) {
    console.warn('resultsCards container no encontrado');
    return;
  }

  const generarAutoresHtml = () => {
    if (!row.todosAutoresConAfiliacion || row.todosAutoresConAfiliacion.length === 0) {
      return `<div class="card-authors"><strong>Autor Principal:</strong> Sin información</div>`;
    }

    const primerAutor = row.todosAutoresConAfiliacion[0];
    const esPrimerAutorSearched = primerAutor.orcid === row.orcidBuscado;
    
    // Encontrar posición del autor buscado si NO es el primer autor
    let posicionAutorBuscado = null;
    if (!esPrimerAutorSearched && row.orcidBuscado) {
      posicionAutorBuscado = row.todosAutoresConAfiliacion.findIndex(a => a.orcid === row.orcidBuscado) + 1;
    }

    let html = `
      <div class="card-authors">
        <strong>Autor Principal:</strong>
        <ul class="authors-list">
          <li class="${esPrimerAutorSearched ? 'author-highlighted' : ''}">
            <span class="author-name">${primerAutor.nombre || "Sin nombre"}</span>
            ${primerAutor.institucion ? `<span class="author-affiliation">${primerAutor.institucion}${primerAutor.pais ? `, ${primerAutor.pais}` : ""}</span>` : ""}
            ${esPrimerAutorSearched ? `<span class="author-badge">👤 Tu ORCID - Posición 1/${row.todosAutoresConAfiliacion.length}</span>` : ""}
          </li>
        </ul>
        ${posicionAutorBuscado ? `<div style="margin-top: 8px; padding: 8px; background: #e8f5e9; border-left: 3px solid #4caf50; border-radius: 4px;"><strong style="color: #2e7d32;">Tu Posición:</strong> <span style="color: #388e3c;">#${posicionAutorBuscado}/${row.todosAutoresConAfiliacion.length}</span></div>` : ""}
    `;

    if (row.todosAutoresConAfiliacion.length > 1) {
      html += `
        <details class="more-authors">
          <summary>Ver todos (${row.todosAutoresConAfiliacion.length})</summary>
          <ul class="authors-list">
            ${row.todosAutoresConAfiliacion.slice(1).map((autor, idx) => {
              const esSearched = autor.orcid === row.orcidBuscado;
              return `
                <li class="${esSearched ? 'author-highlighted' : ''}">
                  <span class="author-name">${autor.nombre || "Sin nombre"}</span>
                  ${autor.institucion ? `<span class="author-affiliation">${autor.institucion}${autor.pais ? `, ${autor.pais}` : ""}</span>` : ""}
                  ${esSearched ? `<span class="author-badge">👤 Tu ORCID - Posición ${idx + 2}</span>` : ""}
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
      ${row.apcPricing ? `<div class="detail-item"><strong>APC:</strong> ${row.apcPricing}</div>` : ''}
      <div class="detail-item">
        <strong>PDF:</strong> ${row.pdf && row.pdf.trim() ? `<a href="${row.pdf}" target="_blank" style="color: #e74c3c; text-decoration: none;">📑 Acceso</a>` : '<span style="color: #95a5a6;">Sin acceso</span>'}
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