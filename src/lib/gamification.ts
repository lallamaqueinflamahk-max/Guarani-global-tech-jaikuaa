import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyStats, migrateLocalProgress, recordActivity } from "@/lib/progress.functions";

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
  /** Usuario dueño de esta caché. Vacío = progreso viejo, solo local (pre-sincronización). */
  ownerId?: string;
};

export type ActivitySource = "lesson" | "exam" | "trivia" | "weekly" | "onboarding";

/*
 * La fuente de verdad es la base de datos (user_stats + xp_transactions).
 * localStorage es solo caché para que la interfaz no parpadee.
 */
const STORAGE_KEY = "aranduka:stats";
const PENDING_KEY = "aranduka:pending-activity";
const EVENT_NAME = "aranduka:stats-changed";

function emptyStats(): Stats {
  return { xp: 0, streak: 0, lastActiveDate: "", badges: [], guaraniLessonsCompleted: 0 };
}

function read(): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    return { ...emptyStats(), ...(JSON.parse(raw) as Partial<Stats>) };
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

function fromServer(s: {
  userId: string;
  xp: number;
  streak: number;
  lastActiveDate: string;
  badges: string[];
  guaraniLessonsCompleted: number;
}): Stats {
  return {
    xp: s.xp,
    streak: s.streak,
    lastActiveDate: s.lastActiveDate,
    badges: s.badges.filter((b): b is BadgeId => BADGES.some((x) => x.id === b)),
    guaraniLessonsCompleted: s.guaraniLessonsCompleted,
    ownerId: s.userId,
  };
}

type PendingEvent = {
  source: ActivitySource | "visit";
  sourceRef: string;
  xp: number;
  syncId: string;
  isGuaraniLesson: boolean;
  perfectExam: boolean;
};

function readPending(): PendingEvent[] {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_KEY) || "[]") as PendingEvent[];
  } catch {
    return [];
  }
}
function writePending(list: PendingEvent[]) {
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-50)));
  } catch {}
}

async function hasSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

function newSyncId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** Envía al servidor; si falla queda en cola y se reintenta con el mismo sync_id. */
async function send(ev: PendingEvent): Promise<boolean> {
  try {
    const res = await recordActivity({ data: ev });
    write(fromServer(res));
    return true;
  } catch {
    return false;
  }
}

async function flushPending() {
  const list = readPending();
  if (list.length === 0) return;
  const left: PendingEvent[] = [];
  for (const ev of list) if (!(await send(ev))) left.push(ev);
  writePending(left);
}

let syncPromise: Promise<void> | null = null;

/** Sincroniza con el servidor: cola pendiente, migración única del progreso local y lectura. */
export function syncStats(): Promise<void> {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    if (!(await hasSession())) return;
    await flushPending();
    const local = read();
    let server = await getMyStats();
    if (!local.ownerId && local.xp > 0 && server.xp === 0) {
      try {
        server = await migrateLocalProgress({
          data: {
            xp: Math.min(local.xp, 5000),
            streak: Math.min(local.streak, 365),
            lastActiveDate: /^\d{4}-\d{2}-\d{2}$/.test(local.lastActiveDate)
              ? local.lastActiveDate
              : null,
            badges: local.badges.filter((b) => BADGES.some((x) => x.id === b)),
            guaraniLessonsCompleted: Math.min(local.guaraniLessonsCompleted, 500),
          },
        });
      } catch {}
    }
    write(fromServer(server));
  })()
    .catch(() => {})
    .finally(() => {
      syncPromise = null;
    });
  return syncPromise;
}

type CompleteOpts = {
  xp: number;
  source: ActivitySource;
  sourceRef?: string;
  isGuaraniLesson?: boolean;
  perfectExam?: boolean;
};

/** Registra una actividad completada en el servidor (y actualiza la caché local). */
export function recordCompletion(opts: CompleteOpts): void {
  const ev: PendingEvent = {
    source: opts.source,
    sourceRef: opts.sourceRef ?? "",
    xp: Math.max(0, Math.round(opts.xp)),
    syncId: newSyncId(),
    isGuaraniLesson: !!opts.isGuaraniLesson,
    perfectExam: !!opts.perfectExam,
  };
  void (async () => {
    if (!(await hasSession())) {
      // Sin sesión (p. ej. onboarding): se guarda solo en el dispositivo y
      // se sube una única vez como "local-migration" al iniciar sesión.
      const s = read();
      if (!s.ownerId) {
        write({
          ...s,
          xp: s.xp + ev.xp,
          guaraniLessonsCompleted: s.guaraniLessonsCompleted + (ev.isGuaraniLesson ? 1 : 0),
        });
      }
      return;
    }
    if (!(await send(ev))) writePending([...readPending(), ev]);
  })();
}

/** Marca al usuario como activo hoy (máximo una visita por día, la controla el servidor). */
export function recordVisit(sourceRef: string): void {
  void (async () => {
    if (!(await hasSession())) return;
    await send({
      source: "visit",
      sourceRef,
      xp: 0,
      syncId: newSyncId(),
      isGuaraniLesson: false,
      perfectExam: false,
    });
  })();
}

export function useRecordVisit(sourceRef: string) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    recordVisit(sourceRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useStats(): Stats {
  // Caché local primero para no mostrar ceros; luego se reemplaza con user_stats.
  // Safe here because consumers live under the ssr:false _authenticated layout.
  const [stats, setStats] = useState<Stats>(() => read());
  useEffect(() => {
    const handler = () => setStats(read());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    void syncStats();
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
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    recordCompletion(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
