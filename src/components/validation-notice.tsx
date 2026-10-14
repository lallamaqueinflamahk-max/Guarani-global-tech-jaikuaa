/**
 * Aviso para secciones cuyo contenido en guaraní todavía no pasó por la
 * validación de docentes especialistas. Regla de Jaikuaa: solo los expertos
 * validan el guaraní; mientras tanto, el contenido se muestra avisado.
 */
export function ValidationNotice() {
  return (
    <div
      role="note"
      className="border-b border-sky-300 bg-sky-50 px-4 py-2.5 text-center text-xs font-medium text-sky-900 sm:text-sm"
    >
      🔎 Contenido en validación. Estas palabras y frases todavía están siendo revisadas por
      docentes especialistas en lengua guaraní. Puede contener errores: no lo uses como referencia
      oficial.
    </div>
  );
}

export function ValidationBadge() {
  return (
    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
      En validación
    </span>
  );
}
