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
      enDoaj: ""
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

  return {
    citas,
    institucion,
    pais,
    tema,
    enDoaj
  };
}