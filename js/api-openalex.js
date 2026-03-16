export async function buscarOpenAlexPorDOI(doi) {
  if (!doi) return null;

  const doiLimpio = doi.replace(/^https?:\/\/doi\.org\//i, "").trim();
  const url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doiLimpio)}`;

  try {
    const respuesta = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!respuesta.ok) {
      return null;
    }

    return await respuesta.json();
  } catch (error) {
    console.error("Error consultando OpenAlex:", error);
    return null;
  }
}