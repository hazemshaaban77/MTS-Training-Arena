import type {ArenaCue} from './arena-cinematics';

export type ArenaAudioPreferences={enabled:boolean;volume:number;music:boolean;effects:boolean;muted:boolean};
export const defaultArenaAudio: ArenaAudioPreferences={enabled:false,volume:.55,music:true,effects:true,muted:false};
export function readArenaAudio():ArenaAudioPreferences{
 if(typeof window==='undefined')return defaultArenaAudio;
 try{
  const parsed=JSON.parse(localStorage.getItem('arena-audio-v2')||'{}');
  return {...defaultArenaAudio,...parsed,enabled:false,volume:Math.min(1,Math.max(0,Number(parsed.volume??.55)))};
 }catch{return defaultArenaAudio;}
}
export function saveArenaAudio(prefs:ArenaAudioPreferences){
 try{localStorage.setItem('arena-audio-v2',JSON.stringify({...prefs,enabled:false}));}catch{}
}

const musical=new Set<ArenaCue>(['intro','stage','victory','level']);
type Note={frequency:number;offset:number;duration:number;volume?:number;shape?:OscillatorType};
const patterns:Record<ArenaCue,Note[]>={
 intro:[{frequency:196,offset:0,duration:.4,volume:.12,shape:'sawtooth'},
  {frequency:293.7,offset:.26,duration:.25,volume:.14},{frequency:392,offset:.55,duration:.35,volume:.18},
  {frequency:493.9,offset:.91,duration:.34,volume:.18},{frequency:587.3,offset:1.27,duration:.5,volume:.2},
  {frequency:784,offset:1.83,duration:.83,volume:.24}],
 stage:[{frequency:220,offset:0,duration:.22,volume:.13,shape:'triangle'},
  {frequency:440,offset:.12,duration:.22,volume:.16},{frequency:660,offset:.27,duration:.38,volume:.17}],
 lock:[{frequency:330,offset:0,duration:.06,volume:.11,shape:'triangle'},
  {frequency:262,offset:.065,duration:.13,volume:.17,shape:'square'}],
 reveal:[{frequency:392,offset:0,duration:.12,volume:.10},{frequency:493,offset:.14,duration:.14,volume:.11},
  {frequency:659,offset:.31,duration:.32,volume:.19}],
 correct:[{frequency:523,offset:0,duration:.13,volume:.16},{frequency:659,offset:.14,duration:.14,volume:.17},
  {frequency:784,offset:.28,duration:.25,volume:.19}],
 incorrect:[{frequency:261,offset:0,duration:.24,volume:.10,shape:'triangle'},
  {frequency:196,offset:.19,duration:.3,volume:.11,shape:'triangle'}],
 tick:[{frequency:880,offset:0,duration:.1,volume:.095,shape:'sine'}],
 countdown:[{frequency:1047,offset:0,duration:.11,volume:.13,shape:'sine'}],
 overtime:[{frequency:392,offset:0,duration:.12,volume:.1},{frequency:330,offset:.14,duration:.27,volume:.11}],
 lead:[{frequency:440,offset:0,duration:.18,volume:.12},{frequency:554.4,offset:.16,duration:.18,volume:.13},
  {frequency:880,offset:.33,duration:.46,volume:.16}],
 victory:[{frequency:392,offset:0,duration:.25,volume:.15},{frequency:523,offset:.26,duration:.27,volume:.16},
  {frequency:659,offset:.51,duration:.28,volume:.18},{frequency:784,offset:.79,duration:.35,volume:.21},
  {frequency:1047,offset:1.17,duration:.65,volume:.22},
  {frequency:1568,offset:1.75,duration:.8,volume:.12}],
 wheel:[{frequency:523,offset:0,duration:.07,volume:.1,shape:'square'},
  {frequency:659,offset:.12,duration:.07,volume:.12,shape:'square'},{frequency:784,offset:.24,duration:.13,volume:.13}],
 mystery:[{frequency:220,offset:0,duration:.18,volume:.10,shape:'triangle'},
  {frequency:293.7,offset:.21,duration:.16,volume:.10},{frequency:440,offset:.4,duration:.4,volume:.15}],
 level:[{frequency:392,offset:0,duration:.13,volume:.12},{frequency:587,offset:.16,duration:.15,volume:.15},
  {frequency:784,offset:.37,duration:.28,volume:.2}],
};

