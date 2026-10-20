import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { createInviteCode, getPilotAdmin, savePilotSettings, setInviteActive } from "@/lib/pilot.functions";

/** Ajustes de la página del piloto y códigos de invitación (solo admin). */
export function PilotPageSettings() {
  const qc = useQueryClient();
  const getFn = useServerFn(getPilotAdmin);
  const saveFn = useServerFn(savePilotSettings);
  const createFn = useServerFn(createInviteCode);
  const activeFn = useServerFn(setInviteActive);
  const q = useQuery({ queryKey: ["pilot-admin"], queryFn: () => getFn() });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["pilot-admin"] });

  const [contact, setContact] = useState("");
  const [ledText, setLedText] = useState("");
  useEffect(() => {
    if (q.data) { setContact(q.data.contact); setLedText(q.data.ledText); }
  }, [q.data]);

  const save = useMutation({
    mutationFn: (v: { status?: "draft" | "published"; contact?: string; ledText?: string }) => saveFn({ data: v }),
    onSuccess: () => {
      toast.success("Guardado.");
      refresh();
      void qc.invalidateQueries({ queryKey: ["pilot-page"] });
      void qc.invalidateQueries({ queryKey: ["penales-led"] });
    },
    onError: () => toast.error("No se pudo guardar."),
  });

  const [code, setCode] = useState("");
  const [cohort, setCohort] = useState("Piloto Ateneo");
  const [maxUses, setMaxUses] = useState("50");
  const [expires, setExpires] = useState("");
  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: { code: code.trim(), cohort: cohort.trim() || "Piloto Ateneo", maxUses: Number(maxUses), expiresAt: expires || null },
      }),
    onSuccess: () => {
      toast.success("Código creado.");
      setCode("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error && e.message.length < 80 ? e.message : "No se pudo crear el código."),
  });
  const toggle = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => activeFn({ data: v }),
    onSuccess: refresh,
  });

  if (q.isLoading || !q.data) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  const d = q.data;
  const published = d.status === "published";

  return (
    <div className="space-y-6 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-auto sm:flex-1">
          <div className="font-display font-semibold text-foreground">Página del piloto: Borrador / Publicada</div>
          <div className="text-xs text-muted-foreground">
            Dirección: /piloto-ateneo · En Borrador solo la ve el admin.
          </div>
        </div>
        <span className="text-sm text-muted-foreground">Borrador</span>
        <Switch
          checked={published}
          disabled={save.isPending}
          onCheckedChange={(v) => save.mutate({ status: v ? "published" : "draft" })}
          aria-label="Página del piloto publicada"
        />
        <span className="text-sm text-muted-foreground">Publicada</span>
        <Badge variant={published ? "default" : "secondary"}>{published ? "Publicada" : "Borrador"}</Badge>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({ contact });
        }}
      >
        <Input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Email o teléfono de contacto (vacío = no se muestra)"
          maxLength={200}
          className="min-w-[14rem] flex-1"
        />
        <Button type="submit" variant="outline" disabled={save.isPending}>
          Guardar contacto
        </Button>
      </form>

      <div className="space-y-3">
        <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); save.mutate({ ledText }); }}>
          <label className="min-w-0 flex-1 text-sm font-semibold">Publicidad LED de Penales
            <Input aria-label="Publicidad LED de Penales" value={ledText} onChange={(e) => setLedText(e.target.value)} maxLength={160} className="mt-2" />
          </label>
          <Button type="submit" variant="outline" disabled={save.isPending || !ledText.trim()}>Guardar publicidad</Button>
        </form>
        <div className="font-display font-semibold text-foreground">Códigos de invitación</div>
        <p className="text-xs text-muted-foreground">
          El código solo asigna el grupo. El rol de Docente validador se asigna a mano en la pestaña Docentes.
          Funcionan cuando la página está Publicada: /piloto-ateneo?codigo=CODIGO
        </p>
        <form
          className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem_10rem_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código (mín. 6)" maxLength={40} />
          <Input value={cohort} onChange={(e) => setCohort(e.target.value)} placeholder="Grupo" maxLength={60} />
          <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} aria-label="Usos máximos" />
          <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} aria-label="Vencimiento (opcional)" />
          <Button type="submit" variant="cta" disabled={create.isPending || code.trim().length < 6 || Number(maxUses) < 1}>
            Crear
          </Button>
        </form>
        {d.codes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Todavía no hay códigos.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60">
            {d.codes.map((c) => {
              const expired = !!c.expires_at && new Date(c.expires_at) < new Date();
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 border-b border-border/40 p-3 last:border-0">
                  <code className="font-mono font-semibold text-foreground">{c.code}</code>
                  <Badge variant="secondary">{c.cohort}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Usos: {c.uses}/{c.max_uses}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.expires_at ? `Vence ${new Date(c.expires_at).toLocaleDateString("es-PY")}` : "Sin vencimiento"}
                    {expired && " (vencido)"}
                  </span>
                  <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    {c.active ? "Activo" : "Inactivo"}
                    <Switch
                      checked={c.active}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ id: c.id, active: v })}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
