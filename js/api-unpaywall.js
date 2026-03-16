const EMAIL = "tu_correo@ejemplo.com";

export async function buscarOAporDOI(doi) {
  const url = `https://api.unpaywall.org/v2/${doi}?email=${EMAIL}`;

  try {
    const r = await fetch(url);
    if (!r.ok) return null;

    return await r.json();
  } catch {
    return null;
  }
}