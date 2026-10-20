import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameShell, XpNote, shuffle } from "@/components/games/game-shell";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";
import { Mic, Square, Play, Music } from "lucide-react";

export const Route = createFileRoute("/_authenticated/juegos/karaoke")({
  head: () => ({
    meta: [
      { title: "Purahéi Karaoke | Jaikuaa" },
      { name: "description", content: "Cantá en guaraní al ritmo del arpa: seguí la letra, completá el verso y grabate." },
      { property: "og:title", content: "Purahéi Karaoke | Jaikuaa" },
      { property: "og:description", content: "Karaoke en guaraní con arpa paraguaya, versos para completar y grabación propia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Karaoke,
});

// Versos de práctica originales de Jaikuaa, PENDIENTES de validación docente.
// Cada palabra dura 1 tiempo; "gap" marca la palabra que el jugador completa.
type Line = { words: string[]; es: string; gap: number; wrong: string[] };
type Song = { id: string; title: string; style: string; bpm: number; chords: number[][]; lines: Line[] };
const SONGS: Song[] = [
  {
    id: "mbaeichapa", title: "Mba'éichapa, che irũ", style: "Polca alegre", bpm: 104,
    chords: [[196, 247, 294], [262, 330, 392], [294, 370, 440], [196, 247, 294]],
    lines: [
      { words: ["Mba'éichapa", "che", "irũ"], es: "¿Cómo estás, mi amigo?", gap: 2, wrong: ["róga", "mba'e"] },
      { words: ["Iporã", "ko", "ára"], es: "Lindo es este día", gap: 2, wrong: ["pyhare", "ka'aru"] },
      { words: ["Jajapo", "ñande", "tembiapo"], es: "Hagamos nuestro trabajo", gap: 1, wrong: ["che", "nde"] },
      { words: ["Aguyje", "ndéve", "che", "irũ"], es: "Gracias a vos, mi amigo", gap: 0, wrong: ["Mba'e", "Ko'ẽ"] },
    ],
  },
  {
    id: "koe", title: "Ko'ẽ porã", style: "Guarania suave", bpm: 76,
    chords: [[220, 262, 330], [175, 220, 262], [262, 330, 392], [196, 247, 294]],
    lines: [
      { words: ["Ko'ẽ", "porã", "che", "retã"], es: "Buen día, mi patria", gap: 3, wrong: ["róga", "sy"] },
      { words: ["Kuarahy", "ohesape"], es: "El sol ilumina", gap: 0, wrong: ["Jasy", "Y"] },
      { words: ["Ñe'ẽ", "porã", "ñañe'ẽ"], es: "Hablemos lindo", gap: 0, wrong: ["Ka'a", "Óga"] },
      { words: ["Guaraní", "che", "korasõ"], es: "Guaraní, mi corazón", gap: 2, wrong: ["akã", "po"] },
    ],
  },
  {
    id: "terere", title: "Tereré jahupy", style: "Galopa", bpm: 116,
    chords: [[262, 330, 392], [349, 440, 523], [392, 494, 587], [262, 330, 392]],
    lines: [
      { words: ["Ejú", "ejú", "che", "irũ"], es: "Vení, vení, mi amigo", gap: 0, wrong: ["Aha", "Eke"] },
      { words: ["Jaha", "jaykue", "yvyra", "guýpe"], es: "Vamos a sentarnos bajo el árbol", gap: 2, wrong: ["óga", "yvága"] },
      { words: ["Y", "ro'ysã", "ha", "pohã"], es: "Agua fresca y yuyos", gap: 1, wrong: ["haku", "porã"] },
      { words: ["Javy'a", "ñande", "aty"], es: "Alegres en nuestra reunión", gap: 0, wrong: ["Jahupy", "Japyta"] },
    ],
  },
];

class Arpa {
  ctx: AudioContext | null = null;
  pluck(freq: number, when = 0, vol = 0.07) {
    try {
      const a = this.ctx ?? (this.ctx = new AudioContext());
      void a.resume();
      const t = a.currentTime + when;
      const o = a.createOscillator(), g = a.createGain();
      o.type = "triangle"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + 1.2);
    } catch { /* audio opcional */ }
  }
  beat(chord: number[], beatSec: number) {
    chord.forEach((f, i) => this.pluck(f, i * beatSec * 0.16));
    this.pluck(chord[0] / 2, 0, 0.09);
    this.pluck(chord[2] * 2, beatSec * 0.5, 0.035);
  }
  stop() { void this.ctx?.close(); this.ctx = null; }
}

function Karaoke() {
  const [song, setSong] = useState<Song | null>(null);
  const [run, setRun] = useState(0);
  return (
    <GameShell title="Purahéi Karaoke" emoji="🎤" sponsorSlot="karaoke">
      <ValidationNotice />
      {!song ? (
        <div className="mt-5 space-y-3">
          <p className="text-center text-sm text-muted-foreground">Elegí una canción. La letra se ilumina al ritmo del arpa; cuando aparezca el hueco, ¡tocá la palabra justa a tiempo!</p>
          {SONGS.map((s) => (
            <button key={s.id} type="button" onClick={() => setSong(s)}
              className="flex w-full items-center gap-3 rounded-xl border-2 border-border bg-card p-4 text-left shadow-elegant transition active:scale-[.98] hover:border-primary">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Music /></span>
              <span className="flex-1"><b className="block font-display text-lg text-foreground">{s.title}</b><span className="text-xs text-muted-foreground">{s.style} · {s.bpm} pulsos/min</span></span>
              <Play className="text-accent" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-5"><Stage key={`${song.id}-${run}`} song={song} onAgain={() => setRun((r) => r + 1)} onBack={() => setSong(null)} /></div>
      )}
    </GameShell>
  );
}

function Stage({ song, onAgain, onBack }: { song: Song; onAgain: () => void; onBack: () => void }) {
  const feedback = useGameFeedback();
  const beatSec = 60 / song.bpm;
  const lead = 4; // cuenta regresiva
  const timeline = useMemo(() => {
    const t: { line: number; word: number }[] = [];
    song.lines.forEach((l, li) => { l.words.forEach((_, wi) => t.push({ line: li, word: wi })); t.push({ line: li, word: -1 }); });
    return t;
  }, [song]);
  const options = useMemo(() => song.lines.map((l) => shuffle([l.words[l.gap], ...l.wrong])), [song]);
  const [beat, setBeat] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<number, "perfect" | "good" | "miss">>({});
  const [combo, setCombo] = useState(0);
  const [pop, setPop] = useState<string | null>(null);
  const arpa = useRef(new Arpa());
  const total = lead + timeline.length;
  const done = beat >= total;

  useEffect(() => () => arpa.current.stop(), []);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setBeat((b) => b + 1), beatSec * 1000);
    return () => clearInterval(id);
  }, [playing, beatSec]);
  useEffect(() => {
    if (!playing || beat < 0) return;
    if (beat >= total) { setPlaying(false); return; }
    arpa.current.beat(song.chords[Math.floor(beat / 2) % song.chords.length], beatSec);
    // Si el hueco pasó sin respuesta, cuenta como fallo.
    const pos = timeline[beat - lead];
    if (pos && pos.word === -1 && answers[pos.line] === undefined) {
      setAnswers((a) => ({ ...a, [pos.line]: "miss" })); setCombo(0); feedback("error");
    }
  }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = beat >= lead ? timeline[beat - lead] : undefined;
  const lineIdx = cur?.line ?? (beat < lead ? 0 : song.lines.length - 1);
  const line = song.lines[Math.min(lineIdx, song.lines.length - 1)];
  const answerOpen = !!cur && answers[cur.line] === undefined;

  function answer(w: string) {
    if (!cur || !answerOpen) return;
    const l = song.lines[cur.line];
    if (w !== l.words[l.gap]) { setAnswers((a) => ({ ...a, [cur.line]: "miss" })); setCombo(0); feedback("error"); setPop("¡Uy!"); return; }
    const onTime = cur.word === l.gap || cur.word === l.gap - 1 || cur.word === l.gap + 1;
    const grade = onTime ? "perfect" : "good";
    setAnswers((a) => ({ ...a, [cur.line]: grade })); setCombo((c) => c + 1); feedback("success");
    setPop(grade === "perfect" ? "¡Iporãite! ✨" : "¡Porã!");
    setTimeout(() => setPop(null), 900);
  }

  const points = Object.values(answers).reduce((s, g) => s + (g === "perfect" ? 5 : g === "good" ? 3 : 0), 0);
  const xp = Math.min(20, points);
  const recorded = useRef(false);
  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true; feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "karaoke", xp });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (done) {
    const perfect = Object.values(answers).filter((g) => g === "perfect").length;
    return (
      <div className="space-y-4 text-center">
        <div className="text-5xl">🎶</div>
        <p className="font-display text-xl font-bold text-foreground">¡Cantaste «{song.title}»!</p>
        <p className="text-sm text-muted-foreground">{perfect} versos perfectos de {song.lines.length}</p>
        <XpNote xp={xp} />
        <Recorder song={song} />
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onAgain}>Cantar de nuevo</Button>
          <Button variant="outline" onClick={onBack}>Otra canción</Button>
          <ShareResult text={`¡Canté «${song.title}» en guaraní en Purahéi Karaoke de Jaikuaa! ${perfect}/${song.lines.length} versos perfectos 🎤`} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{song.style}</span>
        <span>Combo: <b className="text-accent">×{combo}</b> · Puntos: <b className="text-foreground">{points}</b></span>
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-center text-primary-foreground shadow-elegant">
        <div className="mb-3 flex justify-center gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => <span key={i} className={`h-2 w-2 rounded-full transition ${playing && beat % 4 === i ? "scale-150 bg-accent" : "bg-primary-foreground/30"}`} />)}
        </div>
        {!playing && beat < 0 ? (
          <p className="py-6 font-display text-xl">¿Listo para cantar?</p>
        ) : beat < lead ? (
          <p className="py-4 font-display text-6xl font-bold animate-in zoom-in" key={beat}>{lead - beat}</p>
        ) : (
          <>
            <p className="flex min-h-20 flex-wrap items-center justify-center gap-x-2 gap-y-1 font-display text-3xl font-bold leading-tight sm:text-4xl">
              {line.words.map((w, wi) => {
                const isGap = wi === line.gap;
                const res = answers[lineIdx];
                const active = cur?.line === lineIdx && cur.word === wi;
                const sung = cur?.line === lineIdx && (cur.word === -1 || cur.word > wi);
                const shown = isGap && res === undefined ? "____" : w;
                return (
                  <span key={wi} className={`rounded px-1 transition-all duration-150 ${active ? "scale-110 bg-accent text-accent-foreground" : sung ? "text-accent" : "opacity-80"} ${isGap && res === "miss" ? "line-through decoration-2" : ""}`}>{shown}</span>
                );
              })}
            </p>
            <p className="mt-2 text-sm italic opacity-75">{line.es}</p>
          </>
        )}
        {pop && <span className="absolute right-4 top-3 animate-in fade-in slide-in-from-bottom-3 font-bold text-accent">{pop}</span>}
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary-foreground/20"><div className="h-full bg-accent transition-all" style={{ width: `${Math.max(0, (beat / total) * 100)}%` }} /></div>
      </div>
      {beat >= lead && (
        <div className="grid grid-cols-3 gap-2">
          {options[lineIdx].map((w) => (
            <button key={w} type="button" disabled={!answerOpen} onClick={() => answer(w)}
              className="min-h-14 rounded-xl border-2 border-border bg-card px-2 font-display text-lg font-bold text-foreground transition active:scale-95 disabled:opacity-40 enabled:hover:border-accent">{w}</button>
          ))}
        </div>
      )}
      {!playing && beat < 0 && (
        <Button size="lg" className="h-14 w-full text-lg" onClick={() => { setBeat(0); setPlaying(true); arpa.current.beat(song.chords[0], beatSec); }}>
          <Play className="mr-2" /> ¡Ñapurahéi! (Cantemos)
        </Button>
      )}
      <p className="text-center text-xs text-muted-foreground">Tocá la palabra que falta justo cuando suena: más cerca del pulso, más puntos.</p>
    </div>
  );
}

function Recorder({ song }: { song: Song }) {
  const [state, setState] = useState<"idle" | "rec" | "ready" | "denied">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream); const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => { stream.getTracks().forEach((t) => t.stop()); setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType }))); setState("ready"); };
      r.start(); rec.current = r; setState("rec");
    } catch { setState("denied"); }
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-left">
      <p className="font-display font-bold text-foreground">🎙️ Grabate y escuchate</p>
      <p className="mb-3 text-xs text-muted-foreground">Leé la letra en voz alta. La grabación queda solo en tu celular.</p>
      <div className="mb-3 space-y-0.5 text-sm text-foreground">{song.lines.map((l, i) => <p key={i}>{l.words.join(" ")}</p>)}</div>
      {state === "rec" ? (
        <Button variant="destructive" onClick={() => rec.current?.stop()}><Square className="mr-2 h-4 w-4" /> Detener</Button>
      ) : (
        <Button variant="outline" onClick={start}><Mic className="mr-2 h-4 w-4" /> {state === "ready" ? "Grabar otra vez" : "Grabar mi voz"}</Button>
      )}
      {state === "denied" && <p className="mt-2 text-xs text-destructive">Necesitamos permiso del micrófono para grabar.</p>}
      {url && state === "ready" && <audio className="mt-3 w-full" controls src={url} />}
    </div>
  );
}
