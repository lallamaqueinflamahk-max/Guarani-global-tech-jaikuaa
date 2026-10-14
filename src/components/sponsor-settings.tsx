import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSponsorAdmin, saveSponsorSettings } from "@/lib/sponsors.functions";
import { SPONSOR_SLOTS, SPONSOR_SLOT_IDS, type SponsorSlot } from "@/lib/sponsor-slots";

/** Espacios de auspiciantes (solo admin): un nombre por juego y el muro de la portada. */
export function SponsorSettings() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSponsorAdmin);
  const saveFn = useServerFn(saveSponsorSettings);
  const q = useQuery({ queryKey: ["sponsor-admin"], queryFn: () => getFn() });
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [founders, setFounders] = useState("");
  useEffect(() => {
    if (q.data) {
      setSlots(q.data.slots);
      setFounders(q.data.founders);
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: (v: { slots?: Partial<Record<SponsorSlot, string>>; founders?: string }) => saveFn({ data: v }),
    onSuccess: () => {
      toast.success("Guardado.");
      void qc.invalidateQueries({ queryKey: ["sponsor-admin"] });
      void qc.invalidateQueries({ queryKey: ["slot-sponsor"] });
      void qc.invalidateQueries({ queryKey: ["founding-sponsors"] });
    },
    onError: () => toast.error("No se pudo guardar."),
  });

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="font-display font-semibold text-foreground">Auspiciante por juego</div>
        <p className="text-xs text-muted-foreground">
          Aparece como "Presentado por …" debajo del título del juego. Dejalo vacío para no mostrar nada. La
          publicidad del cartel LED del Penal se cambia en la pestaña Piloto.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ slots: slots as Partial<Record<SponsorSlot, string>> });
          }}
        >
          {SPONSOR_SLOT_IDS.map((id) => (
            <label key={id} className="block text-sm font-semibold">
              {SPONSOR_SLOTS[id].label}
              <Input
                aria-label={`Auspiciante de ${SPONSOR_SLOTS[id].label}`}
                value={slots[id] ?? ""}
                onChange={(e) => setSlots((s) => ({ ...s, [id]: e.target.value }))}
                maxLength={80}
                placeholder="Nombre de la empresa — vacío para no mostrar nada"
                className="mt-1"
              />
            </label>
          ))}
          <Button type="submit" variant="outline" disabled={save.isPending}>
            Guardar auspiciantes de juegos
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="font-display font-semibold text-foreground">Muro de Auspiciantes Fundadores (portada)</div>
        <p className="text-xs text-muted-foreground">
          Un nombre por línea. Se muestra en la portada solo cuando hay al menos uno. Cargá únicamente empresas
          que ya firmaron.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ founders });
          }}
        >
          <Textarea
            aria-label="Auspiciantes Fundadores"
            value={founders}
            onChange={(e) => setFounders(e.target.value)}
            rows={5}
            placeholder={"Empresa 1\nEmpresa 2"}
          />
          <Button type="submit" variant="outline" disabled={save.isPending}>
            Guardar muro
          </Button>
        </form>
      </section>
    </div>
  );
}
