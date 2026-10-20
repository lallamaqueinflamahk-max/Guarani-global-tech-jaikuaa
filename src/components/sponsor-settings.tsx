import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSponsorAdmin, getSponsorImpressions, saveSponsorSettings } from "@/lib/sponsors.functions";
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
      <ImpressionsReport />
    </div>
  );
}

function ImpressionsReport() {
  const fn = useServerFn(getSponsorImpressions);
  const q = useQuery({ queryKey: ["sponsor-impressions"], queryFn: () => fn() });
  const rows = (q.data ?? []).map((r) => ({
    ...r,
    label: SPONSOR_SLOTS[r.slot as SponsorSlot]?.label ?? r.slot,
  }));

  const download = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      ["Espacio", "Auspiciante", "Impresiones", "Usuarios distintos"].map(esc).join(","),
      ...rows.map((r) => [r.label, r.sponsorName, r.impressions, r.uniqueUsers].map(esc).join(",")),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "impresiones-auspiciantes-30-dias.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-display font-semibold text-foreground">Impresiones últimos 30 días</div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={download} disabled={!rows.length}>
            Descargar CSV
          </Button>
          <Button asChild size="sm" disabled={!rows.length}>
            <Link to="/admin/informe-auspiciante" search={{ days: 30 }}>
              Informe para el auspiciante
            </Link>
          </Button>
        </div>
      </div>
      {q.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : q.isError ? (
        <p className="text-sm text-destructive">No se pudo cargar el reporte.</p>
      ) : !rows.length ? (
        <p className="text-sm text-muted-foreground">Todavía no hay impresiones registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Espacio</th>
                <th className="px-3 py-2">Auspiciante</th>
                <th className="px-3 py-2 text-right">Impresiones</th>
                <th className="px-3 py-2 text-right">Usuarios distintos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.slot}-${r.sponsorName}`} className="border-t border-border">
                  <td className="px-3 py-2">{r.label}</td>
                  <td className="px-3 py-2 font-medium">{r.sponsorName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.impressions}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.uniqueUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
