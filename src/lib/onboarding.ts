// Local persistence for the pre-login onboarding flow.
// The chosen motivation is saved on device and later associated with the
// user's profile at registration time (see dashboard bootstrap).

export type Motivation = "trabajo" | "colegio" | "familia" | "gusta" | "probar";

const KEY = "jaikuaa:motivation";
const DONE_KEY = "jaikuaa:onboarding-done";

export const MOTIVATION_LABEL: Record<Motivation, string> = {
  trabajo: "Para el trabajo",
  colegio: "Para el colegio",
  familia: "Para mi familia",
  gusta: "Porque me gusta",
  probar: "No sé, probemos",
};

export const MOTIVATION_SUGGESTION: Record<Motivation, string> = {
  trabajo: "Guaraní para profesionales",
  colegio: "Guaraní Escolar",
  familia: "Frases para conversar",
  gusta: "Ñe'ẽ Mbytépe",
  probar: "Trivia Jaikuaápa",
};

export function saveMotivation(m: Motivation) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, m);
  } catch {}
}

export function getMotivation(): Motivation | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "trabajo" || v === "colegio" || v === "familia" || v === "gusta" || v === "probar") return v;
    return null;
  } catch {
    return null;
  }
}

export function markOnboardingDone() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DONE_KEY, "1");
  } catch {}
}

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return true;
  }
}
