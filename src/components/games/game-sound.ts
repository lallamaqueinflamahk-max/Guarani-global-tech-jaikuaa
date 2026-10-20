export class StadiumSound {
 private context:AudioContext|null=null;
 muted=false;
 play(kind:'kick'|'hit'|'cheer'|'answer'|'success'|'error'|'victory'|'post'){
  if(this.muted)return;
  try{
   const a=this.context??(this.context=new AudioContext());void a.resume();
   if(kind==='post'){[1240,1860,2730].forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.08/(i+1),a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.9);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.9);});return;}
   if(kind==='success'||kind==='error'||kind==='victory'){
    const notes=kind==='error'?[220,165]:kind==='victory'?[523,659,784,1047]:[660,880];
    notes.forEach((frequency,i)=>{const osc=a.createOscillator(),gain=a.createGain(),t=a.currentTime+i*.12;osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.09,t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+.18);osc.connect(gain).connect(a.destination);osc.start(t);osc.stop(t+.2);});return;
   }
   const duration=kind==='cheer'?1.2:kind==='kick'?.12:.2;
   const b=a.createBuffer(1,Math.ceil(a.sampleRate*duration),a.sampleRate),ch=b.getChannelData(0);
   for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*(1-i/ch.length);
   const source=a.createBufferSource(),filter=a.createBiquadFilter(),gain=a.createGain();source.buffer=b;filter.type='lowpass';filter.frequency.value=kind==='cheer'?2400:kind==='kick'?1500:500;gain.gain.value=kind==='cheer'?.12:.2;source.connect(filter).connect(gain).connect(a.destination);source.start();
   const osc=a.createOscillator(),g=a.createGain();osc.frequency.setValueAtTime(kind==='answer'?660:140,a.currentTime);osc.frequency.exponentialRampToValueAtTime(kind==='answer'?990:60,a.currentTime+.15);g.gain.setValueAtTime(.08,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.2);osc.connect(g).connect(a.destination);osc.start();osc.stop(a.currentTime+.21);
  }catch{/* Sound is optional on devices without Web Audio. */}
 }
 dispose(){void this.context?.close();this.context=null;}
}
