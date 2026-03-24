/**
 * API ORCID - Obtiene información del perfil de autor
 * Utiliza la API pública de ORCID (sin autenticación)
 * No incluye artículos para evitar duplicación con Crossref/OpenAlex
 */

export async function obtenerDatosAutorORCID(orcid) {
  if (!orcid || !/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(orcid)) {
    console.warn(`ORCID inválido: ${orcid}`);
    return null;
  }

  try {
    const url = `https://pub.orcid.org/v3.0/${orcid}`;
    
    console.log(`Consultando ORCID API: ${url}`);
    
    const respuesta = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!respuesta.ok) {
      console.warn(`Error ORCID ${respuesta.status}: ${respuesta.statusText}`);
      return null;
    }

    const data = await respuesta.json();
    console.log("Respuesta ORCID completa:", data);
    console.log("Estructura person:", data.person);
    console.log("Estructura person.name:", data.person?.name);
    console.log("given_names:", data.person?.name?.given_names);
    console.log("family_name:", data.person?.name?.family_name);

    // Extraer información del perfil
    const nombreCompleto = extraerNombre(data);
    
    // Si no hay nombre, el perfil está restringido
    if (!nombreCompleto) {
      console.warn(`Perfil ORCID ${orcid} está restringido o vacío`);
      return {
        orcid,
        nombreCompleto: "Perfil restringido",
        email: "",
        pais: "",
        institucion: "",
        biografia: "",
        url: `https://orcid.org/${orcid}`,
        activo: true,
        restringido: true
      };
    }
    
    const email = extraerEmail(data);
    const pais = extraerPais(data);
    const institucion = extraerInstitucion(data);
    const biografia = extraerBiografia(data);
    const palabrasClaveInvestigacion = extraerPalabrasClaveInvestigacion(data);
    const identificadoresExternos = extraerIdentificadoresExternos(data);
    const educacion = extraerEducacion(data);
    const url_orcid = `https://orcid.org/${orcid}`;

    console.log("Datos extraídos:", { nombreCompleto, email, pais, institucion });

    return {
      orcid,
      nombreCompleto,
      email,
      pais,
      institucion,
      biografia,
      palabrasClaveInvestigacion,
      identificadoresExternos,
      educacion,
      url: url_orcid,
      activo: data["last-modified-date"] ? true : false,
      restringido: false,
      fuente: "ORCID"
    };
  } catch (error) {
    console.error(`Error consultando ORCID ${orcid}:`, error.message);
    return null;
  }
}

function extraerNombre(data) {
  // Intentar múltiples rutas de acceso al nombre
  let nombreCompleto = "";
  
  // Ruta 1: person.name.given_names y family_name
  if (data.person?.name) {
    const given = data.person.name.given_names?.value || "";
    const family = data.person.name.family_name?.value || "";
    nombreCompleto = `${given} ${family}`.trim();
  }
  
  // Ruta 2: Si no funciona, intentar acceso directo
  if (!nombreCompleto && data.person?.display_name) {
    nombreCompleto = data.person.display_name;
  }
  
  // Ruta 3: Si todo falla
  if (!nombreCompleto) {
    console.warn("No se pudo extraer el nombre de ORCID");
    return null; // Retornar null en lugar de un nombre genérico
  }
  
  console.log(`Nombre extraído: "${nombreCompleto}"`);
  return nombreCompleto;
}

function extraerEmail(data) {
  const emails = data.person?.emails?.email;
  
  if (!Array.isArray(emails) || emails.length === 0) {
    return "";
  }

  const emailPrimario = emails.find(e => e.primary);
  return (emailPrimario || emails[0])?.email || "";
}

function extraerPais(data) {
  const addresses = data.person?.addresses?.address;
  
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return "";
  }

  return addresses[0]?.country?.value || "";
}

function extraerInstitucion(data) {
  const employments = data["activities-summary"]?.employments?.["employment-summary"];
  
  if (!Array.isArray(employments) || employments.length === 0) {
    return "";
  }

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

function extraerPalabrasClaveInvestigacion(data) {
  const keywords = data.person?.keywords?.keyword;
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return [];
  }
  return keywords.map(k => k.value || k).slice(0, 5); // Máximo 5 palabras clave
}

function extraerIdentificadoresExternos(data) {
  const externalIds = data.person?.["external-identifiers"]?.["external-identifier"];
  if (!Array.isArray(externalIds) || externalIds.length === 0) {
    return {};
  }

  const ids = {};
  externalIds.forEach(id => {
    if (id["external-id-type"] && id["external-id-value"]) {
      ids[id["external-id-type"]] = id["external-id-value"];
    }
  });
  return ids;
}

