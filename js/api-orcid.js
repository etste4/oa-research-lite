/**
 * API ORCID - Obtiene información del perfil de autor
 * Utiliza la API pública de ORCID (sin autenticación)
 * No incluye artículos para evitar duplicación con Crossref/OpenAlex
 */

export async function obtenerDatosAutorORCID(orcid) {
  if (!orcid || !/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(orcid)) {
    return null;
  }

  try {
    const url = `https://pub.orcid.org/v3.0/${orcid}`;
    
    const respuesta = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!respuesta.ok) {
      console.warn(`ORCID no encontrado o privado: ${orcid}`);
      return null;
    }

    const data = await respuesta.json();

    // Extraer información del perfil
    const nombreCompleto = extraerNombre(data);
    const email = extraerEmail(data);
    const pais = extraerPais(data);
    const institucion = extraerInstitucion(data);
    const biografia = extraerBiografia(data);
    const url_orcid = `https://orcid.org/${orcid}`;

    return {
      orcid,
      nombreCompleto,
      email,
      pais,
      institucion,
      biografia,
      url: url_orcid,
      activo: data["last-modified-date"] ? true : false
    };
  } catch (error) {
    console.error(`Error consultando ORCID ${orcid}:`, error);
    return null;
  }
}

function extraerNombre(data) {
  const name = data.person?.name;
  
  if (!name) return "Sin nombre";

  const given = name.given_names?.value || "";
  const family = name.family_name?.value || "";
  
  return `${given} ${family}`.trim() || "Sin nombre";
}

function extraerEmail(data) {
  const emails = data.person?.emails?.email;
  
  if (!Array.isArray(emails) || emails.length === 0) {
    return "";
  }

  // Retornar el email primario o el primero de la lista
  const emailPrimario = emails.find(e => e.primary);
  return (emailPrimario || emails[0])?.email || "";
}

function extraerPais(data) {
  const addresses = data.person?.addresses?.address;
  
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return "";
  }

  // El país está en formato de código ISO (ej: ES, US, MX)
  return addresses[0]?.country?.value || "";
}

function extraerInstitucion(data) {
  const employments = data["activities-summary"]?.employments?.["employment-summary"];
  
  if (!Array.isArray(employments) || employments.length === 0) {
    return "";
  }

  // Buscar el empleo más reciente
  const empleoMasReciente = employments.reduce((max, emp) => {
    const maxDate = max["start-date"]?.year?.value || 0;
    const empDate = emp["start-date"]?.year?.value || 0;
    return empDate > maxDate ? emp : max;
  });

  return empleoMasReciente?.["organization"]?.name || "";
}

function extraerBiografia(data) {
  const biography = data.person?.biography?.biography;
  return biography || "";
}

/**
 * Enriquecer artículos con información de ORCID del autor
 * @param {Array} articulos - Array de artículos procesados
 * @param {String} orcid - ORCID del autor principal
 * @returns {Array} - Artículos enriquecidos con datos de ORCID
 */
export async function enriquecerArticulosConORCID(articulos, orcid) {
  // Obtener datos del autor de ORCID
  const datosAutor = await obtenerDatosAutorORCID(orcid);

  if (!datosAutor) {
    return articulos;
  }

  // Añadir información de ORCID a cada artículo
  return articulos.map(articulo => ({
    ...articulo,
    autorORCID: {
      nombre: datosAutor.nombreCompleto,
      email: datosAutor.email,
      pais: datosAutor.pais,
      institucion: datosAutor.institucion,
      biografia: datosAutor.biografia,
      url: datosAutor.url,
      orcid: datosAutor.orcid
    }
  }));
}
