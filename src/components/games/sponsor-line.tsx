import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSlotSponsor } from "@/lib/sponsors.functions";
import type { SponsorSlot } from "@/lib/sponsor-slots";

/** "Presentado por …" de un espacio de auspiciante. No muestra nada si no hay auspiciante. */
export function SponsorLine({ slot }: { slot: SponsorSlot }) {
  const fn = useServerFn(getSlotSponsor);
  const q = useQuery({ queryKey: ["slot-sponsor", slot], queryFn: () => fn({ data: { slot } }), staleTime: 5 * 60_000 });
  const name = q.data?.name ?? "";
  if (!name) return null;
  const prefix = slot === "palabra-del-dia" ? "Presentada por" : "Presentado por";
  return (
    <p className="mt-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {prefix} <span className="font-bold text-foreground">{name}</span>
    </p>
  );
}
