import confetti from "canvas-confetti";

const NAVY = "#1E3A5F";
const RED = "#C8102E";
const WHITE = "#FFFFFF";
const GOLD = "#E8B84A";

export function celebrate(intensity: "small" | "big" = "big") {
  if (typeof window === "undefined") return;
  const colors = [NAVY, RED, WHITE, GOLD];
  const base = {
    colors,
    ticks: 200,
    gravity: 0.9,
    scalar: 1,
    disableForReducedMotion: true,
  } as const;

  if (intensity === "small") {
    confetti({ ...base, particleCount: 60, spread: 60, origin: { y: 0.7 } });
    return;
  }

  confetti({ ...base, particleCount: 120, spread: 70, origin: { y: 0.7 } });
  setTimeout(() => {
    confetti({ ...base, particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.8 } });
    confetti({ ...base, particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.8 } });
  }, 200);
}
