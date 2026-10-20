import { Button } from "@/components/ui/button";

const CHARS = ["ã", "ẽ", "ĩ", "õ", "ũ", "ỹ", "g̃", "ñ", "'"];

/** Inserta el carácter en la casilla (input/textarea) que tiene el foco y avisa a React del cambio. */
function insertIntoFocused(ch: string) {
  const el = document.activeElement;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  if (el instanceof HTMLInputElement && !["text", "search", ""].includes(el.type)) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + ch + el.value.slice(end);
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, next);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  const pos = start + ch.length;
  requestAnimationFrame(() => el.setSelectionRange(pos, pos));
}

/** Botonera fija con las letras del alfabeto oficial que faltan en el teclado común. */
export function GuaraniCharBar() {
  return (
    <div className="sticky top-2 z-20 mb-4 rounded-lg border bg-card/95 p-2 shadow-sm backdrop-blur">
      <p className="mb-1 text-xs text-muted-foreground">Tocá una casilla y después la letra:</p>
      <div className="flex flex-wrap gap-1">
        {CHARS.map((c) => (
          <Button key={c} type="button" size="sm" variant="outline" className="h-9 min-w-9 text-base font-bold"
            onPointerDown={(e) => e.preventDefault()} onClick={() => insertIntoFocused(c)} aria-label={`Insertar ${c}`}>
            {c}
          </Button>
        ))}
      </div>
    </div>
  );
}
