// Reglas de slug para los archivos de audio guaraní.
// Fuente única de verdad — ver docs/audio-filenames.md.
// 1. NFD + quitar marcas combinantes (ã ẽ ĩ õ ũ ỹ / á é í ó ú ý → a e i o u y)
// 2. minúsculas
// 3. ñ → n
// 4. quitar el puso (' ’ ʼ ʹ)
// 5. cualquier otro carácter no [a-z0-9] → -
// 6. recortar guiones al inicio/final
export function slugify(gn: string): string {
  let x = gn.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  x = x.toLowerCase();
  x = x.replace(/ñ/g, "n");
  x = x.replace(/['\u2019\u02BC\u02B9\u2018]/g, "");
  x = x.replace(/[^a-z0-9]+/g, "-");
  x = x.replace(/^-+|-+$/g, "");
  return x;
}

/** Separa una oración en guaraní en tokens (palabras), sin puntuación. */
export function tokenizeSentence(gn: string): string[] {
  return gn
    .split(/\s+/)
    .map((t) => t.replace(/^[¿¡"«(]+|[?!.,;:"»)]+$/g, "").trim())
    .filter(Boolean);
}
