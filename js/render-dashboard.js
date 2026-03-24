// Sistema de Renderizado de Gráficos del Dashboard
import {
  calcularEstadisticas,
  getTopDepartamentos,
  getOAPorDepartamento,
  getTopRevistas,
  getTopAutores,
  getSerieTemporalArticulos,
  getTopTemas,
  exportarDashboardCSV,
  limpiarDashboard
} from "./dashboard.js";

// Variables globales para gráficos (Chart.js)
let chartOA = null;
let chartTendencia = null;
let chartRevistas = null;
let chartAutores = null;

/**
 * Destruye todos los gráficos previos
 */
function destruirTodosLosGraficos() {
  if (chartTendencia) {
    chartTendencia.destroy();
    chartTendencia = null;
  }
  if (chartOA) {
    chartOA.destroy();
    chartOA = null;
  }
  if (chartRevistas) {
    chartRevistas.destroy();
    chartRevistas = null;
  }
  if (chartAutores) {
    chartAutores.destroy();
    chartAutores = null;
  }
  
  // Limpiar también los canvas del DOM
  const canvas = document.querySelectorAll('canvas[id^="chart"]');
  canvas.forEach(c => {
    if (c && c.parentNode) {
      c.remove();
    }
  });
}

/**
 * Renderiza el dashboard completo - VERSION SIMPLIFICADA
 */
function renderizarDashboard() {
  const container = document.getElementById('dashboardContainer');
  if (!container) {
    console.warn('Dashboard container no encontrado');
    return;
  }

  // Destruir todos los gráficos anteriores
  destruirTodosLosGraficos();
  
  // Limpiar completamente el contenedor
  container.innerHTML = '';

  const stats = calcularEstadisticas();

  // Limpiar contenedor
  container.innerHTML = '';

  // Tarjetas resumen (compacto)
  const resumenHTML = `
    <div class="dashboard-summary">
      <div class="stat-card">
        <div class="stat-value">${stats.totalArticulos}</div>
        <div class="stat-label">Artículos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.porcentajeOA}%</div>
        <div class="stat-label">Open Access</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Object.keys(stats.revistas).length}</div>
        <div class="stat-label">Revistas</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Object.keys(stats.temas).length}</div>
        <div class="stat-label">Temas</div>
      </div>
    </div>
  `;

  // Solo 1 gráfico pequeño: Tendencia
  const graficosHTML = `
    <div class="dashboard-charts compact">
      <div class="chart-container compact">
        <h3>Publicaciones por Año</h3>
        <canvas id="chartTendencia" height="100"></canvas>
      </div>

      <div class="chart-container compact">
        <h3>Temas de Investigación</h3>
        <div id="temasList" class="temas-list"></div>
      </div>

      <div class="chart-container compact">
        <h3>Top 5 Revistas</h3>
        <div id="revistasList" class="revistas-list"></div>
      </div>
    </div>
  `;

  container.innerHTML = resumenHTML + graficosHTML;

  // Esperar a que se renderice el DOM
  setTimeout(() => {
    renderizarGraficoTendenciaSimple();
    renderizarTemasSimplificado();
    renderizarRevistasSimplificadas();
  }, 100);
}

/**
 * Renderiza todos los gráficos con Chart.js
 */
function renderizarGraficos() {
  // Validar que los canvas existan
  if (!document.getElementById('chartTendencia')) return;
  
  renderizarGraficoTendencia();
  renderizarGraficoOA();
  renderizarGraficoRevistas();
  renderizarGraficoAutores();
}

/**
 * Gráfico de tendencia temporal
 */
