import jaiImg from "@/assets/jai-tradicional.png";
const jaiAsset = { url: jaiImg };
export type MascotMood = 'idle' | 'success' | 'error' | 'victory';
export function GameMascot({message,mood='idle'}:{message:string;mood?:MascotMood}){
 return <div className={`game-mascot game-mascot-${mood} flex items-center gap-3 py-2`} data-mood={mood}>
  <img src={jaiAsset.url} alt="Jai, el jaguarete" className="penalties-mascot h-20 w-20 shrink-0 object-contain" loading="lazy"/>
  <p className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground" aria-live="polite">{message}</p></div>;
}
