export class StadiumSound {
 private context:AudioContext|null=null;
 muted=false;
 play(kind:'kick'|'hit'|'cheer'|'answer'){
  if(this.muted)return;
  try{
   const a=this.context??(this.context=new AudioContext());void a.resume();
   const duration=kind==='cheer'?1.2:kind==='kick'?.12:.2;
   const b=a.createBuffer(1,Math.ceil(a.sampleRate*duration),a.sampleRate),ch=b.getChannelData(0);
   for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*(1-i/ch.length);
   const source=a.createBufferSource(),filter=a.createBiquadFilter(),gain=a.createGain();source.buffer=b;filter.type='lowpass';filter.frequency.value=kind==='cheer'?2400:kind==='kick'?1500:500;gain.gain.value=kind==='cheer'?.12:.2;source.connect(filter).connect(gain).connect(a.destination);source.start();
   const osc=a.createOscillator(),g=a.createGain();osc.frequency.setValueAtTime(kind==='answer'?660:140,a.currentTime);osc.frequency.exponentialRampToValueAtTime(kind==='answer'?990:60,a.currentTime+.15);g.gain.setValueAtTime(.08,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.2);osc.connect(g).connect(a.destination);osc.start();osc.stop(a.currentTime+.21);
  }catch{/* Sound is optional on devices without Web Audio. */}
 }
 dispose(){void this.context?.close();this.context=null;}
}