function extraerEducacion(data) {
  const educations = data["activities-summary"]?.educations?.["education-summary"];
  if (!Array.isArray(educations) || educations.length === 0) {
    return [];
  }
  
  return educations.slice(0, 3).map(edu => ({
    institucion: edu.organization?.name || "",
    grado: edu["role-title"] || "",
    inicio: edu["start-date"]?.year?.value || "",
    fin: edu["end-date"]?.year?.value || ""
  }));
}

/**
 * Obtener datos del autor desde OpenAlex (alternativa más confiable)
 */
export async function obtenerDatosAutorDesdeOpenAlex(orcid) {
  if (!orcid) return null;

  const url = `https://api.openalex.org/authors/https://orcid.org/${orcid}`;

  try {
    console.log(`Consultando OpenAlex API para autor: ${url}`);
    
    const respuesta = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!respuesta.ok) {
      console.warn(`Error OpenAlex ${respuesta.status}`);
      return null;
    }

    const data = await respuesta.json();
    console.log("Respuesta OpenAlex completa:", data);

    if (!data.display_name) {
      return null;
    }

    // Extraer palabras clave de las áreas de investigación
    let palabrasClaveInvestigacion = [];
    if (data.topics && Array.isArray(data.topics)) {
      palabrasClaveInvestigacion = data.topics
        .slice(0, 5)
        .map(t => t.display_name || t)
        .filter(Boolean);
    }

    // Extraer nombres alternativos
    let nombresAlternativos = [];
    if (data.display_name_alternatives && Array.isArray(data.display_name_alternatives)) {
      nombresAlternativos = data.display_name_alternatives.slice(0, 3);
    }

    // Extraer instituciones conocidas
    let institucionesConocidas = [];
    if (data.affiliations && Array.isArray(data.affiliations)) {
      institucionesConocidas = data.affiliations
        .slice(0, 3)
        .map(aff => ({
          nombre: aff.institution?.display_name || "",
          pais: aff.institution?.country_code || "",
          años: `${aff.start_year || ""}${aff.end_year ? " - " + aff.end_year : ""}`
        }))
        .filter(aff => aff.nombre);
    }

    // Extraer más información disponible
    return {
      orcid,
      nombreCompleto: data.display_name || "Sin nombre",
      nombresAlternativos: nombresAlternativos,
      email: "",
      pais: data.last_known_institution?.country_code || "",
      institucion: data.last_known_institution?.display_name || "",
      biografia: data.bio || "",
      url: `https://orcid.org/${orcid}`,
      palabrasClaveInvestigacion: palabrasClaveInvestigacion,
      institucionesConocidas: institucionesConocidas,
      identificadoresExternos: {},
      educacion: [],
      activo: true,
      restringido: false,
      fuente: "OpenAlex"
    };
  } catch (error) {
    console.error(`Error en OpenAlex para ${orcid}:`, error.message);
    return null;
  }
}

/**
 * Versión mejorada: Intenta OpenAlex primero (más completo), luego ORCID
 */
export async function obtenerDatosAutorORCIDMejorado(orcid) {
  // Primero intentar OpenAlex (más confiable para datos personales)
  const datosOpenAlex = await obtenerDatosAutorDesdeOpenAlex(orcid);
  
  if (datosOpenAlex && datosOpenAlex.nombreCompleto && datosOpenAlex.nombreCompleto !== "Sin nombre") {
    console.log("Datos obtenidos desde OpenAlex primero");
    
    // Intentar traer educación desde ORCID como complemento
    const datosORCID = await obtenerDatosAutorORCID(orcid);
    if (datosORCID && datosORCID.educacion && datosORCID.educacion.length > 0) {
      datosOpenAlex.educacion = datosORCID.educacion;
      datosOpenAlex.palabrasClaveInvestigacion = datosORCID.palabrasClaveInvestigacion || datosOpenAlex.palabrasClaveInvestigacion;
    }
    
    return datosOpenAlex;
  }

  // Si OpenAlex falla, intentar ORCID
  console.log("OpenAlex no disponible, intentando ORCID...");
  const datosORCID = await obtenerDatosAutorORCID(orcid);
  
  if (datosORCID && !datosORCID.restringido) {
    console.log("Datos obtenidos desde ORCID");
    return datosORCID;
  }

  // Si ambos fallan, retornar null
  return null;
}
