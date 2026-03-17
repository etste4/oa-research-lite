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
import { limpiarTabla, agregarFila } from "./render.js";

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
  actualizarResumen([]);
  status.textContent = "Consultando Crossref y OpenAlex...";

  try {
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
        const year = oaItem.publication_date ? parseInt(oaItem.publication_date.split("-")[0]) : "";
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
  const year = yearFromCrossrefItem(item) || (item.issued?.["date-parts"]?.[0]?.[0]) || "";
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
  orcidBuscado: orcid
};

resultadosProcesados.push(fila);
agregarFila(fila);
}

actualizarResumen(resultadosProcesados);

    status.textContent = `Se encontraron ${resultadosProcesados.length} artículos (Crossref + OpenAlex)`;
  } catch (error) {
    console.error("Error real:", error);
    status.textContent = "Error al consultar Crossref";
  }
});

