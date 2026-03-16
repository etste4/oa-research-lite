const EMAIL = "tu_correo@correo.com"; // usa tu correo real

export async function buscarOAporDOI(doi) {

  const url = `https://api.unpaywall.org/v2/${doi}?email=${EMAIL}`;

  try {

    const r = await fetch(url);

    if (!r.ok) {
      return null;
    }

    const data = await r.json();

    return data;

  } catch (error) {

    console.error("Error consultando Unpaywall", error);
    return null;

  }

}