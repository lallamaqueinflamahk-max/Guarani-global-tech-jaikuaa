import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, CheckCircle2, FlaskConical, Info, Library, Search, ShieldAlert } from "lucide-react";
import { PrivateGate } from "@/components/private-gate";
import { ValidationNotice } from "@/components/validation-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { analyze, normalizeWord, type Analysis, type AnalysisParadigm } from "@/lib/morph/analyzer";
import type { Person } from "@/lib/morph/academia-rules";
import { buildCorpusIndex, rankByAttestation, type Attestation } from "@/lib/morph/corpus-index";
import { checkWord, type OrthographyIssue } from "@/lib/morph/orthography";
import { getLabCorpus } from "@/lib/laboratorio.functions";

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
  { word: "amboguata", page: 119, note: "voz coactiva mbo-" },
  { word: "ajapouka", page: 145, note: "modo mediativo -uka" },
  { word: "tapytáke", page: 167, note: "imperativo conminativo -ke" },
  { word: "amba'apove", page: 175, note: "grado comparativo -ve" },
  { word: "iporã", page: 93, note: "predicativo i-" },
  { word: "chejuhu", page: 103, note: "pronominal (objeto che-)" },
  { word: "oho", page: 97, note: "lexema variable «ho»" },
];

/** Cuántas lecturas se muestran antes de "Ver las demás". */
const VISIBLE_READINGS = 3;

const PERSON_LABEL: Record<Person, { label: string; pronoun: string }> = {
  "1sg": { label: "1.ª persona singular", pronoun: "Che" },
  "2sg": { label: "2.ª persona singular", pronoun: "Nde" },
  "3": { label: "3.ª persona (singular y plural)", pronoun: "Ha'e / Ha'ekuéra" },
  "1pl_incl": { label: "1.ª persona plural inclusiva", pronoun: "Ñande" },
  "1pl_excl": { label: "1.ª persona plural exclusiva", pronoun: "Ore" },
  "2pl": { label: "2.ª persona plural", pronoun: "Peẽ" },
};

const PARADIGM_LABEL: Record<AnalysisParadigm, string> = {
  areal: "Areal (regular)",
  aireal: "Aireal (regular, 1.ª conjugación)",
  hareal: "Hareal (regular, 2.ª conjugación)",
  imperativo: "Imperativo / optativo (pág. 165)",
  predicativo: "Predicativo: sustantivo, adjetivo o adverbio conjugado (págs. 93 y 101)",
  pronominal: "Pronominal: la persona es el objeto de la acción (pág. 103)",
  irregular: "Lexema variable (pág. 97)",
};

type Block = { kind: "neg" | "person" | "voice" | "root" | "suffix"; text: string; label: string };

/** Arma los bloques a partir de lo que devolvió el analizador; no agrega letras propias. */
function toBlocks(a: Analysis): Block[] {
  const word = normalizeWord(a.word);
  const core = a.prefix + a.voices.map((v) => v.form).join("") + a.root + a.suffixes.map((x) => x.form).join("");
  const start = word.indexOf(core);
  const blocks: Block[] = [];
  if (a.negated && start > 0) blocks.push({ kind: "neg", text: word.slice(0, start), label: "Negación (prefijo)" });
  if (a.prefix) {
    const personLabel = a.paradigm === "imperativo" ? "Persona (imperativo)" : a.paradigm === "pronominal" ? "Persona (objeto)" : "Persona";
    blocks.push({ kind: "person", text: a.prefix, label: personLabel });
  }
  for (const v of a.voices) blocks.push({ kind: "voice", text: v.form, label: `${v.meaning} · pág. ${v.page}` });
  blocks.push({
    kind: "root",
    text: a.root,
    label: a.lexeme
      ? `Forma de «${a.lexeme.form}» (${a.lexeme.meaning}) · pág. ${a.lexeme.page}`
      : a.paradigm === "predicativo"
        ? "Raíz (nombre o adjetivo)"
        : "Raíz verbal",
  });
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
  voice: "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-100",
  suffix: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100",
  root: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100",
};

