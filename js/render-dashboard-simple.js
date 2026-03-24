// Sistema de Renderizado de Gráficos del Dashboard - VERSIÓN SIMPLIFICADA
import {
  calcularEstadisticas,
  getTopTemas,
  getTopRevistas,
  getSerieTemporalArticulos
} from "./dashboard.js";

// Variables globales para gráficos (Chart.js)
let chartTendencia = null;

/**
 * Destruye todos los gráficos previos
 */
function destruirTodosLosGraficos() {
  if (chartTendencia) {
    chartTendencia.destroy();
    chartTendencia = null;
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
 * Renderiza el dashboard completo - VERSION SIMPLIFICADA Y COMPACTA
 */
function renderizarDashboard(persona = {}) {
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

  // Título del investigador
  const nombreInvestigador = persona.nombre || 'Investigador';
  const resumenHTML = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
      <h2 style="margin: 0; font-size: 24px; font-weight: bold;">${nombreInvestigador}</h2>
    </div>
  `;

  // Solo visualizaciones pequeñas: 1 gráfico + 3 columnas (temas, revistas, años)
  const graficosHTML = `
    <div class="dashboard-charts compact">
      <div class="chart-container compact" style="grid-column: 1 / -1;">
        <h3>📈 Publicaciones por Año</h3>
        <div style="position: relative; width: 100%; height: 160px;">
          <canvas id="chartTendencia"></canvas>
        </div>
      </div>

      <div class="chart-container compact">
        <h3>🏷️ Top Temas</h3>
        <div id="temasList" class="temas-list"></div>
      </div>

      <div class="chart-container compact">
        <h3>📰 Top 5 Revistas</h3>
        <div id="revistasList" class="revistas-list"></div>
      </div>

      <div class="chart-container compact">
        <h3>📅 Artículos por Año</h3>
        <div id="añosList" class="años-list"></div>
      </div>
    </div>
  `;

  container.innerHTML = resumenHTML + graficosHTML;

  // Esperar a que se renderice el DOM - AUMENTADO A 200ms
  setTimeout(() => {
    console.log('Inicializando dashboard...');
    renderizarGraficoTendenciaSimple();
    renderizarTemasSimplificado();
    renderizarRevistasSimplificadas();
    renderizarAñosSimplificado();
  }, 200);
}

/**
 * Gráfico de tendencia temporal PEQUEÑO Y SIMPLE
 */
function renderizarGraficoTendenciaSimple() {
  const datos = getSerieTemporalArticulos();
  console.log('Datos de tendencia:', datos);
  
  if (datos.length === 0) {
    console.warn('No hay datos para la tendencia');
    return;
  }

  const ctx = document.getElementById('chartTendencia');
  console.log('Canvas encontrado:', !!ctx);
  
  if (!ctx) {
    console.error('Canvas #chartTendencia no encontrado');
    return;
  }

  try {
    chartTendencia = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datos.map(d => d.año),
        datasets: [{
          label: 'Artículos',
          data: datos.map(d => d.count),
          borderColor: '#1f6aa5',
          backgroundColor: 'rgba(31, 106, 165, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#0f3d63',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            ticks: { stepSize: 1 }
          }
        }
      }
    });
    console.log('Gráfico creado exitosamente');
  } catch (error) {
    console.error('Error creando gráfico:', error);
  }
}

/**
 * Lista de temas TOP 5 (sin gráfico)
 */
function renderizarTemasSimplificado() {
  const temas = getTopTemas(5);
  const container = document.getElementById('temasList');
  
  if (!container || temas.length === 0) return;

  let html = '<div style="display: flex; flex-direction: column; gap: 6px;">';
  temas.forEach((tema, idx) => {
    html += `
      <div style="background: #fef3c7; border-left: 3px solid #fcd34d; padding: 6px 10px; border-radius: 4px; font-size: 12px;">
        <strong>${idx + 1}. ${tema.tema}</strong> (${tema.count})
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Lista de revistas TOP 5 (sin gráfico)
 */
function renderizarRevistasSimplificadas() {
  const revistas = getTopRevistas(5);
  const container = document.getElementById('revistasList');
  
  if (!container || revistas.length === 0) return;

  let html = '<ol style="margin: 0; padding-left: 16px; font-size: 12px; line-height: 1.8;">';
  revistas.forEach(r => {
    let titulo = r.revista.substring(0, 45);
    if (titulo.length < r.revista.length) titulo += '...';
    html += `<li><strong>${titulo}</strong> (${r.count})</li>`;
  });
  html += '</ol>';

  container.innerHTML = html;
}

/**
 * Lista de artículos por año
 */
function renderizarAñosSimplificado() {
  const datos = getSerieTemporalArticulos();
  const container = document.getElementById('añosList');
  
  if (!container || datos.length === 0) return;

  let html = '<div style="display: flex; flex-direction: column; gap: 6px;">';
  datos.sort((a, b) => b.año - a.año).forEach(item => {
    html += `
      <div style="background: #dbeafe; border-left: 3px solid #0ea5e9; padding: 6px 10px; border-radius: 4px; font-size: 12px;">
        <strong>${item.año}</strong>: <strong>${item.count}</strong> artículos
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

export {
  renderizarDashboard
};
