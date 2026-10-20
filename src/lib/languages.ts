export type Language = {
  slug: string;
  name: string;
  flag: string;
  featured?: boolean;
};

// Solo se habilitan los cursos que ya tienen contenido. Los demás idiomas
// (inglés, portugués, francés, español) se agregarán cuando tengan contenido
// validado; mientras tanto sus direcciones muestran "curso no encontrado".
export const LANGUAGES: Language[] = [
  { slug: "guarani", name: "Guaraní", flag: "🇵🇾", featured: true },
];

export function getLanguage(slug: string): Language | undefined {
  return LANGUAGES.find((l) => l.slug === slug);
}