export class ArenaSoundEngine{
 private ctx:AudioContext|null=null;
 private limiter:DynamicsCompressorNode|null=null;
 private noiseBuffer:AudioBuffer|null=null;
 private master:GainNode|null=null;
 private unlocked=false;
 private prefs:ArenaAudioPreferences={...defaultArenaAudio};
 private lastPlayed:Partial<Record<ArenaCue,number>>={};
 update(prefs:ArenaAudioPreferences){
  this.prefs={...prefs,volume:Math.min(1,Math.max(0,prefs.volume))};
  if(this.master)this.master.gain.value=this.prefs.volume*.58;
 }
 async unlock():Promise<boolean>{
  try{
   if(!this.ctx){
    this.ctx=new AudioContext();
    this.limiter=this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value=-18;this.limiter.knee.value=15;
    this.limiter.ratio.value=7;this.limiter.attack.value=.002;this.limiter.release.value=.17;
    this.master=this.ctx.createGain();
    this.master.connect(this.limiter);this.limiter.connect(this.ctx.destination);
    // Tiny synthesized noise bed, not an external media asset: no network,
    // licensing or first-play download delay.
    this.noiseBuffer=this.ctx.createBuffer(1,Math.floor(this.ctx.sampleRate*.65),this.ctx.sampleRate);
    const samples=this.noiseBuffer.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
   }
   await this.ctx.resume();
   this.unlocked=this.ctx.state==='running';
   this.update(this.prefs);
   return this.unlocked;
  }catch{return false;}
 }
 play(cue:ArenaCue,options:{quiet?:boolean;light?:boolean}={}):void{
  const p=this.prefs;
  if(!p.enabled||p.muted||options.quiet||!this.ctx||!this.master||!this.unlocked||this.ctx.state!=='running')return;
  if(musical.has(cue)?!p.music:!p.effects)return;
  const now=performance.now();
  if(now-(this.lastPlayed[cue]||0)<(cue==='tick'||cue==='countdown'?650:200))return;
  this.lastPlayed[cue]=now;
  const ctx=this.ctx,base=ctx.currentTime+.01;
  const notes=options.light?patterns[cue].slice(0,Math.min(3,patterns[cue].length)):patterns[cue];
  try{
   if(p.effects&&this.noiseBuffer&&['intro','stage','reveal','wheel','mystery','victory','correct','lead'].includes(cue)){
    const swish=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    swish.buffer=this.noiseBuffer;filter.type='bandpass';
    const start=base,peak=base+(cue==='wheel'?.13:.045),end=base+(cue==='intro'?.55:.23);
    filter.frequency.setValueAtTime(cue==='mystery'?280:1250,start);
    filter.frequency.exponentialRampToValueAtTime(cue==='mystery'?1100:3800,end);
    filter.Q.value=.7;
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(options.light?.018:.055,peak);
    gain.gain.exponentialRampToValueAtTime(.0001,end);
    swish.connect(filter);filter.connect(gain);gain.connect(this.master!);
    swish.start(start);swish.stop(end+.01);
    swish.onended=()=>{try{swish.disconnect();filter.disconnect();gain.disconnect();}catch{}};
   }
   notes.forEach(note=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    const start=base+note.offset,finish=start+note.duration;
    osc.type=note.shape||'sine';osc.frequency.setValueAtTime(note.frequency,start);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,note.volume||.12),start+Math.min(.027,note.duration/4));
    gain.gain.exponentialRampToValueAtTime(.0001,finish);
    osc.connect(gain);gain.connect(this.master!);osc.start(start);osc.stop(finish+.035);
    osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch{}};
   });
  }catch{}
 }
 close(){
  this.unlocked=false;
  if(this.ctx){void this.ctx.close().catch(()=>{});this.ctx=null;}
  this.limiter=null;this.master=null;this.noiseBuffer=null;
 }
}
