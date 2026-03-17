export function validarORCID(orcid) {
  return /^\d{4}-\d{4}-\d{4}-\d{4}$/.test(orcid);
}

export function yearFromCrossrefItem(item) {
  const fields = [item["published-print"], item["published-online"], item["issued"]];

  for (const f of fields) {
    if (f && f["date-parts"] && f["date-parts"][0] && f["date-parts"][0][0]) {
      return f["date-parts"][0][0];
    }
  }

  return "";
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
export function obtenerDatosOpenAlex(openAlexItem) {
  if (!openAlexItem) {
    return {
      citas: "",
      institucion: "",
      pais: "",
      tema: "",
      enDoaj: "",
      tipoPublicacion: "",
      rankingRevista: "",
      apcPricing: ""
    };
  }

  const citas = openAlexItem.cited_by_count ?? "";

  let institucion = "";
  let pais = "";

  if (
    Array.isArray(openAlexItem.authorships) &&
    openAlexItem.authorships.length > 0
  ) {
    const primeraAuthorship = openAlexItem.authorships[0];

    if (
      Array.isArray(primeraAuthorship.institutions) &&
      primeraAuthorship.institutions.length > 0
    ) {
      institucion = primeraAuthorship.institutions[0].display_name || "";
      pais = primeraAuthorship.institutions[0].country_code || "";
    }
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
    : (openAlexItem.has_apc && !openAlexItem.apc_paid ? "Sin información" : "Gratis");

  return {
    citas,
    institucion,
    pais,
    tema,
    enDoaj,
    tipoPublicacion,
    indexadoEn,
    apcPricing
  };
}

function mapearTipoPublicacion(type) {
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

  return tipos[type] || type || "No especificado";
}

function obtenerIndexadoEn(openAlexItem) {
  if (!openAlexItem.indexed_in) {
    return "No indexado";
  }

  const indices = openAlexItem.indexed_in || {};
  const indicesPresentes = Object.entries(indices)
    .filter(([_, valor]) => valor === true)
    .map(([clave, _]) => formatearNombreIndice(clave));

  return indicesPresentes.length > 0 
    ? indicesPresentes.join(" | ")
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