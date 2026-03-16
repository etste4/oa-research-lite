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