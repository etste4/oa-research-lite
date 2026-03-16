import { validarORCID, yearFromCrossrefItem } from "../utils/helpers.js";
import { buscarCrossrefPorORCID } from "./api-crossref.js";
import { limpiarTabla, agregarFila } from "./render.js";
import { buscarOAporDOI } from "./api-unpaywall.js";
import { validarORCID, yearFromCrossrefItem, obtenerAutores } from "../utils/helpers.js";

const btn = document.getElementById("searchBtn");
const input = document.getElementById("orcidInput");
const status = document.getElementById("status");

btn.addEventListener("click", async () => {
  const orcid = input.value.trim();

  console.log("Clic en consultar:", orcid);

  if (!validarORCID(orcid)) {
    status.textContent = "ORCID no válido";
    return;
  }

  limpiarTabla();
  status.textContent = "Consultando Crossref...";

  try {
    const items = await buscarCrossrefPorORCID(orcid);

    console.log("Resultados Crossref:", items);

    if (items.length === 0) {
      status.textContent = "No se encontraron resultados en Crossref";
      return;
    }

   for (const item of items) {

   const { primerAutor, todosAutores } = obtenerAutores(item); 
  const title = item.title?.[0] || "Sin título";
  const doi = item.DOI || "";
  const journal = item["container-title"]?.[0] || "";
  const year = yearFromCrossrefItem(item);
  const publisher = item.publisher || "";

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
    const locationConLanding = up.oa_locations.find(loc => loc.url || loc.url_for_landing_page);
    if (locationConLanding) {
      landing = locationConLanding.url || locationConLanding.url_for_landing_page;
    }
  }
}

}

agregarFila({
  title,
  doi,
  is_oa: estadoOA,
  journal,
  year,
  publisher,
  pdf,
  landing,
  primerAutor,
  todosAutores
});

}

    status.textContent = `Se encontraron ${items.length} resultados en Crossref`;
  } catch (error) {
    console.error("Error real:", error);
    status.textContent = "Error al consultar Crossref";
  }
});