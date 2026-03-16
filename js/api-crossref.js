export async function buscarCrossrefPorORCID(orcid, rows = 100) {
  const allItems = [];
  let cursor = "*";
  const base = "https://api.crossref.org/works";

  const params = new URLSearchParams({
    filter: `orcid:${orcid}`,
    rows: String(rows),
    cursor: cursor,
    sort: "issued",
    order: "desc"
  });

  let fetched = 0;

  while (true) {
    const url = `${base}?${params.toString()}`;

    const r = await fetch(url, {
      headers: { "Accept": "application/json" }
    });

    if (!r.ok) {
      throw new Error("Error consultando Crossref");
    }

    const data = await r.json();
    const items = data.message.items || [];

    allItems.push(...items);
    fetched += items.length;

    const nextCursor = data.message["next-cursor"];

    if (!nextCursor || items.length === 0 || fetched >= 500) {
      break;
    }

    params.set("cursor", nextCursor);
  }

  return allItems;
}