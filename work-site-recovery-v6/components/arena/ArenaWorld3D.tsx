'use client';
/**
 * Arena Cinema 3D: authentic WebGL stage geometry shared across all ten games.
 * Decorative only; all answer content, scoring, QR/session state remain HTML/Worker.
 * Blackout -> light ignition -> camera fly-in is an opt-in non-blocking visual.
 */
import {useEffect,useRef,useState} from 'react';
import './ArenaWorld3D.css';
import {ARENA_CINEMA_B,sectorCorporateColor,visibleWheelLabel} from '../../lib/arena-wheel-theme';
type WheelIntroSector={label?:string;kind?:string};
type Props={kind?:string;mode?:'intro'|'ambient';light?:boolean;ar?:boolean;sectors?:WheelIntroSector[]};
const KIND:Record<string,string>={
 'Spin Wheel':'wheel','Wheel of Fortune':'wheel','Ultimate Game Show':'championship',
 'Quiz':'quiz','Escape Room':'escape','Open the Box':'box','Live Poll':'poll',
 'Meta Plan':'plan','Categorize':'plan','Order It':'order','Flashcards':'cards',
 'Scenario Challenge':'scenario','lobby':'lobby'
};
const COLOR:Record<string,number>={wheel:0xf2ab48,championship:0xffd278,quiz:0x47c8ff,escape:0x23dcb4,box:0xe2ab55,poll:0x6abaff,plan:0x4ff0ce,order:0xc694ff,cards:0xffc57b,scenario:0xe79673,lobby:0x49bdeb};
export default function ArenaWorld3D({kind='lobby',mode='ambient',light=false,ar=true,sectors=[]}:Props){
 const mount=useRef<HTMLDivElement>(null);
 const [unavailable,setUnavailable]=useState(false);
 const key=KIND[kind]||'lobby';
 const introSectorsKey=key==='wheel'&&mode==='intro'?JSON.stringify(sectors.map(s=>[s.label,s.kind])):'';
 useEffect(()=>{
  if(light||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches){/* Use geometry without forced camera animation. */}
  const root=mount.current;
  if(!root)return;
  let disposed=false,raf=0,renderer:any,contextLost=(e:Event)=>{e.preventDefault();setUnavailable(true);};
  const assets:Array<{dispose:()=>void}>=[];
  const slow=!!window.matchMedia?.('(pointer: coarse)')?.matches;
  const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const begin=performance.now();
  const authoredSectors:WheelIntroSector[]=key==='wheel'&&mode==='intro'&&sectors.length>=2&&sectors.length<=20?sectors:Array.from({length:8},(_,i)=>({label:String(i+1),kind:'question'}));
  const build=async()=>{
   try{
    if(key==='wheel')await document.fonts?.load('800 48px Cairo','المعلومات').catch(()=>[]);
    const T=await import('three');
    if(disposed)return;
    renderer=new T.WebGLRenderer({alpha:true,antialias:!slow,powerPreference:slow?'low-power':'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,slow?1.1:1.65));
    renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.toneMapping=T.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.45;
    const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');
    root.appendChild(canvas);canvas.addEventListener('webglcontextlost',contextLost,false);
    const scene=new T.Scene();
    const camera=new T.PerspectiveCamera(36,1,.1,100);
    const group=new T.Group();group.position.y=.1;scene.add(group);
    const gold=new T.MeshStandardMaterial({color:key==='wheel'?ARENA_CINEMA_B.chrome:0xd6a44e,metalness:.78,roughness:.2});
    const noir=new T.MeshStandardMaterial({color:0x071728,metalness:.65,roughness:.26});
    const teal=new T.MeshStandardMaterial({color:key==='wheel'?0x078a67:0x07829d,metalness:.46,roughness:.27,emissive:0x07566d,emissiveIntensity:.38});
    const accent=new T.MeshStandardMaterial({color:key==='wheel'?ARENA_CINEMA_B.blue:COLOR[key],metalness:.52,roughness:.22,emissive:key==='wheel'?ARENA_CINEMA_B.green:COLOR[key],emissiveIntensity:.19});
    const glass=new T.MeshPhysicalMaterial({color:COLOR[key],metalness:.12,roughness:.16,transmission:.16,transparent:true,opacity:.86,depthWrite:true});
    const halo=new T.MeshBasicMaterial({color:key==='wheel'?ARENA_CINEMA_B.brightGreen:COLOR[key],transparent:true,opacity:.48});
    assets.push(gold,noir,teal,accent,glass,halo);
    const put=(geo:any,mat:any,parent:any=group,x=0,y=0,z=0)=>{
      const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);assets.push(geo);return m;
    };
    const ring=(r:number,t:number,z:number,mat:any,parent:any=group)=>{
      return put(new T.TorusGeometry(r,t,10,96),mat,parent,0,0,z);
    };
    // Stage, concentric LED runways and overhead crown arcs are true 3D.
    const floor=put(new T.CylinderGeometry(4.45,4.7,.19,80),noir,group,0,-2.35,-1.3);
    const goldBase=put(new T.TorusGeometry(4.24,.045,12,100),gold,group,0,-2.22,-1.3);goldBase.rotation.x=Math.PI/2;
    const ledBase=put(new T.TorusGeometry(3.76,.042,12,100),halo,group,0,-2.19,-1.3);ledBase.rotation.x=Math.PI/2;
    for(let i=0;i<7;i++){
      const a=(i/6-.5)*Math.PI*1.16;
      const x=Math.sin(a)*4.7,z=-2.4-Math.cos(a)*1.05;
      const pillar=put(new T.BoxGeometry(.23,4.0,.35),noir,group,x,-.27,z);
      pillar.rotation.y=-a;
      put(new T.BoxGeometry(.055,3.2,.09),i%2?teal:accent,group,x,-.18,z+.18);
    }
    const arch=put(new T.TorusGeometry(4.25,.085,10,90,Math.PI*1.28),gold,group,0,.84,-3.4);
    arch.rotation.z=-.12;
    const luminous=put(new T.TorusGeometry(4.18,.023,9,90,Math.PI*1.28),halo,group,0,.84,-3.24);
    luminous.rotation.z=-.12;
    // Motifs distinguish ten game identities; no answers/players copied into WebGL.
    const actor=new T.Group();group.add(actor);actor.position.y=.1;
    if(key==='wheel'){
      // Entrance B: same REAL authored sectors as gameplay, not hardcoded demo labels.
      const n=authoredSectors.length,step=Math.PI*2/n;
      const backing=put(new T.CylinderGeometry(2.03,2.03,.43,80),noir,actor,0,.10,0);
      backing.rotation.x=Math.PI/2;
      for(let i=0;i<n;i++){
        const shape=new T.Shape();shape.moveTo(0,0);
        for(let j=0;j<=10;j++){
          const a=Math.PI/2-(i-.5)*step-j*step/10;
          shape.lineTo(Math.cos(a)*1.88,Math.sin(a)*1.88);
        }
        shape.closePath();
        const color=sectorCorporateColor(authoredSectors[i].kind,i);
        const mat=new T.MeshStandardMaterial({color,metalness:.4,roughness:.28,side:T.DoubleSide});
        assets.push(mat);
        put(new T.ExtrudeGeometry(shape,{depth:.17,bevelEnabled:true,bevelThickness:.013,bevelSize:.014,bevelSegments:2}),mat,actor,0,.1,.19);
        const face=document.createElement('canvas');face.width=256;face.height=144;
        const ctx=face.getContext('2d');
        if(ctx){
          ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction=ar?'rtl':'ltr';
          ctx.fillStyle=color===0xf3f8ff||color===0xf1f6ff?'#053260':'#f9fcff';
          ctx.font='800 39px Cairo,Arial,sans-serif';
          const label=visibleWheelLabel(authoredSectors[i],i,n);
          const short=n>8?String(i+1).padStart(2,'0'):label.length>12?label.slice(0,11)+'…':label;
          ctx.fillText(short,128,72,230);
          const texture=new T.CanvasTexture(face);texture.colorSpace=T.SRGBColorSpace;
          const spriteMaterial=new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false});
          const sprite=new T.Sprite(spriteMaterial),mid=Math.PI/2-i*step;
          sprite.position.set(Math.cos(mid)*1.41,Math.sin(mid)*1.41+.1,.43);
          sprite.scale.set(n>10?.68:n>6?.88:1.14,n>10?.38:.53,1);
          actor.add(sprite);assets.push(texture,spriteMaterial);
        }
      }
      ring(2.06,.11,.32,gold,actor);
      ring(1.88,.029,.4,glass,actor);
      ring(2.19,.042,.06,halo,actor);
      const hub=put(new T.CylinderGeometry(.44,.44,.3,48),gold,actor,0,.1,.46);hub.rotation.x=Math.PI/2;
      const disk=put(new T.CylinderGeometry(.32,.32,.07,48),teal,actor,0,.1,.66);disk.rotation.x=Math.PI/2;
      const pointer=put(new T.ConeGeometry(.22,.52,4),gold,group,0,2.43,.72);
      pointer.rotation.z=Math.PI;
      put(new T.CylinderGeometry(.13,.24,1.0,12),gold,actor,0,-2.15,-.45);
    }else if(key==='box'){
      for(let i=0;i<3;i++){
        const x=(i-1)*1.8;
        const chest=put(new T.BoxGeometry(1.27,1.07,1.17),i===1?teal:noir,actor,x,-.48,.1);
        const band=put(new T.BoxGeometry(1.34,.17,1.26),gold,actor,x,-.49,.1);
        const lid=put(new T.BoxGeometry(1.38,.29,1.25),gold,actor,x,.12,-.12);
        lid.userData.openLid=i===1;
        put(new T.BoxGeometry(.28,.32,.09),accent,actor,x,-.3,.76);
      }
    }else if(key==='escape'){
      const wall=put(new T.BoxGeometry(3.6,4.05,.45),noir,actor,0,-.10,-.12);
      for(const x of [-1.60,1.60])put(new T.BoxGeometry(.18,4.1,.6),gold,actor,x,-.10,.12);
      put(new T.BoxGeometry(3.2,.2,.6),gold,actor,0,1.9,.15);
      put(new T.BoxGeometry(2.8,3.6,.18),teal,actor,0,-.23,.18).userData.door=true;
      put(new T.TorusGeometry(.48,.09,12,44),gold,actor,.91,-.43,.35);
    }else if(key==='championship'){
      for(let i=0;i<5;i++){
        const height=.38+i*.47;
        put(new T.BoxGeometry(.78,height,.9),i===4?gold:i%2?teal:noir,actor,(i-2)*.86,-1.59+height/2,.35);
        put(new T.TorusGeometry(.4,.045,8,32),i===4?accent:gold,actor,(i-2)*.86,-1.48+height,.37);
      }
      const crown=put(new T.ConeGeometry(.6,.95,5),accent,actor,0,2.08,.22);
      crown.rotation.z=Math.PI;
    }else if(key==='poll'){
      for(let i=0;i<6;i++){const height=.6+((i*3+2)%6)*.38;
        put(new T.BoxGeometry(.48,height,.65),i%2?teal:accent,actor,(i-2.5)*.73,-1.3+height/2,.05);
      }
    }else if(key==='cards'){
      for(let i=0;i<4;i++){const m=put(new T.BoxGeometry(1.65,2.25,.1),i===0?accent:i%2?teal:gold,actor,(i-1.5)*.35,.2+i*.12,-.25-i*.26);m.rotation.y=(i-1.5)*.19;m.rotation.z=(i-1.5)*.08;}
    }else if(key==='order'){
      for(let i=0;i<5;i++){const m=put(new T.BoxGeometry(.9,.72,.46),i%2?accent:teal,actor,(i-2)*1.08,Math.sin(i*1.9)*.55,.32);m.rotation.z=i%2?.12:-.12;}
    }else if(key==='plan'){
      for(let i=0;i<7;i++){
        const x=(i%4-1.5)*1.18,y=Math.floor(i/4)*-1.35+.9;
        const note=put(new T.BoxGeometry(.89,.88,.075),i%2?accent:teal,actor,x,y,.12);
        note.rotation.z=(i%3-1)*.15;
      }
    }else if(key==='scenario'){
      for(let i=0;i<5;i++){const x=(i-2)*1.05,y=1.25-Math.abs(i-2)*.65;
        const tile=put(new T.OctahedronGeometry(.59,0),i===2?accent:teal,actor,x,y,.18);
        tile.rotation.y=i*.21;
      }
    }else if(key==='quiz'){
      for(let i=0;i<4;i++){
        const x=(i-1.5)*1.32,y=Math.cos(i*.7)*.27;
        const tile=put(new T.BoxGeometry(1.13,1.13,.23),i%2?teal:accent,actor,x,y,.18);
        tile.rotation.z=i%2?-.1:.10;
      }
      const core=put(new T.IcosahedronGeometry(.69,1),gold,actor,0,1.62,.32);
    }else{
      for(let i=0;i<3;i++){
        const ringMesh=ring(1.38+i*.52,.058,-.3-i*.14,i%2?teal:gold,actor);
        ringMesh.rotation.y=.2*i;
      }
      put(new T.IcosahedronGeometry(.72,1),accent,actor,0,.0,.35);
    }
    const hemi=new T.HemisphereLight(0x9ddefc,0x090d1f,.5);
    scene.add(hemi);
    const keySpot=new T.SpotLight(key==='wheel'?0xf4fcff:0xffd9a1,0,22,Math.PI/4,.56,1.7);
    keySpot.position.set(-3.2,5.3,5.9);scene.add(keySpot);
    const cyan=new T.SpotLight(0x39c9ff,0,24,Math.PI/4,.65,1.6);
    cyan.position.set(3.6,4.1,3.6);scene.add(cyan);
    const goldFill=new T.PointLight(key==='wheel'?0x35e18b:COLOR[key],0,22);
    goldFill.position.set(.1,-1,4.0);scene.add(goldFill);
    // Physical volumetric-looking cones (geometry), dark-to-light timed with stage.
    for(const [x,material] of [[-2.0,halo],[2.0,halo]] as const){
      const beam=put(new T.ConeGeometry(1.36,6.0,28,1,true),material,scene,x,1.1,-2.1);
      beam.rotation.z=x<0?-.39:.39;beam.userData.isBeam=true;
    }
    let w=0,h=0,lastFrame=performance.now(),tick=0;
    const resize=()=>{
      const nw=Math.max(1,root.clientWidth),nh=Math.max(1,root.clientHeight);
      if(nw===w&&nh===h)return;
      w=nw;h=nh;renderer.setSize(w,h,false);
      camera.aspect=w/h;camera.fov=w<500?43:36;camera.updateProjectionMatrix();
    };
    const draw=(frame:number)=>{
      if(disposed)return;
      raf=requestAnimationFrame(draw);
      if(document.hidden)return;
      if(slow&&++tick%2!==0)return;
      const dt=Math.min(.06,Math.max(0,(frame-lastFrame)*.001));lastFrame=frame;
      const elapsed=(frame-begin)*.001;
      // Real 3D light cue: blackout -> individual practical spotlights -> full reveal.
      const reveal=mode==='intro'&&!reduced?Math.max(0,Math.min(1,(elapsed-.38)/1.6)):1;
      const burst=mode==='intro'&&!reduced&&elapsed>1.55&&elapsed<2.1?1.45:1;
      keySpot.intensity=(light?19:100)*reveal*burst;
      cyan.intensity=(light?13:80)*reveal*burst;
      goldFill.intensity=(light?8:45)*reveal;
      hemi.intensity=.26+reveal*(light?1.0:1.9);
      if(!reduced){
        actor.rotation.y=Math.sin(frame*.00045)*.095;
        actor.rotation.z=Math.sin(frame*.00026)*.018;
        for(const item of actor.children){if(item.userData.openLid)item.rotation.x=-.55*Math.max(0,Math.min(1,(elapsed-1.15)/.9));}
      }
      const cameraProgress=mode==='intro'&&!reduced?Math.max(0,Math.min(1,elapsed/2.6)):1;
      const eased=1-Math.pow(1-cameraProgress,3);
      camera.position.set(2.9*(1-eased),1.0*(1-eased)+.1, (light?12.8:9.6)+3.4*(1-eased));
      camera.lookAt(0,-.08,-.05);
      resize();renderer.render(scene,camera);
    };
    resize();raf=requestAnimationFrame(draw);
   }catch(err){
    if(!disposed){console.warn('Arena cinema requires WebGL; accessible content remains available.',err);setUnavailable(true);}
   }
  };
  void build();
  return ()=>{disposed=true;cancelAnimationFrame(raf);if(renderer){renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.dispose();renderer.domElement.remove();}
    for(const a of assets)try{a.dispose();}catch{/* best effort */}
  };
 },[key,mode,light,ar,introSectorsKey]);
 return <div className={'arena-world3d arena-world3d--'+mode+(unavailable?' arena-world3d--unavailable':'')} aria-hidden="true">
   <div className="arena-world3d__canvas" ref={mount}/>
   <div className="arena-world3d__curtain"/>
   <div className="arena-world3d__rays"><i/><i/><i/></div>
 </div>;
}
