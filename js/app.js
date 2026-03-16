import { validarORCID, yearFromCrossrefItem } from "../utils/helpers.js";
import { buscarCrossrefPorORCID } from "./api-crossref.js";
import { limpiarTabla, agregarFila } from "./render.js";

const btn = document.getElementById("searchBtn");
const input = document.getElementById("orcidInput");
const status = document.getElementById("status");

console.log("app.js cargado correctamente");

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
      const title = item.title?.[0] || "Sin título";
      const doi = item.DOI || "";
      const journal = item["container-title"]?.[0] || "";
      const year = yearFromCrossrefItem(item);
      const publisher = item.publisher || "";

      agregarFila({
        title,
        doi,
        is_oa: "Pendiente",
        journal,
        year,
        publisher
      });
    }

    status.textContent = `Se encontraron ${items.length} resultados en Crossref`;
  } catch (error) {
    console.error("Error real:", error);
    status.textContent = "Error al consultar Crossref";
  }
});