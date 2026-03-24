export function validarORCID(orcid) {
  return /^\d{4}-\d{4}-\d{4}-\d{4}$/.test(orcid);
}

export function yearFromCrossrefItem(item) {
  // Priorizar journal-issue.published-online (es más confiable)
  const fields = [
    item["journal-issue"]?.["published-online"],
    item["published-print"],
    item["published-online"],
    item["issued"]
  ];

  let bestYear = null; // Guardar el mejor año encontrado
  let year1969 = null; // Guardar 1969 como fallback

  for (const f of fields) {
    if (f && f["date-parts"] && f["date-parts"][0] && f["date-parts"][0][0]) {
      const year = f["date-parts"][0][0];
      
      // Si encuentra un año válido (no 1969, >= 1900, <= actual), usarlo
      if (year !== 1969 && year >= 1900 && year <= new Date().getFullYear()) {
        return year;
      }
      
      // Guardar 1969 como último recurso
      if (year === 1969 && !year1969) {
        year1969 = year;
      }
    }
  }

  // Si no encontró nada mejor, retornar 1969 si lo encontró
  return year1969 || "";
}

export function obtenerAutores(item) {
  if (!item.author || !Array.isArray(item.author)) {
    return {
      primerAutor: "Sin autor",
      todosAutores: []
    };
  }

  const autores = item.author.map(a => {
    const given = a.given || "";
    const family = a.family || "";
    return `${given} ${family}`.trim();
  }).filter(Boolean);

  return {
    primerAutor: autores[0] || "Sin autor",
    todosAutores: autores
  };
}

