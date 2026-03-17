export async function buscarPaisEditorial(hostOrgId) {
  if (!hostOrgId) return null;

  try {
    const resp = await fetch(hostOrgId, {
      headers: { "Accept": "application/json" }
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    return data.country_code || null;
  } catch (error) {
    console.error("Error obteniendo país de editorial:", error);
    return null;
  }
}

export async function obtenerNombreAutorORCID(orcid) {
  if (!orcid) return null;

  const url = `https://api.openalex.org/authors/https://orcid.org/${orcid}`;

  try {
    const respuesta = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!respuesta.ok) {
      return null;
    }

    const data = await respuesta.json();
    return data.display_name || null;
  } catch (error) {
    console.error("Error obteniendo nombre del autor:", error);
    return null;
  }
}

export async function buscarOpenAlexPorORCID(orcid) {
  if (!orcid) return [];

  const url = `https://api.openalex.org/authors/https://orcid.org/${orcid}?per_page=200`;

  try {
    const respuesta = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!respuesta.ok) {
      console.log("OpenAlex: Autor no encontrado");
      return [];
    }

    const datosAutor = await respuesta.json();
    
    if (!datosAutor.works_count || datosAutor.works_count === 0) {
      return [];
    }

    // Obtener los works del autor
    const worksUrl = `https://api.openalex.org/works?filter=author.orcid:https://orcid.org/${orcid}&per_page=200&sort=publication_date:desc`;
    
    const worksResponse = await fetch(worksUrl, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!worksResponse.ok) {
      return [];
    }

    const worksData = await worksResponse.json();
    return worksData.results || [];

  } catch (error) {
    console.error("Error consultando OpenAlex por ORCID:", error);
    return [];
  }
}

export async function buscarOpenAlexPorDOI(doi) {
  if (!doi) return null;

  const doiLimpio = doi.replace(/^https?:\/\/doi\.org\//i, "").trim();
  const url = `https://api.openalex.org/works/https://doi.org/${doiLimpio}`;

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