function renderizarGraficoTendencia() {
  const datos = getSerieTemporalArticulos();
  if (datos.length === 0) return;

  const ctx = document.getElementById('chartTendencia');
  if (!ctx) return;

  // El gráfico anterior ya fue destruido en destruirTodosLosGraficos()
  chartTendencia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: datos.map(d => d.año),
      datasets: [{
        label: 'Artículos',
        data: datos.map(d => d.count),
        borderColor: '#1f6aa5',
        backgroundColor: 'rgba(31, 106, 165, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#0f3d63'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

/**
 * Gráfico de % OA por departamento
 */
function renderizarGraficoOA() {
  const oaData = getOAPorDepartamento();
  const departamentos = Object.keys(oaData);
  
  if (departamentos.length === 0) return;

  const ctx = document.getElementById('chartOA');
  if (!ctx) return;

  chartOA = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: departamentos,
      datasets: [{
        label: '% Open Access',
        data: departamentos.map(d => oaData[d]),
        backgroundColor: [
          '#1f7a4f', '#2ba76f', '#3db882', '#51c895', '#6dd4a8'
        ],
        borderColor: '#0d6e3c',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { 
          beginAtZero: true, 
          max: 100,
          ticks: { callback: value => value + '%' }
        }
      }
    }
  });
}

/**
 * Gráfico de revistas más usadas
 */
function renderizarGraficoRevistas() {
  const revistas = getTopRevistas(10);
  if (revistas.length === 0) return;

  const ctx = document.getElementById('chartRevistas');
  if (!ctx) return;

  if (chartRevistas) chartRevistas.destroy();

  chartRevistas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: revistas.map(r => r.revista.substring(0, 40)),
      datasets: [{
        label: 'Artículos',
        data: revistas.map(r => r.count),
        backgroundColor: '#0f3d63',
        borderColor: '#0a2740',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}

/**
 * Gráfico de autores más productivos
 */
function renderizarGraficoAutores() {
  const autores = getTopAutores(10);
  if (autores.length === 0) return;

  const ctx = document.getElementById('chartAutores');
  if (!ctx) return;

  if (chartAutores) chartAutores.destroy();

  chartAutores = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: autores.map(a => a.autor.substring(0, 20)),
      datasets: [{
        label: 'Artículos',
        data: autores.map(a => a.count),
        backgroundColor: '#1f6aa5',
        borderColor: '#0f3d63',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

/**
 * Renderiza lista de temas de investigación
 */
function renderizarTemas() {
  const temas = getTopTemas(8);
  const container = document.getElementById('temasList');
  
  if (!container || temas.length === 0) return;

  let html = '<div class="temas-grid">';
  temas.forEach(tema => {
    html += `
      <div class="tema-badge">
        <span class="tema-nombre">${tema.tema}</span>
        <span class="tema-count">${tema.count}</span>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Renderiza resumen por departamento
 */
function renderizarDetallesDepartamentos() {
  const depto = getTopDepartamentos(10);
  const container = document.getElementById('deptSummary');
  
  if (!container || depto.length === 0) return;

  let html = '<table class="dept-table"><thead><tr>';
  html += '<th>Departamento</th><th>Total</th><th>OA</th><th>Cerrado</th><th>Con PDF</th><th>% OA</th></tr></thead><tbody>';
  
  depto.forEach(d => {
    const porcentaje = d.total > 0 ? Math.round((d.oa / d.total) * 100) : 0;
    html += `<tr>
      <td><strong>${d.departamento}</strong></td>
      <td>${d.total}</td>
      <td style="color: #1f7a4f; font-weight: bold;">${d.oa}</td>
      <td style="color: #b91c1c;">${d.cerrado}</td>
      <td>${d.conPdf}</td>
      <td style="background: ${porcentaje > 50 ? '#d4f3e0' : '#fde4e4'}; font-weight: bold;">${porcentaje}%</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/**
 * Agrega event listeners a botones
 */
function agregarEventListeners() {
  const btnExportar = document.getElementById('btnExportarCSV');
  const btnLimpiar = document.getElementById('btnLimpiarDashboard');

  if (btnExportar) {
    btnExportar.addEventListener('click', () => {
      exportarDashboardCSV();
    });
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      if (confirm('¿Descartar todos los datos del dashboard?')) {
        limpiarDashboard();
        renderizarDashboard();
      }
    });
  }
}

/**
 * Actualiza solo los gráficos (sin recargar todo)
 */
function actualizarGraficos() {
  renderizarGraficos();
  renderizarTemas();
  renderizarDetallesDepartamentos();
  actualizarResumen();
}

/**
 * Actualiza las tarjetas resumen
 */
function actualizarResumen() {
  const stats = calcularEstadisticas();
  const cards = document.querySelectorAll('.stat-card');
  
  if (cards.length >= 5) {
    cards[0].querySelector('.stat-value').textContent = stats.totalDepartamentos;
    cards[1].querySelector('.stat-value').textContent = stats.totalArticulos;
    cards[2].querySelector('.stat-value').textContent = stats.porcentajeOA + '%';
    cards[3].querySelector('.stat-value').textContent = Object.keys(stats.revistas).length;
    cards[4].querySelector('.stat-value').textContent = Object.keys(stats.autores).length;
  }
}

export {
  renderizarDashboard,
  actualizarGraficos,
  actualizarResumen
};
