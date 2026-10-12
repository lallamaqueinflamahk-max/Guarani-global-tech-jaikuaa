export function PenaltyMascot({message}:{message:string}){
 return <div className="flex items-center gap-3 py-2"><svg viewBox="0 0 132 92" className="penalties-mascot h-20 w-24 shrink-0" aria-label="Mascota tatú" role="img">
 <path d="M24 60 Q8 62 5 76" fill="none" stroke="var(--stadium-shell-dark)" strokeWidth="5" strokeLinecap="round"/>
 <g fill="var(--stadium-shell-dark)">{[32,50,70,87].map(x=><rect key={x} x={x} y="62" width="9" height="15" rx="4"/>)}</g>
 <path d="M18 64 Q20 18 60 16 Q100 18 102 64 Z" fill="var(--stadium-shell)"/>
 <g fill="none" stroke="var(--stadium-shell-dark)" strokeWidth="3">{[40,52,65,78].map(x=><path key={x} d={`M${x} 21 Q${x-4} 42 ${x} 64`}/>)}</g>
 <ellipse cx="60" cy="64" rx="43" ry="7" fill="var(--stadium-shell-light)"/><ellipse cx="99" cy="44" rx="4.5" ry="8" fill="var(--stadium-shell-dark)"/><ellipse cx="106" cy="57" rx="15" ry="12" fill="var(--stadium-shell)"/><path d="M114 51 Q130 56 114 64 Z" fill="var(--stadium-shell)"/><circle cx="127" cy="57" r="2.6" fill="var(--stadium-kit-dark)"/><circle cx="108" cy="53" r="3" fill="var(--stadium-kit-dark)"/><circle cx="109" cy="52" r="1" fill="var(--stadium-white)"/><circle cx="110" cy="61" r="3.2" fill="var(--stadium-cheek)"/><path d="M115 62 Q119 65 123 62" fill="none" stroke="var(--stadium-kit-dark)" strokeWidth="1.6"/>
 </svg><p className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground" aria-live="polite">{message}</p></div>;
}
