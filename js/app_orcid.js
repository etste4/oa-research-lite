import {
  validarORCID,
  yearFromCrossrefItem,
  obtenerAutores,
  obtenerAutoresDeOpenAlex,
  obtenerDatosOpenAlex
} from "../utils/helpers.js";

import { buscarCrossrefPorORCID } from "./api-crossref.js";
import { buscarOAporDOI } from "./api-unpaywall.js";
import { buscarOpenAlexPorDOI, buscarOpenAlexPorORCID, obtenerNombreAutorORCID } from "./api-openalex.js";
import { obtenerDatosAutorORCIDMejorado } from "./api-orcid.js";
import { limpiarTabla, agregarFila } from "./render.js";
import { agregarAlDashboard, limpiarDashboard } from "./dashboard.js";
import { renderizarDashboard } from "./render-dashboard-simple.js";

const btn = document.getElementById("searchBtn");
const input = document.getElementById("orcidInput");
const status = document.getElementById("status");

function actualizarResumen(resultados) {
  const totalArticulos = resultados.length;

  const totalOA = resultados.filter(r => r.is_oa && r.is_oa !== "closed").length;

  const totalPDF = resultados.filter(r => r.pdf && r.pdf.trim() !== "").length;

  const totalCitas = resultados.reduce((suma, r) => {
    return suma + (parseInt(r.citas) || 0);
  }, 0);

  const totalDOAJ = resultados.filter(r => r.enDoaj === "Sí").length;

  document.getElementById("totalArticulos").textContent = totalArticulos;
  document.getElementById("totalOA").textContent = totalOA;
  document.getElementById("totalPDF").textContent = totalPDF;
  document.getElementById("totalCitas").textContent = totalCitas;
  document.getElementById("totalDOAJ").textContent = totalDOAJ;
}