function LaboratorioPage() {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [results, setResults] = useState<Analysis[]>([]);
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vocabulario de la plataforma: sirve para ordenar lecturas y mostrar evidencia, nunca para inventar.
  const corpusFn = useServerFn(getLabCorpus);
  const corpus = useQuery({ queryKey: ["lab-corpus"], queryFn: () => corpusFn(), staleTime: 5 * 60_000 });
  const index = useMemo(() => (corpus.data ? buildCorpusIndex(corpus.data.entries) : null), [corpus.data]);
  const ranked = useMemo(() => rankByAttestation(results, index), [results, index]);
  const wordInCorpus: Attestation | null = submitted && index ? index.word(submitted) : null;

  const run = (word: string) => {
    const w = word.trim();
    setSubmitted(w || null);
    setResults(w ? analyze(w) : []);
    setShowAll(false);
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
            <OrthographyPanel word={submitted} />
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
                <CorpusStatus loading={corpus.isLoading} failed={corpus.isError} size={index?.size ?? 0} word={submitted} inWord={wordInCorpus} />
                <div className="mt-4 space-y-4">
                  {(showAll ? ranked : ranked.slice(0, VISIBLE_READINGS)).map(({ reading: a, attestation }, i) => (
                    <AnalysisCard
                      key={`${a.paradigm}-${a.person}-${a.prefix}-${a.negated}-${a.root}-${i}`}
                      analysis={a}
                      attestation={attestation}
                      index={i + 1}
                      total={results.length}
                    />
                  ))}
                </div>
                {!showAll && ranked.length > VISIBLE_READINGS && (
                  <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setShowAll(true)}>
                    Ver las {ranked.length - VISIBLE_READINGS} lecturas restantes
                  </Button>
                )}
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

const SEVERITY_LABEL: Record<OrthographyIssue["severity"], string> = {
  error: "No cumple la regla",
  revisar: "Revisar",
  prestamo: "Préstamo",
};

/** Avisos de las reglas ortográficas del libro (págs. 19–37). Solo verifica: no corrige ni propone formas. */
function OrthographyPanel({ word }: { word: string }) {
  const issues = useMemo(() => checkWord(word), [word]);
  return (
    <div className="mb-4 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        {issues.length === 0 ? (
          <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-hidden />
        )}
        Ortografía (reglas de las págs. 19–37)
      </p>
      {issues.length === 0 ? (
        <p className="mt-1 text-muted-foreground">
          Sin avisos en alfabeto, tilde, sílabas nasales y sílaba directa. Esto no confirma que la palabra exista.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {issues.map((i, k) => (
            <li key={`${i.rule}-${k}`} className="flex flex-wrap items-baseline gap-2">
              <Badge variant="outline" className="whitespace-nowrap">
                {SEVERITY_LABEL[i.severity]} · pág. {i.page}
              </Badge>
              <span className="text-foreground">{i.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Estado del vocabulario y si la palabra escrita está tal cual en él. */
function CorpusStatus({ loading, failed, size, word, inWord }: { loading: boolean; failed: boolean; size: number; word: string; inWord: Attestation | null }) {
  if (loading) return <p className="mt-3 text-xs text-muted-foreground">Cargando el vocabulario de la plataforma…</p>;
  if (failed) return <p className="mt-3 text-xs text-muted-foreground">No se pudo cargar el vocabulario: las lecturas se muestran en el orden del analizador.</p>;
  return (
    <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
      <Library className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        Ordenadas según el vocabulario de Jaikuaa ({size} palabras publicadas): primero las raíces validadas por docentes, después las
        que aparecen en el vocabulario.
        {inWord && inWord.level !== "none" && (
          <strong className="text-foreground">
            {" "}«{word}» figura tal cual en el vocabulario{inWord.level === "validated" ? ", validada por docentes." : " (aún sin validación de docentes)."}
          </strong>
        )}
      </span>
    </div>
  );
}

function AttestationNote({ attestation }: { attestation: Attestation }) {
  if (attestation.level === "none") {
    return <p className="text-xs text-muted-foreground">La raíz no aparece en el vocabulario de la plataforma.</p>;
  }
  const words = attestation.examples.map((w) => `«${w}»`).join(", ");
  return attestation.level === "validated" ? (
    <p className="flex items-start gap-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      Raíz validada por docentes: aparece en {words}.
    </p>
  ) : (
    <p className="text-xs text-foreground">
      La raíz aparece en el vocabulario de Jaikuaa ({words}), aún sin validación de docentes.
    </p>
  );
}

function AnalysisCard({ analysis: a, attestation, index, total }: { analysis: Analysis; attestation: Attestation; index: number; total: number }) {
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
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{a.paradigm === "pronominal" ? "Objeto (a quién)" : "Sujeto / persona"}</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {person.label} <span className="text-muted-foreground">({person.pronoun})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Conjugación</dt>
            <dd className="mt-0.5 font-medium text-foreground">{PARADIGM_LABEL[a.paradigm]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Voz</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {a.voices.length
                ? a.voices.map((v) => v.meaning).join(" · ")
                : a.paradigm === "predicativo" || a.paradigm === "pronominal"
                  ? "No aplica en estas reglas"
                  : "Voz activa simple, sin partícula (pág. 117)"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tiempo, modo y grado</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {a.suffixes.length
                ? a.suffixes.map((x) => x.meaning).join(" · ")
                : a.paradigm === "imperativo"
                  ? "Modo imperativo sin partícula (pág. 165)"
                  : "Sin partículas: presente y modo indicativo simple (págs. 123 y 139)"}
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
        <AttestationNote attestation={attestation} />
      </CardContent>
    </Card>
  );
}
