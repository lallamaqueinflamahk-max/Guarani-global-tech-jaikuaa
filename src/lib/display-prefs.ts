/** Preferencias de visualización por dispositivo: modo oscuro y letra grande. */
export type DisplayPrefs = { dark: boolean; largeText: boolean };
const KEY = "jaikuaa:display-prefs";

export function readDisplayPrefs(): DisplayPrefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<DisplayPrefs>;
      return { dark: !!p.dark, largeText: !!p.largeText };
    }
  } catch {
    /* sin almacenamiento disponible */
  }
  return { dark: false, largeText: false };
}

export function applyDisplayPrefs(p: DisplayPrefs) {
  const root = document.documentElement;
  root.classList.toggle("dark", p.dark);
  root.classList.toggle("text-large", p.largeText);
  root.style.colorScheme = p.dark ? "dark" : "light";
}

export function saveDisplayPrefs(p: DisplayPrefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* sin almacenamiento disponible */
  }
  applyDisplayPrefs(p);
}
