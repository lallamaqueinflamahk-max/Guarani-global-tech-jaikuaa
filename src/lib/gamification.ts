import { useEffect, useState } from "react";

export type BadgeId =
  | "primer-paso"
  | "guaranihablante"
  | "estudiante-estrella"
  | "racha-fuego";

export type BadgeDef = {
  id: BadgeId;
  name: string;
  emoji: string;
  description: string;
};

export const BADGES: BadgeDef[] = [
  {
    id: "primer-paso",
    name: "Primer paso",
    emoji: "👣",
    description: "Completaste tu primera lección.",
  },
  {
    id: "guaranihablante",
    name: "Guaranihablante",
    emoji: "🗣️",
    description: "Completaste 5 lecciones de Guaraní.",
  },
  {
    id: "estudiante-estrella",
    name: "Estudiante estrella",
    emoji: "⭐",
    description: "Sacaste 5/5 en una prueba de Guaraní Escolar.",
  },
  {
    id: "racha-fuego",
    name: "Racha de fuego",
    emoji: "🔥",
    description: "Mantuviste una racha de 7 días seguidos.",
  },
];

export type Stats = {
  xp: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD or ""
  badges: BadgeId[];
  guaraniLessonsCompleted: number;
};

const STORAGE_KEY = "aranduka:stats";
const EVENT_NAME = "aranduka:stats-changed";

function emptyStats(): Stats {
  return {
    xp: 0,
    streak: 0,
    lastActiveDate: "",
    badges: [],
    guaraniLessonsCompleted: 0,
  };
}

function read(): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return { ...emptyStats(), ...parsed };
  } catch {
    return emptyStats();
  }
}

function write(s: Stats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {}
}

export function getStats(): Stats {
  return read();
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function applyStreak(s: Stats): Stats {
  const today = todayISO();
  if (s.lastActiveDate === today) return s;
  let streak: number;
  if (s.lastActiveDate === yesterdayISO()) streak = s.streak + 1;
  else streak = 1;
  return { ...s, streak, lastActiveDate: today };
}

function ensureBadge(s: Stats, id: BadgeId): Stats {
  if (s.badges.includes(id)) return s;
  return { ...s, badges: [...s.badges, id] };
}

function checkAutoBadges(s: Stats): Stats {
  let next = s;
  if (next.guaraniLessonsCompleted >= 1) next = ensureBadge(next, "primer-paso");
  if (next.guaraniLessonsCompleted >= 5) next = ensureBadge(next, "guaranihablante");
  if (next.streak >= 7) next = ensureBadge(next, "racha-fuego");
  return next;
}

type CompleteOpts = {
  xp: number;
  isGuaraniLesson?: boolean;
  perfectExam?: boolean;
};

export function recordCompletion(opts: CompleteOpts): Stats {
  let s = read();
  s = { ...s, xp: s.xp + Math.max(0, opts.xp) };
  if (opts.isGuaraniLesson) {
    s = { ...s, guaraniLessonsCompleted: s.guaraniLessonsCompleted + 1 };
  }
  if (opts.perfectExam) {
    s = ensureBadge(s, "estudiante-estrella");
  }
  s = applyStreak(s);
  s = checkAutoBadges(s);
  write(s);
  return s;
}

export function resetStats() {
  write(emptyStats());
}

export function useStats(): Stats {
  // Read synchronously from localStorage so the UI never flashes zeros.
  // Safe here because consumers live under the ssr:false _authenticated layout.
  const [stats, setStats] = useState<Stats>(() => read());
  useEffect(() => {
    const handler = () => setStats(read());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return stats;
}

/**
 * Run a completion side-effect exactly once when a component mounts.
 * Useful inside the "done" screen of lessons/quizzes.
 */
export function useRecordOnMount(opts: CompleteOpts) {
  useEffect(() => {
    recordCompletion(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
