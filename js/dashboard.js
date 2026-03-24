// Sistema de Dashboard para Estadísticas Institucionales
// Almacena y agrega datos de búsquedas para análisis institucional

let datosDashboard = {
  articulosPorDepartamento: {},
  articulosPorAño: {},
  articulosPorEstadoOA: {
    oa: 0,
    cerrado: 0
  },
  revistasMasUsadas: {},
  autoresMasProductivos: {},
  totalArticulosUnicos: new Set(),  // Para evitar duplicados
  articulosPorDepto: {}, // { depto: [articulos] } para análisis posterior
  tema: {}
};

/**
 * Agrega datos de una búsqueda de investigador al dashboard
 * Se llama después de cada búsqueda exitosa
 */
function agregarAlDashboard(datosPersona, articulos) {
  if (!articulos || !Array.isArray(articulos)) return;

  const departamento = datosPersona.departamento || "Sin Departamento";
  
  // Inicializar departamento si no existe
  if (!datosDashboard.articulosPorDepartamento[departamento]) {
    datosDashboard.articulosPorDepartamento[departamento] = {
      total: 0,
      oa: 0,
      cerrado: 0,
      conPdf: 0
    };
    datosDashboard.articulosPorDepto[departamento] = [];
  }

  articulos.forEach(articulo => {
    const doi = articulo.DOI || articulo.doi;
    
    // Evitar duplicados usando Set
    if (!datosDashboard.totalArticulosUnicos.has(doi)) {
      datosDashboard.totalArticulosUnicos.add(doi);

      // 1. Contar artículos por departamento
      datosDashboard.articulosPorDepartamento[departamento].total++;

      // 2. Contar por estado OA
      if (articulo.estado_oa === "oa" || articulo.is_oa === true) {
        datosDashboard.articulosPorDepartamento[departamento].oa++;
        datosDashboard.articulosPorEstadoOA.oa++;
      } else {
        datosDashboard.articulosPorDepartamento[departamento].cerrado++;
        datosDashboard.articulosPorEstadoOA.cerrado++;
      }

      // 3. Contar PDFs disponibles
      if (articulo.pdf_disponible || articulo.tieneArchivoPdf) {
        datosDashboard.articulosPorDepartamento[departamento].conPdf++;
      }

      // 4. Registrar por año
      const año = articulo.year || articulo.año || articulo.published_date?.substring(0, 4) || "Desconocido";
      if (!datosDashboard.articulosPorAño[año]) {
        datosDashboard.articulosPorAño[año] = 0;
      }
      datosDashboard.articulosPorAño[año]++;

      // 5. Contar revistas
      const revista = articulo.journal || articulo.revista || articulo.container_title || "Desconocida";
      if (!datosDashboard.revistasMasUsadas[revista]) {
        datosDashboard.revistasMasUsadas[revista] = 0;
      }
      datosDashboard.revistasMasUsadas[revista]++;

      // 6. Contar temas
      const tema = articulo.tema || articulo.primary_topic?.display_name || "Otros";
      if (!datosDashboard.tema[tema]) {
        datosDashboard.tema[tema] = 0;
      }
      datosDashboard.tema[tema]++;

      // 7. Contar autores más productivos
      if (articulo.autores && Array.isArray(articulo.autores)) {
        articulo.autores.forEach(autor => {
          const nombreAutor = autor.nombre || autor.name || "Anónimo";
          if (!datosDashboard.autoresMasProductivos[nombreAutor]) {
            datosDashboard.autoresMasProductivos[nombreAutor] = 0;
          }
          datosDashboard.autoresMasProductivos[nombreAutor]++;
        });
      }

      // Guardar artículo completo para ese departamento
      datosDashboard.articulosPorDepto[departamento].push(articulo);
    }
  });

  // Guardar en localStorage para persistencia
  guardarDashboardLocal();
}

/**
 * Calcula estadísticas generales del dashboard
 */
function calcularEstadisticas() {
  const stats = {
    totalDepartamentos: Object.keys(datosDashboard.articulosPorDepartamento).length,
    totalArticulos: datosDashboard.totalArticulosUnicos.size,
    porcentajeOA: 0,
    departamentos: datosDashboard.articulosPorDepartamento,
    años: datosDashboard.articulosPorAño,
    revistas: datosDashboard.revistasMasUsadas,
    autores: datosDashboard.autoresMasProductivos,
    temas: datosDashboard.tema
  };

  // Calcular % OA
  const totalOA = datosDashboard.articulosPorEstadoOA.oa;
  const totalCerrado = datosDashboard.articulosPorEstadoOA.cerrado;
  const totalGeneral = totalOA + totalCerrado;
  stats.porcentajeOA = totalGeneral > 0 ? Math.round((totalOA / totalGeneral) * 100) : 0;

  return stats;
}

