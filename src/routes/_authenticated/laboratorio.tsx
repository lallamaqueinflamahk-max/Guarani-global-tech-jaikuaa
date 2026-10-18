import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { BookOpen, FlaskConical, Info, Search, ShieldAlert } from "lucide-react";
import { PrivateGate } from "@/components/private-gate";
import { ValidationNotice } from "@/components/validation-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { analyze, normalizeWord, type Analysis } from "@/lib/morph/analyzer";
import type { Paradigm, Person } from "@/lib/morph/academia-rules";

/**
 * Laboratorio Morfológico (privado, solo admin).
 * Muestra lo que devuelve analyze(): no genera, traduce ni corrige guaraní.
 * Toda forma queda "pendiente de validación" hasta que la apruebe un especialista.
 */
export const Route = createFileRoute("/_authenticated/laboratorio")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Laboratorio Morfológico Guaraní" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <PrivateGate>
      <LaboratorioPage />
    </PrivateGate>
  ),
});

const BOOK = "Guarani Ñe'ẽ Rerekuapavẽ (2020)";

/** Caracteres del alfabeto oficial que no están en el teclado común (pág. 33). */
const SPECIAL_CHARS = ["ã", "ẽ", "ĩ", "õ", "ũ", "ỹ", "ñ", "g̃", "'"] as const;

/** Formas tomadas literalmente del libro, con la página donde aparecen. */
const BOOK_EXAMPLES: { word: string; page: number; note: string }[] = [
  { word: "aguapy", page: 103, note: "areal, 1.ª sing., oral" },
  { word: "ñamaña", page: 103, note: "areal, 1.ª pl. incl., nasal" },
  { word: "ndojapói", page: 25, note: "negación oral nd- … -i" },
  { word: "noñaníri", page: 25, note: "negación nasal n- … -ri" },
  { word: "aipota", page: 105, note: "aireal" },
  { word: "ha'a", page: 105, note: "hareal, con puso" },
  { word: "aguapyse", page: 139, note: "modo volitivo -se" },
  { word: "akarúkuri", page: 129, note: "pretérito reciente -kuri" },
  { word: "ndojeporuva'erãi", page: 184, note: "negación con futuro obligatorio" },
];

const PERSON_LABEL: Record<Person, { label: string; pronoun: string }> = {
  "1sg": { label: "1.ª persona singular", pronoun: "Che" },
  "2sg": { label: "2.ª persona singular", pronoun: "Nde" },
  "3": { label: "3.ª persona (singular y plural)", pronoun: "Ha'e / Ha'ekuéra" },
  "1pl_incl": { label: "1.ª persona plural inclusiva", pronoun: "Ñande" },
  "1pl_excl": { label: "1.ª persona plural exclusiva", pronoun: "Ore" },
  "2pl": { label: "2.ª persona plural", pronoun: "Peẽ" },
};

const PARADIGM_LABEL: Record<Paradigm, string> = {
  areal: "Areal (regular)",
  aireal: "Aireal (regular, 1.ª conjugación)",
  hareal: "Hareal (regular, 2.ª conjugación)",
};

type Block = { kind: "neg" | "person" | "root" | "suffix"; text: string; label: string };

/** Arma los bloques a partir de lo que devolvió el analizador; no agrega letras propias. */
function toBlocks(a: Analysis): Block[] {
  const word = normalizeWord(a.word);
  const core = a.prefix + a.root + a.suffixes.map((x) => x.form).join("");
  const start = word.indexOf(core);
  const blocks: Block[] = [];
  if (a.negated && start > 0) blocks.push({ kind: "neg", text: word.slice(0, start), label: "Negación (prefijo)" });
  blocks.push({ kind: "person", text: a.prefix, label: "Persona" });
  blocks.push({ kind: "root", text: a.root, label: "Raíz verbal" });
  for (const sfx of a.suffixes) {
    blocks.push({ kind: "suffix", text: sfx.form, label: `${sfx.meaning} · pág. ${sfx.page}` });
  }
  const end = start >= 0 ? start + core.length : word.length;
  if (a.negated && end < word.length) blocks.push({ kind: "neg", text: word.slice(end), label: "Negación (sufijo)" });
  return blocks;
}

const BLOCK_STYLE: Record<Block["kind"], string> = {
  neg: "border-red-300 bg-red-50 text-red-900 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-100",
  person: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-100",
  suffix: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100",
  root: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100",
};

