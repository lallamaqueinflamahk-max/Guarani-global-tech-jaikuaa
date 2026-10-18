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
import { CLOSED_CLASS_LABEL, lookupClosed } from "@/lib/morph/closed-classes";
import { analyzeNominal, type NominalAnalysis } from "@/lib/morph/nominal-analyzer";
import { getLabBook, getLabCorpus, getLabWiktionary } from "@/lib/laboratorio.functions";
import { buildWiktionaryIndex, FORM_OF_LABEL, POS_LABEL, type WiktionaryHit, type WiktionaryIndex } from "@/lib/morph/wikcionario";
import { buildBookIndex, type BookIndex } from "@/lib/morph/book-lexicon";
import { buildCalcoIndex, type CalcoIndex } from "@/lib/morph/calcos";
import { checkText } from "@/lib/morph/orthography";

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
  { word: "rógakuéra", page: 83, note: "triforme óga + plural -kuéra" },
  { word: "iñakãngue", page: 59, note: "posesivo iñ- + preteritiva -ngue" },
  { word: "ndajajuhúi", page: 115, note: "negación con vocal eufónica" },
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
  // Formas que imprime la Gramática ALG 2020 (solo servidor/admin): atestiguación por la fuente oficial.
  const bookFn = useServerFn(getLabBook);
  const bookQ = useQuery({ queryKey: ["lab-book"], queryFn: () => bookFn(), staleTime: Infinity });
  const book = useMemo(() => (bookQ.data ? buildBookIndex(bookQ.data.forms) : null), [bookQ.data]);
  const calcos = useMemo(() => (bookQ.data ? buildCalcoIndex(bookQ.data.calcos) : null), [bookQ.data]);
  const ranked = useMemo(() => rankByAttestation(results, index, book), [results, index, book]);
  // Significados del Wikcionario (CC BY-SA, solo admin): fuente externa, se muestra aparte y citada.
  const wikFn = useServerFn(getLabWiktionary);
  const wikQ = useQuery({ queryKey: ["lab-wiktionary"], queryFn: () => wikFn(), staleTime: Infinity });
  const wik = useMemo(() => (wikQ.data ? buildWiktionaryIndex(wikQ.data.entries) : null), [wikQ.data]);
  const wordInCorpus: Attestation | null = submitted && index ? index.word(submitted) : null;

  const closed = useMemo(() => (submitted ? lookupClosed(submitted) : []), [submitted]);
  const nominal = useMemo(() => (submitted ? analyzeNominal(submitted) : []), [submitted]);
  const nominalRanked = useMemo(() => rankByAttestation(nominal, index, book), [nominal, index, book]);

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

        {/* Frases: ortografía y calcos del capítulo 6 */}
        <SentenceChecker calcos={calcos} loading={bookQ.isLoading} />

        {/* Resultados */}
        {submitted && (
          <section className="mt-8" aria-live="polite">
            <OrthographyPanel word={submitted} />
            {closed.length > 0 && <ClosedClassPanel matches={closed} />}
            {book && bookQ.data && (
              <BookPanel
                word={submitted}
                book={book}
                observaciones={bookQ.data.observaciones}
                showCompounds={![...ranked, ...nominalRanked].some((r) => r.attestation.level !== "none") && closed.length === 0}
              />
            )}
            {wik && wikQ.data && (
              <WiktionaryPanel
                word={submitted}
                wik={wik}
                attribution={wikQ.data.source.atribucion}
                license={wikQ.data.source.licencia}
                roots={[...ranked.slice(0, 3).map((r) => r.reading.root), ...nominalRanked.slice(0, 3).map((r) => r.reading.root)]}
              />
            )}
            {results.length === 0 && nominal.length === 0 && closed.length === 0 ? (
              <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-500/10">
                <CardContent className="flex items-start gap-3 pt-6">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
                  <p className="text-sm text-foreground">
                    <strong>«{submitted}»:</strong> forma no contemplada en las reglas cargadas o requiere revisión humana.
                  </p>
                </CardContent>
              </Card>
            ) : results.length === 0 ? null : (
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
            {nominal.length > 0 && <NominalReadings readings={nominalRanked} />}
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

/**
 * Revisión de una frase: avisos de ortografía (págs. 19–37) y comparación con los 110 pares de
 * calcos del capítulo 6 (págs. 246–253). Solo cita al libro; no reescribe la frase.
 */
function SentenceChecker({ calcos, loading }: { calcos: CalcoIndex | null; loading: boolean }) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<string | null>(null);
  const issues = useMemo(() => (checked ? checkText(checked) : []), [checked]);
  const matches = useMemo(() => (checked && calcos ? calcos.check(checked) : []), [checked, calcos]);
  const HOW: Record<"exacta" | "contiene" | "parecida", string> = { exacta: "igual", contiene: "la contiene", parecida: "difiere en una palabra" };
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Revisar una frase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(ev: FormEvent) => {
            ev.preventDefault();
            setChecked(text.trim() || null);
          }}
        >
          <Input
            value={text}
            onChange={(ev: { target: { value: string } }) => setText(ev.target.value)}
            maxLength={300}
            autoComplete="off"
            spellCheck={false}
            className="h-11"
            placeholder="Escribí una frase en guaraní"
            aria-label="Frase en guaraní"
          />
          <Button type="submit" variant="outline" className="h-11" disabled={!text.trim()}>
            Revisar frase
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Compara con los 110 pares «Como se dice / Como debe decirse» del capítulo 6 (págs. 246–253) y revisa la ortografía.
          {loading && " Cargando los pares del libro…"}
        </p>
        {checked && (
          <div className="space-y-3">
            {matches.length === 0 ? (
              <p className="text-muted-foreground">No coincide con ninguno de los pares del capítulo 6.</p>
            ) : (
              <ul className="space-y-2">
                {matches.map((m) => (
                  <li key={`${m.pair.n}-${m.kind}`} className="rounded-lg border border-border/60 px-3 py-2">
                    {m.kind === "calco" ? (
                      <>
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          El libro da esta frase como calco ({HOW[m.how]}, n.º {m.pair.n}, pág. {m.pair.paginas[0]}): «{m.pair.calco}»
                        </p>
                        <p className="text-foreground">
                          Como debe decirse según el libro (pág. {m.pair.paginas[1]}): {m.pair.correcta.map((c) => `«${c}»`).join(" o ")}
                        </p>
                      </>
                    ) : (
                      <p className="text-emerald-800 dark:text-emerald-200">
                        Es la forma que el libro recomienda ({HOW[m.how]}, n.º {m.pair.n}, pág. {m.pair.paginas[1]}), en lugar de «{m.pair.calco}».
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {issues.length > 0 ? (
              <ul className="space-y-1">
                {issues.map((i, k) => (
                  <li key={`${i.word}-${k}`} className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline">{SEVERITY_LABEL[i.severity]} · pág. {i.page}</Badge>
                    <span>
                      «{i.word}»: {i.message}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Sin avisos de ortografía.</p>
            )}
            <p className="text-xs text-muted-foreground">Pendiente de validación: la decisión final es de un especialista.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ¿La palabra aparece tal cual en la Gramática? Si no, formas del libro parecidas y lecturas de
 * compuesto (pág. 53). No es una corrección: solo muestra palabras que el libro imprime.
 */
function BookPanel({
  word,
  book,
  observaciones,
  showCompounds,
}: {
  word: string;
  book: BookIndex;
  observaciones: Record<string, { pages: number[]; issues: string[] }>;
  showCompounds: boolean;
}) {
  const hit = useMemo(() => book.lookup(word), [book, word]);
  const observed = observaciones[normalizeWord(word)];
  const similar = useMemo(() => (hit ? [] : book.similar(word, 2, 5)), [book, word, hit]);
  const compounds = useMemo(() => (hit || !showCompounds ? [] : book.compounds(word).slice(0, 3)), [book, word, hit, showCompounds]);
  return (
    <div className="mb-4 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <Library className="h-4 w-4 text-primary" aria-hidden />
        En la Gramática oficial ({book.size} formas)
      </p>
      {hit ? (
        <p className="mt-1 text-foreground">
          «{hit.form}» aparece en el libro (pág. {hit.pages.slice(0, 6).join(", ")}).
          {hit.accentDiffers && <span className="text-amber-700 dark:text-amber-300"> El libro la escribe con otra tilde.</span>}
        </p>
      ) : observed ? (
        <p className="mt-1 text-foreground">
          El libro la imprime así (pág. {observed.pages.join(", ")}), pero el corrector marca: {observed.issues.join("; ")}. Queda como observación para especialistas.
        </p>
      ) : (
        <p className="mt-1 text-muted-foreground">No aparece tal cual en el libro.</p>
      )}
      {similar.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">Formas del libro parecidas (no es una corrección; decide un especialista):</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {similar.map((s) => (
              <li key={s.form}>
                <Badge variant="outline">
                  {s.form} · pág. {s.pages[0]}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      {compounds.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">Posible palabra compuesta (pág. 53: dos núcleos que se unen sin pérdida de elementos):</p>
          <ul className="mt-1 space-y-1">
            {compounds.map((c) => (
              <li key={c.parts.map((p) => p.form).join("+")} className="text-foreground">
                {c.parts[0].form} + {c.parts[1].form}{" "}
                <span className="text-xs text-muted-foreground">
                  (págs. {c.parts[0].pages[0]} y {c.parts[1].pages[0]})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Definiciones de una entrada del Wikcionario, tal cual (en inglés). */
function WiktionaryLine({ hit }: { hit: WiktionaryHit }) {
  const { entry, accentDiffers, lemma } = hit;
  const flagged =
    !["character", "suffix", "prefix", "circumfix"].includes(entry.pos) &&
    entry.word.split(/\s+/).some((w) => checkWord(w).some((i) => i.severity === "error"));
  return (
    <li className="space-y-0.5">
      <p className="text-foreground">
        <strong>{entry.word}</strong> <span className="text-xs text-muted-foreground">({POS_LABEL[entry.pos] ?? entry.pos})</span>{" "}
        {entry.formOf ? (
          <span>
            {FORM_OF_LABEL[entry.formOf.kind]} «{entry.formOf.lemma}»
            {lemma && lemma.length > 0 && <span className="text-muted-foreground"> — {lemma.flatMap((l) => l.glosses).slice(0, 3).join("; ")}</span>}
          </span>
        ) : (
          <span>{entry.glosses.join("; ")}</span>
        )}
      </p>
      {accentDiffers && <p className="text-xs text-amber-700 dark:text-amber-300">La fuente la escribe con otra tilde.</p>}
      {flagged && <p className="text-xs text-amber-700 dark:text-amber-300">El corrector marca esta escritura según las reglas de la Gramática ALG (págs. 19–37).</p>}
    </li>
  );
}

/**
 * Significados del Wikcionario: fuente colaborativa externa (CC BY-SA 4.0), en inglés y sin
 * validar. Busca la palabra; si no está, las raíces de las lecturas. No traduce ni corrige.
 */
function WiktionaryPanel({ word, wik, roots, attribution, license }: { word: string; wik: WiktionaryIndex; roots: string[]; attribution: string; license: string }) {
  const direct = useMemo(() => wik.lookup(word), [wik, word]);
  const viaRoots = useMemo(() => {
    if (direct.length > 0) return [];
    const seen = new Set<string>();
    const out: { root: string; hits: WiktionaryHit[] }[] = [];
    for (const r of roots) {
      const k = normalizeWord(r);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const hits = wik.lookup(r);
      if (hits.length > 0) out.push({ root: r, hits });
    }
    return out.slice(0, 3);
  }, [wik, word, roots, direct]);
  if (direct.length === 0 && viaRoots.length === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-dashed border-border px-4 py-3 text-sm">
      <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
        <Info className="h-4 w-4 text-muted-foreground" aria-hidden />
        Significado según el Wikcionario (fuente externa, en inglés)
        <Badge variant="outline" className="whitespace-nowrap">Wikcionario · CC BY-SA</Badge>
      </p>
      {direct.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {direct.map((h, k) => (
            <WiktionaryLine key={`${h.entry.word}-${h.entry.pos}-${k}`} hit={h} />
          ))}
        </ul>
      ) : (
        viaRoots.map(({ root, hits }) => (
          <div key={root} className="mt-2">
            <p className="text-xs text-muted-foreground">La palabra no está; sí la raíz «{root}» de una de las lecturas:</p>
            <ul className="mt-1 space-y-1.5">
              {hits.map((h, k) => (
                <WiktionaryLine key={`${h.entry.word}-${h.entry.pos}-${k}`} hit={h} />
              ))}
            </ul>
          </div>
        ))
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {attribution}. Licencia {license}. No es la Gramática de la Academia ni está validado por docentes de Jaikuaa.
      </p>
    </div>
  );
}

/** La palabra está en una de las listas cerradas del libro (pronombres, adverbios, conjunciones…). */
function ClosedClassPanel({ matches }: { matches: ReturnType<typeof lookupClosed> }) {
  return (
    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <BookOpen className="h-4 w-4 text-primary" aria-hidden />
        Está en las listas del libro
      </p>
      <ul className="mt-2 space-y-1.5">
        {matches.map(({ entry, accentDiffers }, k) => (
          <li key={`${entry.cls}-${k}`} className="flex flex-wrap items-baseline gap-2">
            <Badge variant="outline" className="whitespace-nowrap">pág. {entry.page}</Badge>
            <span className="text-foreground">
              {CLOSED_CLASS_LABEL[entry.cls]}: «{entry.form}»{entry.gloss ? ` — ${entry.gloss}` : ""}
            </span>
            {accentDiffers && <span className="text-xs text-amber-700 dark:text-amber-300">(el libro la escribe con otra tilde)</span>}
            {entry.note && <span className="w-full text-xs text-muted-foreground">{entry.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pieza tomada de la fuente académica externa (no del libro de la Academia). */
function ExternalTag({ page }: { page: number }) {
  return (
    <span className="text-amber-700 dark:text-amber-300">
      (fuente académica externa: Estigarribia 2020, pág. {page}; no está en la Gramática ALG)
    </span>
  );
}

const HARMONY_LABEL: Record<NominalAnalysis["harmony"], string | null> = {
  ok: "Armonía nasal correcta según la última sílaba de la raíz (págs. 29, 61 y 63)",
  no: "La partícula no corresponde a la armonía nasal de la última sílaba de la raíz (págs. 29, 61 y 63)",
  duda: "Armonía nasal en duda: el libro no decide con consonantes naso-orales",
  "no-aplica": null,
};

/** Lecturas como sustantivo, adjetivo o adverbio (págs. 49–85 y 207). */
function NominalReadings({ readings }: { readings: { reading: NominalAnalysis; attestation: Attestation }[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? readings : readings.slice(0, VISIBLE_READINGS);
  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-bold text-foreground">Lecturas como sustantivo, adjetivo o adverbio</h2>
      <p className="mt-1 text-xs text-muted-foreground">Según las reglas del sustantivo y del adjetivo (págs. 49–85). La correcta la decide un especialista.</p>
      <div className="mt-3 space-y-3">
        {shown.map(({ reading: a, attestation }, i) => (
          <Card key={`${a.possessor?.form ?? ""}-${a.root}-${a.suffixes.map((s) => s.ruleId).join("+")}-${i}`}>
            <CardContent className="space-y-2 pt-5 text-sm">
              <p className="font-display text-base">
                {a.possessor && <span className="text-accent">{a.possessor.form}-</span>}
                <strong className="text-foreground">{a.root}</strong>
                {a.suffixes.map((s) => (
                  <span key={s.ruleId} className="text-primary">-{s.form}</span>
                ))}
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {a.possessor && <li>Índice de posesión de 3.ª persona «{a.possessor.form}» (pág. {a.possessor.page})</li>}
                {a.multiform && (
                  <li>
                    Sustantivo {a.multiform.kind}: «{a.multiform.form}» es forma de «{a.multiform.absolute}»{" "}
                    {a.multiform.external ? <ExternalTag page={a.multiform.page} /> : `(pág. ${a.multiform.page})`}
                  </li>
                )}
                {a.suffixes.map((s) => (
                  <li key={`m-${s.ruleId}`}>
                    «{s.form}»: {s.meaning} {s.external ? <ExternalTag page={s.page} /> : `(pág. ${s.page})`}
                  </li>
                ))}
                {HARMONY_LABEL[a.harmony] && <li>{HARMONY_LABEL[a.harmony]}</li>}
              </ul>
              <AttestationNote attestation={attestation} />
              <Badge variant="outline" className="border-accent/40 text-accent">Pendiente de validación</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      {!all && readings.length > VISIBLE_READINGS && (
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => setAll(true)}>
          Ver las {readings.length - VISIBLE_READINGS} lecturas restantes
        </Button>
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
        Ordenadas así: primero las raíces validadas por docentes, después las que están en la Gramática oficial y después las del
        vocabulario de Jaikuaa ({size} palabras publicadas, aún sin validar).
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
  if (attestation.level === "book") {
    return (
      <p className="flex items-start gap-1.5 text-xs font-medium text-foreground">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        La raíz aparece tal cual en la Gramática oficial: {words} (pág. {attestation.pages.join(", ")}).
      </p>
    );
  }
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