/**
 * Obtiene top N departamentos por cantidad de artículos
 */
function getTopDepartamentos(n = 5) {
  return Object.entries(datosDashboard.articulosPorDepartamento)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, n)
    .map(([depto, data]) => ({ departamento: depto, ...data }));
}

/**
 * Obtiene % OA por departamento
 */
function getOAPorDepartamento() {
  const result = {};
  Object.entries(datosDashboard.articulosPorDepartamento).forEach(([depto, data]) => {
    const total = data.total;
    result[depto] = total > 0 ? Math.round((data.oa / total) * 100) : 0;
  });
  return result;
}

/**
 * Obtiene top N revistas
 */
function getTopRevistas(n = 10) {
  return Object.entries(datosDashboard.revistasMasUsadas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([revista, count]) => ({ revista, count }));
}

/**
 * Obtiene top N autores más productivos
 */
function getTopAutores(n = 10) {
  return Object.entries(datosDashboard.autoresMasProductivos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([autor, count]) => ({ autor, count }));
}

/**
 * Obtiene artículos ordenados por año
 */
function getSerieTemporalArticulos() {
  return Object.entries(datosDashboard.articulosPorAño)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([año, count]) => ({ año, count }));
}

/**
 * Obtiene top N temas de investigación
 */
function getTopTemas(n = 8) {
  return Object.entries(datosDashboard.tema)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tema, count]) => ({ tema, count }));
}

/**
 * Guarda dashboard en localStorage
 */
function guardarDashboardLocal() {
  try {
    // Convertir Set a Array para localStorage
    const datosGuardar = {
      ...datosDashboard,
      totalArticulosUnicos: Array.from(datosDashboard.totalArticulosUnicos)
    };
    localStorage.setItem('oaResearchDashboard', JSON.stringify(datosGuardar));
  } catch (e) {
    console.warn('No se pudo guardar dashboard en localStorage:', e);
  }
}

/**
 * Carga dashboard desde localStorage
 */
function cargarDashboardLocal() {
  try {
    const datos = localStorage.getItem('oaResearchDashboard');
    if (datos) {
      const parsed = JSON.parse(datos);
      datosDashboard = {
        ...parsed,
        totalArticulosUnicos: new Set(parsed.totalArticulosUnicos)
      };
      console.log('Dashboard cargado desde localStorage');
    }
  } catch (e) {
    console.warn('No se pudo cargar dashboard de localStorage:', e);
  }
}

/**
 * Limpia tous los datos del dashboard
 */
function limpiarDashboard() {
  datosDashboard = {
    articulosPorDepartamento: {},
    articulosPorAño: {},
    articulosPorEstadoOA: { oa: 0, cerrado: 0 },
    revistasMasUsadas: {},
    autoresMasProductivos: {},
    totalArticulosUnicos: new Set(),
    articulosPorDepto: {},
    tema: {}
  };
  localStorage.removeItem('oaResearchDashboard');
  console.log('Dashboard limpiado');
}

/**
 * Exporta datos en formato CSV
 */
function exportarDashboardCSV() {
  let csv = "Departamento,Total Artículos,Open Access,Cerrado,Con PDF,% OA\n";
  
  Object.entries(datosDashboard.articulosPorDepartamento).forEach(([depto, data]) => {
    const porcentaje = data.total > 0 ? Math.round((data.oa / data.total) * 100) : 0;
    csv += `"${depto}",${data.total},${data.oa},${data.cerrado},${data.conPdf},${porcentaje}%\n`;
  });

  // Crear blob y descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dashboard-oa-research-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// Cargar datos al iniciar
cargarDashboardLocal();

export {
  agregarAlDashboard,
  calcularEstadisticas,
  getTopDepartamentos,
  getOAPorDepartamento,
  getTopRevistas,
  getTopAutores,
  getSerieTemporalArticulos,
  getTopTemas,
  limpiarDashboard,
  exportarDashboardCSV
};
