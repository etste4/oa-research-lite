export async function buscarCrossrefPorORCID(orcid, rows = 20) {
  const url = `https://api.crossref.org/works?filter=orcid:${orcid}&rows=${rows}&sort=issued&order=desc`;

  const respuesta = await fetch(url, {
    headers: {
      "Accept": "application/json"
    }
  });

  if (!respuesta.ok) {
    throw new Error(`Error Crossref: ${respuesta.status}`);
  }

  const data = await respuesta.json();
  return data.message.items || [];
}