export function obtenerAutoresDeOpenAlex(oaItem) {
  if (!oaItem.authorships || !Array.isArray(oaItem.authorships)) {
    return [];
  }

  return oaItem.authorships.map(authorship => {
    const name = authorship.author?.display_name || "";
    return {
      family: name.split(" ").pop(),
      given: name.split(" ").slice(0, -1).join(" ")
    };
  });
}
export function obtenerDatosOpenAlex(openAlexItem, doiOriginal) {
  if (!openAlexItem) {
    return {
      citas: "",
      institucion: "",
      pais: "",
      publisher: "",
      publisherUrl: "",
      tema: "",
      enDoaj: "",
      tipoPublicacion: "",
      indexadoEn: "",
      apcPricing: "",
      autoresConAfiliacion: []
    };
  }

  // VALIDACIÓN: El DOI de la respuesta debe coincidir con el que enviamos
  const doiAlexLimpio = openAlexItem.doi?.replace(/^https?:\/\/doi\.org\//i, "").trim().toLowerCase() || "";
  const doiOriginalLimpio = doiOriginal?.replace(/^https?:\/\/doi\.org\//i, "").trim().toLowerCase() || "";

  if (doiAlexLimpio && doiOriginalLimpio && doiAlexLimpio !== doiOriginalLimpio) {
    console.warn(`DOI Mismatch! Enviado: ${doiOriginalLimpio}, Recibido: ${doiAlexLimpio}`);
    return {
      citas: "",
      institucion: "",
      pais: "",
      publisher: "",
      publisherUrl: "",
      tema: "",
      enDoaj: "",
      tipoPublicacion: "",
      indexadoEn: "",
      apcPricing: "",
      autoresConAfiliacion: []
    };
  }

  const citas = openAlexItem.cited_by_count ?? "";

  let institucion = "";
  let pais = "";
  let publisher = "";
  let publisherUrl = "";
  let autoresConAfiliacion = [];

  // Extraer autores con afiliaciones
  if (Array.isArray(openAlexItem.authorships) && openAlexItem.authorships.length > 0) {
    autoresConAfiliacion = openAlexItem.authorships.map(authorship => {
      const nombre = authorship.author?.display_name || "Sin nombre";
      const instituciones = authorship.institutions || [];
      const institucion = instituciones.length > 0 ? instituciones[0].display_name : "";
      const pais = instituciones.length > 0 ? instituciones[0].country_code : "";
      const orcid = authorship.author?.orcid?.replace(/^https?:\/\/orcid\.org\//i, "") || "";
      
      return {
        nombre,
        institucion,
        pais,
        orcid
      };
    });

    // Obtener institución y país del primer autor
    if (autoresConAfiliacion.length > 0) {
      institucion = autoresConAfiliacion[0].institucion || "";
      pais = autoresConAfiliacion[0].pais || "";
    }
  }

  // Extraer información de la editorial
  // Obtener nombre de la editorial (host_organization_name está en primary_location.source)
  if (openAlexItem.primary_location?.source?.host_organization_name) {
    publisher = openAlexItem.primary_location.source.host_organization_name;
  }
  
  // Obtener URL de la organización anfitriona (host_organization_lineage)
  if (Array.isArray(openAlexItem.primary_location?.source?.host_organization_lineage) && openAlexItem.primary_location.source.host_organization_lineage.length > 0) {
    publisherUrl = openAlexItem.primary_location.source.host_organization_lineage[0];
  }

  const tema = openAlexItem.primary_topic?.display_name || "";

  let enDoaj = "";
  if (openAlexItem.primary_location?.source?.is_in_doaj === true) {
    enDoaj = "Sí";
  } else if (openAlexItem.primary_location?.source?.is_in_doaj === false) {
    enDoaj = "No";
  }

  // TIPO DE PUBLICACIÓN
  const tipoPublicacion = mapearTipoPublicacion(openAlexItem.type);

  // RANKING/INFO DE REVISTA
  const indexadoEn = obtenerIndexadoEn(openAlexItem);

  // APC PRICING
  const apcPricing = openAlexItem.apc_paid?.pricing_currency
    ? `${openAlexItem.apc_paid.pricing_currency} ${openAlexItem.apc_paid.price}`
    : (openAlexItem.has_apc && !openAlexItem.apc_paid ? "Sin información" : "");

  return {
    citas,
    institucion,
    pais,
    publisher,
    publisherUrl,
    tema,
    enDoaj,
    tipoPublicacion,
    indexadoEn,
    apcPricing,
    autoresConAfiliacion
  };
}

function mapearTipoPublicacion(type) {
  if (!type) return "No especificado";

  const tipos = {
    "journal-article": "Artículo de revista",
    "conference-paper": "Artículo de conferencia",
    "book-chapter": "Capítulo de libro",
    "book": "Libro",
    "preprint": "Preprint",
    "report": "Informe",
    "thesis": "Tesis",
    "dataset": "Dataset",
    "other": "Otro"
  };

  return tipos[type] || type;
}

function obtenerIndexadoEn(openAlexItem) {
  if (!openAlexItem) {
    return "No indexado";
  }

  // Verificar si indexed_in existe y es un array
  if (!Array.isArray(openAlexItem.indexed_in) || openAlexItem.indexed_in.length === 0) {
    return "No indexado";
  }

  const indicesFormateados = openAlexItem.indexed_in
    .filter(indice => typeof indice === 'string')
    .map(indice => formatearNombreIndice(indice.toLowerCase()));

  return indicesFormateados.length > 0 
    ? indicesFormateados.join(" | ")
    : "No indexado";
}

function formatearNombreIndice(nombre) {
  const mapeo = {
    "crossref": "🔗 Crossref",
    "pubmed": "🏥 PubMed",
    "pmid": "🏥 PMID",
    "pubmed_central": "🏥 PubMed Central",
    "web_of_science": "🌐 Web of Science",
    "scopus": "🌐 Scopus",
    "microsoft_academic": "🔵 Microsoft Academic",
    "doaj": "📚 DOAJ"
  };

  return mapeo[nombre] || nombre.charAt(0).toUpperCase() + nombre.slice(1).replace(/_/g, " ");
}