function LaboratorioPage() {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [results, setResults] = useState<Analysis[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (word: string) => {
    const w = word.trim();
    setSubmitted(w || null);
    setResults(w ? analyze(w) : []);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    run(value);
  };

  /** Inserta el carácter donde está el cursor. */
  const insertChar = (ch: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + ch + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + ch.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const tryExample = (word: string) => {
    setValue(word);
    run(word);
  };

  return (
    <div className="min-h-screen bg-background">
      <ValidationNotice />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Cabecera */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FlaskConical className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Laboratorio Morfológico Guaraní
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Desarmador y analizador morfológico basado en la Gramática Oficial (Academia de la Lengua Guaraní, 2020)
              </p>
            </div>
          </div>
          <Badge className="self-start whitespace-nowrap border-accent/40 bg-accent/10 text-accent hover:bg-accent/10" variant="outline">
            En validación — pendiente de especialistas
          </Badge>
        </header>

        {/* Entrada */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <label htmlFor="lab-word" className="text-sm font-medium text-foreground">
                Escribí una palabra conjugada en guaraní
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="lab-word"
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={60}
                  className="h-12 text-lg"
                  placeholder="Escribí aquí"
                />
                <Button type="submit" variant="cta" size="lg" className="h-12" disabled={!value.trim()}>
                  <Search className="mr-2 h-4 w-4" aria-hidden />
                  Analizar morfología
                </Button>
              </div>

              <div className="flex flex-wrap gap-2" aria-label="Caracteres del alfabeto guaraní">
                {SPECIAL_CHARS.map((ch) => (
                  <Button
                    key={ch}
                    type="button"
                    variant="outline"
                    className="h-10 min-w-10 px-3 text-lg"
                    onClick={() => insertChar(ch)}
                    aria-label={ch === "'" ? "Insertar puso" : `Insertar ${ch}`}
                    title={ch === "'" ? "puso" : undefined}
                  >
                    {ch}
                  </Button>
                ))}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Ejemplos del libro */}
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden />
            Ejemplos tomados del libro
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BOOK_EXAMPLES.map((ex) => (
              <button
                key={ex.word}
                type="button"
                onClick={() => tryExample(ex.word)}
                className="rounded-xl border border-border/60 bg-card px-4 py-3 text-left transition hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="font-display text-lg font-semibold text-foreground">{ex.word}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  pág. {ex.page} · {ex.note}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Resultados */}
        {submitted && (
          <section className="mt-8" aria-live="polite">
            {results.length === 0 ? (
              <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-500/10">
                <CardContent className="flex items-start gap-3 pt-6">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
                  <p className="text-sm text-foreground">
                    <strong>«{submitted}»:</strong> forma no contemplada en las reglas cargadas o requiere revisión humana.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-foreground">Análisis de «{submitted}»</h2>
                  {results.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {results.length} lecturas posibles según las reglas cargadas. La correcta la decide un especialista.
                    </p>
                  )}
                </div>
                <div className="mt-4 space-y-4">
                  {results.map((a, i) => (
                    <AnalysisCard key={`${a.paradigm}-${a.person}-${a.prefix}-${a.negated}-${i}`} analysis={a} index={i + 1} total={results.length} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        <p className="mt-10 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Herramienta interna en desarrollo. Aplica reglas tomadas de la gramática publicada por la Academia de la Lengua Guaraní;
          no es una herramienta de la Academia ni cuenta con su aprobación. Ningún resultado se usa en clase sin validación de especialistas.
        </p>
      </main>
    </div>
  );
}

function AnalysisCard({ analysis: a, index, total }: { analysis: Analysis; index: number; total: number }) {
  const blocks = toBlocks(a);
  const person = PERSON_LABEL[a.person];
  const pages = [...new Set(a.pages)].sort((x, y) => x - y);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-display text-base">
            {total > 1 ? `Lectura ${index} de ${total}` : "Lectura"}
          </CardTitle>
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            Pendiente de validación
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Bloques */}
        <div className="flex flex-wrap items-stretch gap-2" aria-label="Partes de la palabra">
          {blocks.map((b, i) => (
            <div key={`${b.kind}-${i}`} className={`flex min-w-16 flex-col items-center rounded-xl border-2 px-4 py-2 ${BLOCK_STYLE[b.kind]}`}>
              <span className="font-display text-2xl font-bold leading-tight">{b.text}</span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-wide opacity-80">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Ficha técnica */}
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Sujeto / persona</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {person.label} <span className="text-muted-foreground">({person.pronoun})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Conjugación</dt>
            <dd className="mt-0.5 font-medium text-foreground">{PARADIGM_LABEL[a.paradigm]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tiempo y modo</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {a.suffixes.length ? a.suffixes.map((x) => x.meaning).join(" · ") : "Sin partículas: presente y modo indicativo simple (págs. 123 y 139)"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Forma</dt>
            <dd className="mt-0.5 font-medium text-foreground">{a.negated ? "Negativa" : "Afirmativa"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Fuente</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              Regla según {BOOK}, {pages.length > 1 ? "págs." : "pág."} {pages.join(" y ")}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
