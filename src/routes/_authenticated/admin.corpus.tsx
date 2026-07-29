import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Mic,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  checkCorpusAdmin,
  commitCorpusImport,
  deleteCorpusWord,
  getCorpusOverview,
  getMecCapacities,
  listCorpusWords,
  publishLevel,
  previewCorpusImport as previewFn,
  refreshAudioCoverage,
  updateCorpusWord,
} from "@/lib/corpus.functions";

export const Route = createFileRoute("/_authenticated/admin/corpus")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Panel del corpus guaraní" },
      {
        name: "description",
        content:
          "Cargá, revisá y publicá el corpus de palabras y oraciones en guaraní por grado escolar.",
      },
      { property: "og:title", content: "Jaikuaa — Panel del corpus guaraní" },
      {
        property: "og:description",
        content: "Gestión del corpus de palabras y oraciones en guaraní por grado del MEC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Ocurrió un error</h1>
      <Button variant="cta" className="mt-4" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="font-display text-2xl font-bold">No encontrado</h1>
    </div>
  ),
  component: CorpusAdminPage,
});

type ParsedRow = {
  gn: string;
  es: string;
  levelId: string;
  unit: string;
  type: "palabra" | "oracion";
  notes: string;
};

function CorpusAdminPage() {
  const checkAdmin = useServerFn(checkCorpusAdmin);
  const adminQ = useQuery({ queryKey: ["corpus-admin"], queryFn: () => checkAdmin() });

  if (adminQ.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminQ.data?.isAdmin) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Acceso restringido</h1>
        <p className="mt-2 text-muted-foreground">
          Este panel es solo para administradores del corpus de Jaikuaa.
        </p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  return <CorpusAdminContent />;
}

