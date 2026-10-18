import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, History, Loader2, RotateCcw, Search, UserPlus, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addReviewer,
  getCircuitRoles,
  getProposalHistory,
  listMyProposals,
  listQueue,
  listReviewers,
  proposeContent,
  removeReviewer,
  resubmitProposal,
  reviewProposal,
  searchWordsForCorrection,
  validateProposal,
  type ProposalStatus,
} from "@/lib/validation-circuit.functions";

export const Route = createFileRoute("/_authenticated/validacion")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Circuito de validación" },
      { name: "description", content: "Proponer, revisar y validar contenido del corpus en tres pasos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ValidationCircuitPage,
});

const STATUS_LABEL: Record<ProposalStatus, { label: string; cls: string }> = {
  propuesta: { label: "Esperando revisión", cls: "bg-muted text-foreground" },
  revisada: { label: "Esperando validación docente", cls: "bg-accent/15 text-accent" },
  validada: { label: "Validada y publicada", cls: "bg-primary/15 text-primary" },
  devuelta: { label: "Devuelta para corregir", cls: "bg-amber-100 text-amber-800" },
  rechazada: { label: "No aceptada", cls: "bg-destructive/10 text-destructive" },
};

const STEP_LABEL: Record<string, string> = {
  propuesta: "Propuso",
  reenviada: "Corrigió y reenvió",
  revisada: "Revisó y aprobó",
  devuelta_en_revision: "Devolvió en revisión",
  rechazada_en_revision: "No aceptó en revisión",
  devuelta_en_validacion: "Devolvió en validación",
  rechazada_en_validacion: "No aceptó en validación",
  validada: "Validó y publicó",
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-PY", { dateStyle: "short", timeStyle: "short" }) : "";

function ValidationCircuitPage() {
  const rolesFn = useServerFn(getCircuitRoles);
  const roles = useQuery({ queryKey: ["circuit-roles"], queryFn: () => rolesFn() });

  if (roles.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  const r = roles.data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Circuito de validación</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tres personas distintas en tres pasos: <strong>una propone</strong>, <strong>otra revisa</strong> y{" "}
        <strong>un docente valida</strong>. Nada se publica hasta la validación docente, y cada paso queda
        registrado con nombre, fecha y hora.
      </p>

      <Tabs defaultValue="proponer" className="mt-6">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="proponer">Proponer</TabsTrigger>
          <TabsTrigger value="mias">Mis propuestas</TabsTrigger>
          {r?.canReview && <TabsTrigger value="revisar">Revisar</TabsTrigger>}
          {r?.canValidate && <TabsTrigger value="validar">Validar</TabsTrigger>}
          {r?.isAdmin && <TabsTrigger value="revisores">Revisores</TabsTrigger>}
        </TabsList>
        <TabsContent value="proponer">
          <ProposeForm />
        </TabsContent>
        <TabsContent value="mias">
          <MyProposals />
        </TabsContent>
        {r?.canReview && (
          <TabsContent value="revisar">
            <Queue step="revisar" />
          </TabsContent>
        )}
        {r?.canValidate && (
          <TabsContent value="validar">
            <Queue step="validar" />
          </TabsContent>
        )}
        {r?.isAdmin && (
          <TabsContent value="revisores">
            <Reviewers />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/* ------------------------------ Proponer ------------------------------ */

function ProposeForm() {
  const qc = useQueryClient();
  const proposeFn = useServerFn(proposeContent);
  const searchFn = useServerFn(searchWordsForCorrection);
  const [kind, setKind] = useState<"nueva" | "correccion">("nueva");
  const [target, setTarget] = useState<{ id: string; gn: string; es: string } | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; gn: string; es: string }[]>([]);
  const [gn, setGn] = useState("");
  const [es, setEs] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("");

  const search = useMutation({
    mutationFn: () => searchFn({ data: { q: query } }),
    onSuccess: (d) => setResults(d.words),
  });
  const send = useMutation({
    mutationFn: () =>
      proposeFn({ data: { kind, targetWordId: target?.id ?? null, gn, es, notes, source } }),
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      toast.success("Propuesta enviada. Ahora la revisa otra persona.");
      setGn("");
      setEs("");
      setNotes("");
      setSource("");
      setTarget(null);
      qc.invalidateQueries({ queryKey: ["my-proposals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pick = (w: { id: string; gn: string; es: string }) => {
    setTarget(w);
    setGn(w.gn);
    setEs(w.es);
    setResults([]);
  };

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <div className="flex flex-wrap gap-2">
        <Button variant={kind === "nueva" ? "default" : "outline"} size="sm" onClick={() => { setKind("nueva"); setTarget(null); }}>
          Palabra nueva
        </Button>
        <Button variant={kind === "correccion" ? "default" : "outline"} size="sm" onClick={() => setKind("correccion")}>
          Corregir una palabra
        </Button>
      </div>

      {kind === "correccion" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Buscá la palabra a corregir</label>
          <div className="flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="En guaraní o en castellano" />
            <Button variant="outline" onClick={() => search.mutate()} disabled={query.trim().length < 2 || search.isPending}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {results.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {results.map((w) => (
                <li key={w.id}>
                  <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => pick(w)}>
                    <strong>{w.gn}</strong> — {w.es}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {target && (
            <p className="text-xs text-muted-foreground">
              Corrigiendo: <strong>{target.gn}</strong> — {target.es}. Cambiá abajo lo que esté mal.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">En guaraní</label>
          <Input value={gn} onChange={(e) => setGn(e.target.value)} maxLength={200} />
        </div>
        <div>
          <label className="text-sm font-medium">En castellano</label>
          <Input value={es} onChange={(e) => setEs(e.target.value)} maxLength={300} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Notas (uso, región, registro, por qué corregir)</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium">Fuente (diccionario, libro, docente o hablante)</label>
        <Input value={source} onChange={(e) => setSource(e.target.value)} maxLength={300} />
      </div>
      <p className="text-xs text-muted-foreground">
        Escribilo vos, con tus palabras: no copies de traductores automáticos ni de inteligencia artificial.
        Lo que propongas no se publica hasta que lo revise otra persona y lo valide un docente.
      </p>
      <Button
        variant="cta"
        onClick={() => send.mutate()}
        disabled={!gn.trim() || !es.trim() || (kind === "correccion" && !target) || send.isPending}
      >
        {send.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar propuesta
      </Button>
    </div>
  );
}

/* --------------------------- Mis propuestas --------------------------- */

function MyProposals() {
  const fn = useServerFn(listMyProposals);
  const q = useQuery({ queryKey: ["my-proposals"], queryFn: () => fn() });
  if (q.isLoading) return <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-primary" />;
  const list = q.data?.proposals ?? [];
  if (!list.length) return <p className="mt-6 text-sm text-muted-foreground">Todavía no enviaste propuestas.</p>;
  return (
    <ul className="mt-4 space-y-3">
      {list.map((p) => (
        <li key={p.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold">{p.gn}</span> <span className="text-muted-foreground">— {p.es}</span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABEL[p.status].cls}`}>
              {STATUS_LABEL[p.status].label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {p.kind === "correccion" ? "Corrección" : "Palabra nueva"} · enviada {fmt(p.proposed_at)}
          </p>
          {(p.review_note || p.validation_note) && (
            <p className="mt-2 rounded-lg bg-muted p-2 text-sm">{p.validation_note || p.review_note}</p>
          )}
          {p.status === "devuelta" && <ResubmitForm proposal={p} />}
          <HistoryToggle id={p.id} />
        </li>
      ))}
    </ul>
  );
}

function ResubmitForm({ proposal }: { proposal: { id: string; gn: string; es: string; notes: string; source: string } }) {
  const qc = useQueryClient();
  const fn = useServerFn(resubmitProposal);
  const [gn, setGn] = useState(proposal.gn);
  const [es, setEs] = useState(proposal.es);
  const [notes, setNotes] = useState(proposal.notes);
  const m = useMutation({
    mutationFn: () => fn({ data: { id: proposal.id, gn, es, notes, source: proposal.source } }),
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      toast.success("Reenviada a revisión.");
      qc.invalidateQueries({ queryKey: ["my-proposals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={gn} onChange={(e) => setGn(e.target.value)} />
        <Input value={es} onChange={(e) => setEs(e.target.value)} />
      </div>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <Button size="sm" variant="outline" onClick={() => m.mutate()} disabled={m.isPending}>
        <RotateCcw className="mr-1 h-4 w-4" /> Corregir y reenviar
      </Button>
    </div>
  );
}

function HistoryToggle({ id }: { id: string }) {
  const fn = useServerFn(getProposalHistory);
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["proposal-history", id], queryFn: () => fn({ data: { id } }), enabled: open });
  return (
    <div className="mt-2">
      <button type="button" className="inline-flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => setOpen(!open)}>
        <History className="h-3.5 w-3.5" /> {open ? "Ocultar historial" : "Ver historial"}
      </button>
      {open && (
        <ol className="mt-2 space-y-1 border-l pl-3 text-xs text-muted-foreground">
          {(q.data?.history ?? []).map((h, i) => (
            <li key={i}>
              <strong className="text-foreground">{STEP_LABEL[h.paso] ?? h.paso}</strong>: {h.nombre}, {fmt(h.en)}
              {h.nota ? ` — «${h.nota}»` : ""}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ---------------------------- Revisar / Validar ---------------------------- */

function Queue({ step }: { step: "revisar" | "validar" }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listQueue);
  const reviewFn = useServerFn(reviewProposal);
  const validateFn = useServerFn(validateProposal);
  const q = useQuery({ queryKey: ["circuit-queue", step], queryFn: () => listFn({ data: { step } }) });
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "aprobar" | "devolver" | "rechazar" }) => {
      const payload = { data: { ...v, note: notes[v.id] ?? "" } };
      return step === "revisar" ? reviewFn(payload) : validateFn(payload);
    },
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      toast.success(step === "revisar" ? "Revisión registrada." : "Validación registrada.");
      if ("audioWarning" in d && d.audioWarning) toast.warning("Cambió la escritura: hay que volver a grabar el audio de esta palabra.");
      qc.invalidateQueries({ queryKey: ["circuit-queue"] });
    },
    onError: (e: Error) => toast.error(e.message.includes("motivo") ? "Escribí el motivo para devolver o no aceptar." : e.message),
  });

  if (q.isLoading) return <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-primary" />;
  const items = q.data?.items ?? [];
  if (!items.length) {
    return <p className="mt-6 text-sm text-muted-foreground">No hay propuestas para {step === "revisar" ? "revisar" : "validar"} ahora.</p>;
  }
  return (
    <ul className="mt-4 space-y-3">
      {items.map((p) => (
        <li key={p.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{p.kind === "correccion" ? "Corrección" : "Palabra nueva"}</Badge>
            <span className="text-xs text-muted-foreground">
              Propuso {p.proposerName} · {fmt(p.proposed_at)}
              {p.reviewerName ? ` · Revisó ${p.reviewerName} · ${fmt(p.reviewed_at)}` : ""}
            </span>
          </div>
          {p.current && (
            <p className="mt-2 text-sm text-muted-foreground">
              Hoy en el corpus: <strong>{p.current.gn}</strong> — {p.current.es}
            </p>
          )}
          <p className="mt-2 text-lg">
            <strong>{p.gn}</strong> <span className="text-muted-foreground">— {p.es}</span>
          </p>
          {p.notes && <p className="mt-1 text-sm">Notas: {p.notes}</p>}
          {p.source && <p className="text-sm text-muted-foreground">Fuente: {p.source}</p>}
          {p.review_note && <p className="mt-1 text-sm text-muted-foreground">Nota del revisor: {p.review_note}</p>}
          <Textarea
            className="mt-3"
            rows={2}
            placeholder="Nota (obligatoria para devolver o no aceptar)"
            value={notes[p.id] ?? ""}
            onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decide.mutate({ id: p.id, decision: "aprobar" })} disabled={decide.isPending}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> {step === "revisar" ? "Aprobar revisión" : "Validar y publicar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: p.id, decision: "devolver" })} disabled={decide.isPending}>
              <RotateCcw className="mr-1 h-4 w-4" /> Devolver para corregir
            </Button>
            <Button size="sm" variant="ghost" onClick={() => decide.mutate({ id: p.id, decision: "rechazar" })} disabled={decide.isPending}>
              <XCircle className="mr-1 h-4 w-4" /> No aceptar
            </Button>
          </div>
          <HistoryToggle id={p.id} />
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Revisores ------------------------------ */

function Reviewers() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReviewers);
  const addFn = useServerFn(addReviewer);
  const removeFn = useServerFn(removeReviewer);
  const q = useQuery({ queryKey: ["reviewers"], queryFn: () => listFn() });
  const [email, setEmail] = useState("");
  const add = useMutation({
    mutationFn: () => addFn({ data: { email } }),
    onSuccess: (d) => {
      if (!d.ok) return toast.error(d.error);
      toast.success("Revisor agregado.");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["reviewers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeFn({ data: { userId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviewers"] }),
  });
  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <p className="text-sm text-muted-foreground">
        Revisores avanzados: estudiantes avanzados o pasantes que hacen el segundo paso. Los docentes validadores
        se cargan en Corpus → Validación.
      </p>
      <div className="flex gap-2">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo de su cuenta en Jaikuaa" />
        <Button onClick={() => add.mutate()} disabled={!email.trim() || add.isPending}>
          <UserPlus className="mr-1 h-4 w-4" /> Agregar
        </Button>
      </div>
      <ul className="divide-y">
        {(q.data?.reviewers ?? []).map((r) => (
          <li key={r.userId} className="flex items-center justify-between py-2 text-sm">
            <span>
              {r.name || r.email} <span className="text-muted-foreground">· {r.reviewed} revisadas</span>
            </span>
            <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.userId)} aria-label="Quitar revisor">
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
