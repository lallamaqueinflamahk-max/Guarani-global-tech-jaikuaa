export type Language = {
  slug: string;
  name: string;
  flag: string;
  featured?: boolean;
};

export const LANGUAGES: Language[] = [
  { slug: "guarani", name: "Guaraní", flag: "🇵🇾", featured: true },
  { slug: "ingles", name: "Inglés", flag: "🇺🇸" },
  { slug: "portugues", name: "Portugués", flag: "🇧🇷" },
  { slug: "frances", name: "Francés", flag: "🇫🇷" },
  { slug: "espanol", name: "Español", flag: "🇪🇸" },
];

export function getLanguage(slug: string): Language | undefined {
  return LANGUAGES.find((l) => l.slug === slug);
}