btn.addEventListener("click", async () => {
  const orcid = input.value.trim();

  console.log("Clic en consultar:", orcid);

  if (!validarORCID(orcid)) {
    status.textContent = "ORCID no válido";
    return;
  }

  limpiarTabla();
  limpiarDashboard();
  actualizarResumen([]);
  status.textContent = "Consultando ORCID, Crossref y OpenAlex...";

  try {
    let datosAutorORCID = null;
    
    // Obtener datos del perfil de ORCID (con fallback a OpenAlex)
    datosAutorORCID = await obtenerDatosAutorORCIDMejorado(orcid);
    
    if (datosAutorORCID) {
      console.log("Datos de perfil ORCID:", datosAutorORCID);
      // Mostrar info del autor en el div authorInfo
      const infoAutor = document.getElementById("authorInfo");
      if (infoAutor) {
        const restrictedClass = datosAutorORCID.restringido ? "restricted" : "";
        
        let contenidoInformacion = `
          <div class="author-profile ${restrictedClass}">
            <strong>${datosAutorORCID.nombreCompleto}</strong>
        `;
        
        if (!datosAutorORCID.restringido) {
          // Nombres alternativos - MEJORADO
          if (datosAutorORCID.nombresAlternativos && datosAutorORCID.nombresAlternativos.length > 0) {
            const tarjetasNombres = datosAutorORCID.nombresAlternativos.map(nombre =>
              `<span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; padding: 6px 12px; border-radius: 6px; font-size: 12px; margin: 4px 4px 4px 0; font-weight: 500;">${nombre}</span>`
            ).join("");
            contenidoInformacion += `<div style="margin-top: 10px; font-size: 13px; color: #666; font-weight: 600; margin-bottom: 6px;">También ha publicado como:</div><div>${tarjetasNombres}</div>`;
          }
          
          // Email, País, Institución en línea
          let linea = "";
          if (datosAutorORCID.email) linea += "📧 " + datosAutorORCID.email;
          if (datosAutorORCID.pais) linea += (linea ? " • " : "") + "🌍 " + datosAutorORCID.pais;
          if (datosAutorORCID.institucion) linea += (linea ? " • " : "") + "🏢 " + datosAutorORCID.institucion;
          
          if (linea) {
            contenidoInformacion += `<div style="font-size: 14px; margin-top: 8px; color: #555; font-weight: 500;">${linea}</div>`;
          }
          
          // Instituciones asociadas/Afiliaciones
          if (datosAutorORCID.institucionesConocidas && datosAutorORCID.institucionesConocidas.length > 0) {
            contenidoInformacion += `<div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #0369a1;">`;
            contenidoInformacion += `<div style="font-size: 14px; color: #0369a1; font-weight: 700; margin-bottom: 8px;">🏫 Instituciones Asociadas</div>`;
            datosAutorORCID.institucionesConocidas.forEach(inst => {
              if (inst.nombre) {
                contenidoInformacion += `<div style="font-size: 13px; color: #333; margin: 6px 0; padding: 8px; background: #f0f9ff; border-left: 3px solid #0ea5e9; border-radius: 3px;">${inst.nombre}${inst.pais ? " <span style='color: #666; font-size: 12px;'>(" + inst.pais + ")</span>" : ""}</div>`;
              }
            });
            contenidoInformacion += `</div>`;
          }
          
          // Educación
          if (datosAutorORCID.educacion && datosAutorORCID.educacion.length > 0) {
            contenidoInformacion += `<div style="margin-top: 8px; border-top: 1px solid rgba(31, 106, 165, 0.15); padding-top: 6px; font-size: 12px;">`;
            datosAutorORCID.educacion.forEach(edu => {
              if (edu.institucion) {
                contenidoInformacion += `<div>🎓 ${edu.institucion}${edu.grado ? " - " + edu.grado : ""}${edu.fin ? " (" + edu.fin + ")" : ""}</div>`;
              }
            });
            contenidoInformacion += `</div>`;
          }
        }
        
        contenidoInformacion += `</div>`;
        infoAutor.innerHTML = contenidoInformacion;
      }
    }

    const items = await buscarCrossrefPorORCID(orcid);

    console.log("Resultados Crossref:", items);

    if (items.length === 0) {
      status.textContent = "No se encontraron resultados en Crossref";
      return;
    }

    // Buscar también en OpenAlex para artículos adicionales
    status.textContent = "Consultando Crossref y OpenAlex...";
    const itemsOpenAlex = await buscarOpenAlexPorORCID(orcid);
    console.log("Resultados OpenAlex:", itemsOpenAlex);

    // Combinar resultados, evitando duplicados (same DOI)
    const doisEnCrossref = new Set(items.map(item => item.DOI?.toLowerCase()).filter(Boolean));
    const itemsUnicos = [...items];

    itemsOpenAlex.forEach(oaItem => {
      const doiOA = oaItem.doi?.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase();
      if (doiOA && !doisEnCrossref.has(doiOA)) {
        // Convertir formato OpenAlex al formato de Crossref para consistencia
        let year = oaItem.publication_date ? parseInt(oaItem.publication_date.split("-")[0]) : "";
        
        itemsUnicos.push({
          title: [oaItem.title],
          DOI: doiOA,
          "container-title": [oaItem.primary_location?.source?.display_name || "Sin revista"],
          author: obtenerAutoresDeOpenAlex(oaItem),
          publisher: oaItem.host_organization_name || "",
          "issued": year ? { "date-parts": [[year]] } : null,
          // Flag para identificar que vino de OpenAlex
          "_fromOpenAlex": true,
          "_openAlexData": oaItem
        });
      }
    });

    const resultadosProcesados = [];

    for (const item of itemsUnicos) {

  const { primerAutor, todosAutores } = obtenerAutores(item);
  const title = item.title?.[0] || "Sin título";
  const doi = item.DOI || "";
  const journal = item["container-title"]?.[0] || "";
  
  let itemCrossref = item;
  
  // Si el item vino de OpenAlex, buscar en Crossref por DOI para obtener datos correctos
  if (item._fromOpenAlex && doi) {
    try {
      const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
      if (response.ok) {
        const dataCrossref = await response.json();
        if (dataCrossref.message) {
          itemCrossref = dataCrossref.message;
        }
      }
    } catch (error) {
      console.log("No se encontró en Crossref por DOI, usando datos de OpenAlex");
    }
  }
  
  const year = yearFromCrossrefItem(itemCrossref) || (item.issued?.["date-parts"]?.[0]?.[0]) || "";
  let publisher = item.publisher || "";

  console.log(`[${title}] DOI de Crossref/OpenAlex:`, doi);

  let citas = "";
  let institucion = "";
  let pais = "";
  let publisherUrl = "";
  let tema = "";
  let enDoaj = "";
  let tipoPublicacion = "";
  let indexadoEn = "";
  let apcPricing = "";
  let todosAutoresConAfiliacion = [];

  let openAlex = null;

  // Si el item vino de OpenAlex, ya tenemos los datos
  if (item._fromOpenAlex && item._openAlexData) {
    openAlex = item._openAlexData;
    // Si viene de OpenAlex por ORCID, hacer búsqueda por DOI para obtener detalles completos
    if (doi) {
      const openAlexDetallado = await buscarOpenAlexPorDOI(doi);
      if (openAlexDetallado) {
        openAlex = openAlexDetallado;
      }
    }
  } else if (doi) {
    // Si vino de Crossref, buscamos en OpenAlex por DOI
    openAlex = await buscarOpenAlexPorDOI(doi);
  }

  if (openAlex) {
    const datosOA = obtenerDatosOpenAlex(openAlex, doi);

    citas = datosOA.citas;
    institucion = datosOA.institucion;
    pais = datosOA.pais;
    publisher = datosOA.publisher; // Siempre asignar desde OpenAlex (puede estar vacío)
    publisherUrl = datosOA.publisherUrl;
    tema = datosOA.tema;
    enDoaj = datosOA.enDoaj;
    tipoPublicacion = datosOA.tipoPublicacion;
    indexadoEn = datosOA.indexadoEn;
    apcPricing = datosOA.apcPricing;
    todosAutoresConAfiliacion = datosOA.autoresConAfiliacion;
  }

  let estadoOA = "closed";
  let pdf = "";
  let landing = "";

  if (doi) {
    const up = await buscarOAporDOI(doi);

    if (up && up.is_oa) {
      estadoOA = up.oa_status || "OA";

      if (up.best_oa_location) {
        landing = up.best_oa_location.url || up.best_oa_location.url_for_landing_page || "";

        if (up.best_oa_location.url_for_pdf) {
          pdf = up.best_oa_location.url_for_pdf;
        }
      }

      if (!pdf && Array.isArray(up.oa_locations)) {
        const locationConPdf = up.oa_locations.find(loc => loc.url_for_pdf);
        if (locationConPdf) {
          pdf = locationConPdf.url_for_pdf;
        }
      }

      if (!landing && Array.isArray(up.oa_locations)) {
        const locationConLanding = up.oa_locations.find(
          loc => loc.url || loc.url_for_landing_page
        );
        if (locationConLanding) {
          landing = locationConLanding.url || locationConLanding.url_for_landing_page;
        }
      }
    }
  }

  const fila = {
  title,
  doi,
  is_oa: estadoOA,
  journal,
  year,
  publisher,
  publisherUrl,
  pdf,
  landing,
  primerAutor,
  todosAutores,
  citas,
  institucion,
  pais,
  tema,
  enDoaj,
  tipoPublicacion,
  indexadoEn,
  apcPricing,
  todosAutoresConAfiliacion,
  orcidBuscado: orcid,
  datosAutorORCID: datosAutorORCID
};

resultadosProcesados.push(fila);
agregarFila(fila);
}

actualizarResumen(resultadosProcesados);

    // Agregar datos al dashboard
    const personaParaDashboard = {
      nombre: `${datosAutorORCID?.nombreCompleto || orcid}`,
      orcid: orcid,
      departamento: "ORCID Directo"
    };
    agregarAlDashboard(personaParaDashboard, resultadosProcesados);
    
    // Renderizar el dashboard
    renderizarDashboard(personaParaDashboard);

    status.textContent = `Se encontraron ${resultadosProcesados.length} artículos (Crossref + OpenAlex)`;
  } catch (error) {
    console.error("Error real:", error);
    status.textContent = "Error al consultar Crossref";
  }
});