function CorpusAdminContent() {
  const qc = useQueryClient();
  const overviewFn = useServerFn(getCorpusOverview);
  const refreshFn = useServerFn(refreshAudioCoverage);

  const overview = useQuery({ queryKey: ["corpus-overview"], queryFn: () => overviewFn() });

  const refresh = useMutation({
    mutationFn: () => refreshFn(),
    onSuccess: (r) => {
      toast.success(
        `Audio re-escaneado: ${r.audioFiles} archivos, ${r.changed} palabras actualizadas.`,
      );
      void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
      void qc.invalidateQueries({ queryKey: ["corpus-words"] });
    },
    onError: () => toast.error("No se pudo re-escanear el audio."),
  });

  const totals = overview.data?.totals;
  const levels = overview.data?.levels ?? [];

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          ← Volver al panel
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
          Corpus guaraní
        </h1>
        <p className="mt-1 text-muted-foreground">
          Una sola fuente de palabras para todos los grados. Las palabras nunca se duplican: se
          reusan entre niveles.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Palabras únicas" value={totals?.words ?? 0} />
        <StatCard label="Con audio" value={totals?.withAudio ?? 0} accent />
        <StatCard label="Publicadas" value={totals?.published ?? 0} />
        <StatCard label="Oraciones" value={totals?.sentences ?? 0} />
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          {refresh.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Re-escanear audios
        </Button>
      </div>

      <Tabs defaultValue="importar" className="mt-8">
        <TabsList className="w-full">
          <TabsTrigger value="importar" className="flex-1">
            Importar Excel
          </TabsTrigger>
          <TabsTrigger value="cronograma" className="flex-1">
            Cronograma MEC
          </TabsTrigger>
          <TabsTrigger value="niveles" className="flex-1">
            Cobertura por grado
          </TabsTrigger>
          <TabsTrigger value="palabras" className="flex-1">
            Palabras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="importar" className="mt-6">
          <ImportPanel levels={levels} />
        </TabsContent>
        <TabsContent value="cronograma" className="mt-6">
          <CronogramaPanel />
        </TabsContent>
        <TabsContent value="niveles" className="mt-6">
          <LevelsPanel levels={levels} />
        </TabsContent>
        <TabsContent value="palabras" className="mt-6">
          <WordsPanel levels={levels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className={`font-display text-2xl font-bold ${accent ? "text-accent" : "text-primary"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

type Level = {
  id: string;
  label: string;
  stage: string;
  words: number;
  withAudio: number;
  published: number;
  sentences: number;
};

/* ------------------------------ IMPORTAR ------------------------------ */

function ImportPanel({ levels }: { levels: Level[] }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [defaultLevel, setDefaultLevel] = useState<string>("");
  const [overwrite, setOverwrite] = useState(false);

  const preview = useServerFn(previewFn);
  const commit = useServerFn(commitCorpusImport);

  const previewM = useMutation({
    mutationFn: (r: ParsedRow[]) => preview({ data: { rows: r } }),
    onError: () => toast.error("No se pudo analizar el archivo."),
  });

  const commitM = useMutation({
    mutationFn: (r: ParsedRow[]) => commit({ data: { rows: r, overwriteTranslations: overwrite } }),
    onSuccess: (res) => {
      toast.success(
        `Guardado: ${res.created} palabras nuevas, ${res.reused} reusadas, ${res.sentences} oraciones.`,
      );
      setRows([]);
      setFileName("");
      previewM.reset();
      void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
      void qc.invalidateQueries({ queryKey: ["corpus-words"] });
    },
    onError: () => toast.error("No se pudo guardar la importación."),
  });

  const levelIndex = useMemo(() => {
    const m = new Map<string, string>();
    for (const lv of levels) {
      m.set(lv.id.toLowerCase(), lv.id);
      m.set(lv.label.toLowerCase(), lv.id);
      m.set(lv.label.toLowerCase().replace(/[°º]/g, ""), lv.id);
    }
    return m;
  }, [levels]);

  function resolveLevel(raw: unknown): string {
    const s = String(raw ?? "")
      .trim()
      .toLowerCase();
    if (!s) return defaultLevel;
    return levelIndex.get(s) ?? levelIndex.get(s.replace(/[°º]/g, "")) ?? defaultLevel;
  }

  async function handleFile(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const parsed: ParsedRow[] = [];
    for (const r of json) {
      const keys = Object.keys(r);
      const pick = (...names: string[]) => {
        for (const n of names) {
          const k = keys.find((kk) => kk.trim().toLowerCase() === n);
          if (k && String(r[k]).trim()) return String(r[k]).trim();
        }
        return "";
      };
      const gn = pick("guarani", "guaraní", "gn", "palabra");
      const es = pick("español", "espanol", "es", "castellano", "traduccion", "traducción");
      if (!gn || !es) continue;
      const tipoRaw = pick("tipo").toLowerCase();
      const type: "palabra" | "oracion" =
        tipoRaw.startsWith("or") || gn.trim().includes(" ") ? "oracion" : "palabra";
      parsed.push({
        gn,
        es,
        levelId: resolveLevel(pick("grado", "nivel", "curso")),
        unit:
          pick("capacidad", "codigo", "código", "capacity").toUpperCase() ||
          pick("unidad", "tema", "unit"),
        type: tipoRaw ? (tipoRaw.startsWith("or") ? "oracion" : "palabra") : type,
        notes: pick("notas", "observaciones"),
      });
    }

    const sinNivel = parsed.filter((p) => !p.levelId).length;
    if (sinNivel > 0) {
      toast.warning(
        `${sinNivel} filas sin grado. Elegí un grado por defecto y volvé a subir el archivo.`,
      );
    }
    setRows(parsed.filter((p) => p.levelId));
    setFileName(file.name);
    previewM.reset();
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      {
        guarani: "Aguyje",
        español: "Gracias",
        grado: "1° grado",
        unidad: "Saludos",
        tipo: "palabra",
        notas: "",
      },
      {
        guarani: "Che sy iporã",
        español: "Mi mamá es linda",
        grado: "3° grado",
        unidad: "La familia",
        tipo: "oracion",
        notas: "",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "corpus");
    XLSX.writeFile(wb, "jaikuaa-plantilla-corpus.xlsx");
  }

  const p = previewM.data;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h2 className="font-display text-lg font-semibold text-primary">Cómo funciona</h2>
        <ol className="mt-2 space-y-1 text-sm text-foreground">
          <li>1. Preparás el Excel con las columnas: guaraní · español · grado · unidad · tipo.</li>
          <li>2. Lo subís acá y ves cuántas palabras son nuevas y cuántas se reusan.</li>
          <li>3. Guardás. El sistema te dice exactamente qué audios faltan grabar.</li>
          <li>4. Publicás el grado cuando la cobertura de audio esté completa.</li>
        </ol>
        <Button variant="outline" size="sm" className="mt-4" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Descargar plantilla
        </Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Grado por defecto
            </label>
            <Select value={defaultLevel} onValueChange={setDefaultLevel}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Elegí un grado" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((lv) => (
                  <SelectItem key={lv.id} value={lv.id}>
                    {lv.label} — {lv.stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Se usa cuando la fila del Excel no trae grado.
            </p>
          </div>
          <div className="flex flex-col justify-end">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <Button variant="cta" onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Elegir archivo Excel
            </Button>
            {fileName && (
              <p className="mt-2 text-xs text-muted-foreground">
                {fileName} · {rows.length} filas válidas
              </p>
            )}
          </div>
        </div>

        {rows.length > 0 && !p && (
          <Button
            className="mt-5 w-full"
            variant="outline"
            disabled={previewM.isPending}
            onClick={() => previewM.mutate(rows)}
          >
            {previewM.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Comparar contra el corpus
          </Button>
        )}
      </div>

      {p && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <PreviewBox
              tone="ok"
              title={`${p.reused.length} ya en el corpus`}
              subtitle="Se reusan · 0 audios nuevos"
              items={p.reused.map((r) => `${r.gn} — ${r.es}`)}
            />
            <PreviewBox
              tone="new"
              title={`${p.created.length} nuevas`}
              subtitle={`${p.audioToRecord.length} audios por grabar`}
              items={p.created.map((r) => `${r.gn} — ${r.es}${r.hasAudio ? " ✓ audio" : ""}`)}
            />
            <PreviewBox
              tone="warn"
              title={`${p.conflicts.length} conflictos`}
              subtitle="Misma palabra, traducción distinta"
              items={p.conflicts.map((c) => `${c.gn}: «${c.actual}» vs «${c.nuevo}»`)}
            />
          </div>

          {p.sentences.length > 0 && (
            <PreviewBox
              tone="ok"
              title={`${p.sentences.length} oraciones`}
              subtitle="Se arman con palabras del corpus"
              items={p.sentences.map(
                (s) =>
                  `${s.gn}${s.missingWords.length ? ` · faltan: ${s.missingWords.join(", ")}` : " ✓"}`,
              )}
            />
          )}

          {p.audioToRecord.length > 0 && (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
              <h3 className="flex items-center gap-2 font-display font-semibold text-accent">
                <Mic className="h-4 w-4" /> Audios a grabar ({p.audioToRecord.length})
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Nombres de archivo exactos para el bucket <code>guarani-audio</code>, MP3 mono 64
                kbps.
              </p>
              <div className="mt-3 max-h-40 overflow-auto rounded-lg bg-background p-3 font-mono text-xs leading-relaxed">
                {p.audioToRecord.join("\n")}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  void navigator.clipboard.writeText(p.audioToRecord.join("\n"));
                  toast.success("Lista copiada.");
                }}
              >
                Copiar lista
              </Button>
            </div>
          )}

          {p.conflicts.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
              Sobrescribir las traducciones existentes con las del Excel
            </label>
          )}

          <Button
            variant="cta"
            size="lg"
            className="w-full"
            disabled={commitM.isPending}
            onClick={() => commitM.mutate(rows)}
          >
            {commitM.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Guardar en el corpus
          </Button>
        </div>
      )}
    </div>
  );
}

function PreviewBox({
  tone,
  title,
  subtitle,
  items,
}: {
  tone: "ok" | "new" | "warn";
  title: string;
  subtitle: string;
  items: string[];
}) {
  const styles = {
    ok: "border-primary/25 bg-primary/5 text-primary",
    new: "border-accent/25 bg-accent/5 text-accent",
    warn: "border-destructive/25 bg-destructive/5 text-destructive",
  }[tone];
  const Icon = tone === "warn" ? AlertTriangle : CheckCircle2;

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <h3 className="flex items-center gap-2 font-display text-sm font-bold">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      <p className="mt-0.5 text-xs opacity-80">{subtitle}</p>
      {items.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-xs text-foreground">
          {items.map((it) => (
            <li key={it} className="truncate">
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------ NIVELES ------------------------------ */

function LevelsPanel({ levels }: { levels: Level[] }) {
  const qc = useQueryClient();
  const publish = useServerFn(publishLevel);
  const publishM = useMutation({
    mutationFn: (levelId: string) => publish({ data: { levelId } }),
    onSuccess: (r) => {
      toast.success(`${r.published} palabras publicadas.`);
      void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
    },
    onError: () => toast.error("No se pudo publicar el grado."),
  });

  return (
    <div className="space-y-2">
      {levels.map((lv) => {
        const pct = lv.words === 0 ? 0 : Math.round((lv.withAudio / lv.words) * 100);
        return (
          <div
            key={lv.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="min-w-[9rem]">
              <div className="font-display font-semibold text-foreground">{lv.label}</div>
              <div className="text-xs text-muted-foreground">{lv.stage}</div>
            </div>
            <div className="flex flex-1 flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{lv.words} palabras</Badge>
              <Badge variant="secondary">{lv.sentences} oraciones</Badge>
              <Badge variant={pct === 100 && lv.words > 0 ? "default" : "outline"}>
                {pct}% audio
              </Badge>
              <Badge variant="outline">{lv.published} publicadas</Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={lv.words === 0 || publishM.isPending}
              onClick={() => publishM.mutate(lv.id)}
            >
              Publicar
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ PALABRAS ------------------------------ */

function WordsPanel({ levels }: { levels: Level[] }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [levelId, setLevelId] = useState<string>("todos");
  const [onlyMissing, setOnlyMissing] = useState(false);

  const listFn = useServerFn(listCorpusWords);
  const updateFn = useServerFn(updateCorpusWord);
  const deleteFn = useServerFn(deleteCorpusWord);

  const wordsQ = useQuery({
    queryKey: ["corpus-words", search, levelId, onlyMissing],
    queryFn: () =>
      listFn({
        data: {
          search,
          levelId: levelId === "todos" ? undefined : levelId,
          onlyMissingAudio: onlyMissing,
          limit: 300,
        },
      }),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["corpus-words"] });
    void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
  };

  const updateM = useMutation({
    mutationFn: (v: { id: string; status?: "draft" | "published"; es?: string }) =>
      updateFn({ data: v }),
    onSuccess: invalidate,
    onError: () => toast.error("No se pudo actualizar."),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Palabra eliminada.");
      invalidate();
    },
    onError: () => toast.error("No se pudo eliminar."),
  });

  const words = wordsQ.data?.words ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en guaraní o español…"
            className="pl-9"
          />
        </div>
        <Select value={levelId} onValueChange={setLevelId}>
          <SelectTrigger className="w-[11rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los grados</SelectItem>
            {levels.map((lv) => (
              <SelectItem key={lv.id} value={lv.id}>
                {lv.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant={onlyMissing ? "cta" : "outline"} onClick={() => setOnlyMissing((v) => !v)}>
          <Mic className="mr-2 h-4 w-4" />
          Sin audio
        </Button>
      </div>

      {wordsQ.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : words.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No hay palabras con esos filtros.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          {words.map((w) => (
            <div
              key={w.id}
              className="flex flex-wrap items-center gap-3 border-b border-border/40 bg-card p-3 last:border-0"
            >
              <div className="min-w-[10rem] flex-1">
                <div className="font-display font-semibold text-foreground">{w.gn}</div>
                <div className="text-sm text-muted-foreground">{w.es}</div>
              </div>
              <code className="text-xs text-muted-foreground">{w.audio_slug}.mp3</code>
              <Badge variant={w.has_audio ? "default" : "outline"}>
                {w.has_audio ? "audio ✓" : "sin audio"}
              </Badge>
              <Button
                size="sm"
                variant={w.status === "published" ? "secondary" : "outline"}
                onClick={() =>
                  updateM.mutate({
                    id: w.id,
                    status: w.status === "published" ? "draft" : "published",
                  })
                }
              >
                {w.status === "published" ? "Publicada" : "Borrador"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Eliminar ${w.gn}`}
                onClick={() => deleteM.mutate(w.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
