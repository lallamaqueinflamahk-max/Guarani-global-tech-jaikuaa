// Iconos paraguayos propios (SVG): se ven idénticos en cualquier teléfono.
type P = { size?: number; className?: string; title?: string };

const wrap = (size: number, className: string | undefined, title: string | undefined, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
    {children}
  </svg>
);

/** Huellita de Jai (jaguarete) — logros y rachas */
export function JaiPaw({ size = 20, className, title }: P) {
  return wrap(size, className, title, <g fill="hsl(var(--gold, 42 90% 50%))" stroke="var(--primary)" strokeWidth="0.6">
    <ellipse cx="12" cy="16" rx="5" ry="4.2" />
    <ellipse cx="5.6" cy="10.4" rx="1.9" ry="2.4" />
    <ellipse cx="9.5" cy="6.6" rx="1.9" ry="2.5" />
    <ellipse cx="14.5" cy="6.6" rx="1.9" ry="2.5" />
    <ellipse cx="18.4" cy="10.4" rx="1.9" ry="2.4" />
  </g>);
}

/** Guampa con bombilla y termo de tereré */
export function Terere({ size = 20, className, title }: P) {
  return wrap(size, className, title, <g strokeLinejoin="round">
    <rect x="13.5" y="4" width="6" height="16" rx="1.6" fill="var(--secondary)" />
    <rect x="13.5" y="7" width="6" height="1.4" fill="var(--background)" />
    <path d="M4 10h7l-.8 9.2a1.4 1.4 0 0 1-1.4 1.3H6.2a1.4 1.4 0 0 1-1.4-1.3Z" fill="#8a5a2b" />
    <path d="M4.4 12.5h6.2" stroke="#d9b98a" strokeWidth="1" />
    <path d="M9.5 10 11.5 3" stroke="#c0c0c0" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M5 10c1-1.4 4-1.4 5 0" fill="#4f8a3a" />
  </g>);
}

/** Chipa tradicional (anillo) */
export function Chipa({ size = 20, className, title }: P) {
  return wrap(size, className, title, <g>
    <circle cx="12" cy="12" r="9" fill="#e6b35a" />
    <circle cx="12" cy="12" r="3.4" fill="var(--background)" />
    <path d="M6 9.5c.8-.6 1.6-.6 2.3 0M15.5 7.2c.7-.5 1.4-.4 2 .2M16.6 15c.6.5.8 1.1.6 1.8M8 16.8c.7.2 1.3.1 1.8-.4" stroke="#b97b2a" strokeWidth="1" fill="none" strokeLinecap="round" />
  </g>);
}

/** Arpa paraguaya */
export function Arpa({ size = 20, className, title }: P) {
  return wrap(size, className, title, <g fill="none" strokeLinecap="round">
    <path d="M6 21V4c5 0 9 3 12 8" stroke="#8a5a2b" strokeWidth="1.8" />
    <path d="M6 21h10l2-9" stroke="#8a5a2b" strokeWidth="1.8" strokeLinejoin="round" />
    {[8.5, 11, 13.5].map((x, i) => <path key={i} d={`M${x} ${5 + i * 1.6}V21`} stroke="var(--muted-foreground)" strokeWidth="0.7" />)}
  </g>);
}

/** Guarda de ao po'i — separador fino */
export function AoPoiDivider({ className }: { className?: string }) {
  return (
    <svg className={className} width="100%" height="8" aria-hidden preserveAspectRatio="none">
      <defs>
        <pattern id="aopoi" width="16" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 4h4l4-3 4 3h4M8 7v-1" stroke="var(--secondary)" strokeWidth="1" fill="none" />
          <circle cx="8" cy="4" r="0.9" fill="var(--primary)" />
        </pattern>
      </defs>
      <rect width="100%" height="8" fill="url(#aopoi)" opacity="0.55" />
    </svg>
  );
}
