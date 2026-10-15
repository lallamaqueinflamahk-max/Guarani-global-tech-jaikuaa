import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Copy, Check, Delete, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/teclado")({
  head: () => ({
    meta: [
      { title: "Teclado Guaraní | Jaikuaa" },
      { name: "description", content: "Escribí en guaraní con vocales nasales, g̃ y puso en un toque, y mandalo por WhatsApp." },
      { property: "og:title", content: "Teclado Guaraní | Jaikuaa" },
      { property: "og:description", content: "Escribí & Mandá: el teclado guaraní de Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TecladoPage,
});

const NASALES = ["ã", "ẽ", "ĩ", "õ", "ũ", "ỹ", "g̃", "'"];
const DIGRAFOS = ["ch", "mb", "nd", "ng", "nt", "rr", "ñ"];
const ACENTOS = ["á", "é", "í", "ó", "ú", "ý"];

function TecladoPage() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  function insert(s: string) {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + s + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus({ preventScroll: true });
      el?.setSelectionRange(start + s.length, start + s.length);
    });
  }
  function backspace() {
    const el = ref.current;
    const pos = el?.selectionStart ?? text.length;
    if (pos === 0) return;
    const chars = Array.from(text.slice(0, pos).normalize("NFC"));
    // g̃ es dos códigos: borrar ambos juntos
    let cut = 1;
    if (chars.length >= 2 && chars[chars.length - 1] === "\u0303") cut = 2;
    const before = chars.slice(0, -cut).join("");
    setText(before + text.slice(pos));
    requestAnimationFrame(() => { el?.focus({ preventScroll: true }); el?.setSelectionRange(before.length, before.length); });
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* sin permiso */ }
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;

  const Key = ({ k, wide }: { k: string; wide?: boolean }) => (
    <Button type="button" variant="outline" onPointerDown={(e) => e.preventDefault()} onClick={() => insert(k)}
      className={`h-12 text-lg font-bold ${wide ? "col-span-2" : ""}`}>{k}</Button>
  );

  return (
    <main className="mx-auto max-w-xl px-4 py-6 pb-28">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Volver</Link>
      <h1 className="font-display text-2xl font-bold text-foreground">⌨️ Teclado Guaraní</h1>
      <p className="mt-1 text-sm text-muted-foreground">Escribí con tu teclado de siempre y usá estas teclas para las letras del Achegety. Después copiá o mandá por WhatsApp.</p>

      <Textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} rows={5}
        placeholder="Mba'éichapa…" className="mt-4 text-lg" aria-label="Texto en guaraní" />

      <section className="mt-4 space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nasales y puso</p>
          <div className="grid grid-cols-4 gap-2">{NASALES.map((k) => <Key key={k} k={k} />)}</div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dígrafos</p>
          <div className="grid grid-cols-4 gap-2">{DIGRAFOS.map((k) => <Key key={k} k={k} />)}</div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acento (palabras llanas)</p>
          <div className="grid grid-cols-6 gap-2">{ACENTOS.map((k) => <Key key={k} k={k} />)}</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button type="button" variant="outline" className="col-span-3 h-12" onPointerDown={(e) => e.preventDefault()} onClick={() => insert(" ")}>espacio</Button>
          <Button type="button" variant="outline" className="h-12" onPointerDown={(e) => e.preventDefault()} onClick={backspace} aria-label="Borrar"><Delete /></Button>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => void copy()} disabled={!text}>{copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}</Button>
        <Button asChild disabled={!text}>
          <a href={text ? wa : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!text}><Send /> WhatsApp</a>
        </Button>
      </div>
    </main>
  );
}
