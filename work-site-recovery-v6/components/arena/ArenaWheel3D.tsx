'use client';
/**
 * Arena Crown Wheel • authentic extruded WebGL geometry, metallic mechanics and
 * original authored Arabic/English sector labels. Rendering only: the Worker
 * owns spin timing, selected sector, scores and the trainer's judging.
 */
import {useEffect,useRef} from 'react';
import {TAU,sectorAngle,forwardSweep,easedStop,wheelClock} from '../../lib/arena-wheel3d-math';
import {ARENA_CINEMA_B,sectorCorporateColor,visibleWheelLabel} from '../../lib/arena-wheel-theme';
import './ArenaWheel3D.css';
type Sector={label?:string;kind?:string};
type Spin={id?:string;startsAt?:number;stopsAt?:number;index?:number;revealed?:boolean};
type Props={sectors:Sector[];spin?:Spin|null;serverNow:number;canSpin:boolean;onSpin:()=>void;ar:boolean;countdown:number;onUnavailable:()=>void};
const kindIcons:Record<string,string>={question:'?',prize:'★',penalty:'↺',mystery:'✦',challenge:'◆'};
export default function ArenaWheel3D({sectors,spin,serverNow,canSpin,onSpin,ar,countdown,onUnavailable}:Props){
 const mount=useRef<HTMLDivElement>(null);
 const spinRef=useRef(spin),clockRef=useRef({serverNow,at:0}),failRef=useRef(onUnavailable);
 spinRef.current=spin;failRef.current=onUnavailable;
 useEffect(()=>{clockRef.current={serverNow,at:performance.now()};},[serverNow]);
 const sectorsKey=JSON.stringify(sectors.map(s=>[s.label,s.kind]));
 useEffect(()=>{
  const root=mount.current;
  if(!root||sectors.length<2||sectors.length>20){failRef.current();return;}
  let raf=0,removed=false,renderer:any;
  const disposables:Array<{dispose:()=>void}>=[];
  const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const coarse=!!window.matchMedia?.('(pointer: coarse)')?.matches;
  let onLost:(e:Event)=>void=()=>{};
  const initialize=async()=>{
   try{
    // The local Cairo font must finish loading before canvas labels become WebGL textures.
    await document.fonts?.load('800 48px Cairo','سؤال وتحدي').catch(()=>[]);
    const THREE=await import('three');
    if(removed)return;
    // WebGLRenderer probes support itself. Avoid allocating a second GPU context.
    renderer=new THREE.WebGLRenderer({antialias:!coarse,alpha:true,powerPreference:coarse?'low-power':'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.3:1.75));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.28;
    const canvas=renderer.domElement;
    canvas.setAttribute('aria-hidden','true');
    root.appendChild(canvas);
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(34,1,.1,100);
    camera.position.set(0,-.15,11.7);
    scene.add(new THREE.HemisphereLight(0xe3f5ff,0x07172b,2.8));
    const key=new THREE.SpotLight(0xf5fbff,145,40,Math.PI/4,.65,1.7);
    key.position.set(-4,5,9);scene.add(key);
    const rimLight=new THREE.PointLight(0x55d2ff,110,30);
    rimLight.position.set(4,-1.2,6.5);scene.add(rimLight);
    const violet=new THREE.PointLight(0x35e78c,65,30);
    violet.position.set(-5,-1.5,2.2);scene.add(violet);
    const brass=new THREE.MeshStandardMaterial({color:ARENA_CINEMA_B.chrome,metalness:.83,roughness:.19});
    const bright=new THREE.MeshStandardMaterial({color:0xf4f9ff,metalness:.65,roughness:.15,emissive:0x1277cc,emissiveIntensity:.25});
    const bronze=new THREE.MeshStandardMaterial({color:0x648ba7,metalness:.82,roughness:.26});
    const graphite=new THREE.MeshStandardMaterial({color:0x092343,metalness:.7,roughness:.24});
    const sapphire=new THREE.MeshStandardMaterial({color:0x064a86,metalness:.58,roughness:.24,emissive:0x028dca,emissiveIntensity:.32});
    const halo=new THREE.MeshBasicMaterial({color:0x39d887});
    disposables.push(brass,bright,bronze,graphite,sapphire,halo);
    const stage=new THREE.Group();stage.position.y=.29;scene.add(stage);
    const tilt=new THREE.Group();tilt.rotation.x=-.095;stage.add(tilt);
    const wheel=new THREE.Group();tilt.add(wheel);
    const mesh=(geo:any,mat:any,parent:any,x=0,y=0,z=0)=>{
      const item=new THREE.Mesh(geo,mat);item.position.set(x,y,z);parent.add(item);disposables.push(geo);return item;
    };
    const ring=(r:number,t:number,z:number,mat:any,parent=wheel)=>{
      mesh(new THREE.TorusGeometry(r,t,12,144),mat,parent,0,0,z);
    };
    // Heavy mechanical housing: cylinder axis faces the audience.
    const shell=mesh(new THREE.CylinderGeometry(2.49,2.49,.50,112),graphite,wheel,0,0,-.12);
    shell.rotation.x=Math.PI/2;
    const back=mesh(new THREE.CylinderGeometry(2.61,2.61,.25,112),bronze,wheel,0,0,-.31);
    back.rotation.x=Math.PI/2;
    const step=TAU/sectors.length;
    for(let i=0;i<sectors.length;i++){
      const from=Math.PI/2-(i-.5)*step;
      const to=Math.PI/2-(i+.5)*step;
      const shape=new THREE.Shape();shape.moveTo(0,0);
      const count=Math.max(7,Math.ceil(48/sectors.length));
      for(let j=0;j<=count;j++){
        const a=from+(to-from)*j/count;
        shape.lineTo(Math.cos(a)*2.30,Math.sin(a)*2.30);
      }
      shape.closePath();
      const geometry=new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:true,bevelThickness:.016,bevelSize:.012,bevelSegments:2,steps:1});
      const color=sectorCorporateColor(sectors[i].kind,i);
      const material=new THREE.MeshStandardMaterial({color,roughness:.29,metalness:.37,side:THREE.DoubleSide});
      disposables.push(material);
      mesh(geometry,material,wheel,0,0,.10);
      const edge=new THREE.Mesh(new THREE.BoxGeometry(.024,2.19,.055),brass);
      edge.rotation.z=-(i-.5)*step;
      edge.position.set(Math.sin((i-.5)*step)*1.095,Math.cos((i-.5)*step)*1.095,.375);
      wheel.add(edge);disposables.push(edge.geometry);
      const mid=Math.PI/2-i*step;
      // Canvas supports connected Arabic glyphs; labels come from the authored game.
      const labelText=visibleWheelLabel(sectors[i],i,sectors.length);
      const canPrintFull=sectors.length<=10;
      const face=document.createElement('canvas');face.width=512;face.height=256;
      const ctx=face.getContext('2d');
      if(ctx){
        ctx.clearRect(0,0,512,256);
        ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction=ar?'rtl':'ltr';
        ctx.shadowColor='#041022';ctx.shadowBlur=10;
        ctx.fillStyle=color===0xf3f8ff||color===0xf1f6ff?'#07345b':'#f9fcff';ctx.font='800 56px Cairo,Arial,sans-serif';
        const symbol=kindIcons[sectors[i].kind||'']||'✦';
        ctx.font='800 91px Cairo,Arial,sans-serif';ctx.fillText(symbol,256,60);
        if(canPrintFull&&labelText){
          ctx.font='800 47px Cairo,Arial,sans-serif';
          const words=labelText.split(/\s+/),rows:string[]=[];let line='';
          for(const word of words){
            const candidate=line?line+' '+word:word;
            if(ctx.measureText(candidate).width>445&&line){rows.push(line);line=word;}else line=candidate;
          }
          if(line)rows.push(line);
          if(rows.length>2)rows[1]=rows.slice(1).join(' ').slice(0,18)+'…';
          rows.slice(0,2).forEach((row,index)=>{
            let size=47;while(size>28&&ctx.measureText(row).width>455){size-=2;ctx.font='800 '+size+'px Cairo,Arial,sans-serif';}
            ctx.fillText(row,256,145+index*65);
            ctx.font='800 47px Cairo,Arial,sans-serif';
          });
        }else{
          ctx.font='800 95px Cairo,Arial,sans-serif';ctx.fillText(String(i+1).padStart(2,'0'),256,171);
        }
        const texture=new THREE.CanvasTexture(face);texture.colorSpace=THREE.SRGBColorSpace;
        const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:true,depthWrite:false});
        const sprite=new THREE.Sprite(material);sprite.position.set(Math.cos(mid)*1.47,Math.sin(mid)*1.47,.44);
        const spriteWidth=sectors.length<=6?1.27:sectors.length<=8?1.08:.84;
        sprite.scale.set(spriteWidth,spriteWidth*.50,1);
        wheel.add(sprite);disposables.push(texture,material);
      }
      // Raised golden outer marker, like machined numbered arcade wheels.
      const pin=mesh(new THREE.SphereGeometry(.057,10,8),bright,wheel,Math.cos(mid)*2.16,Math.sin(mid)*2.16,.43);
      pin.scale.z=.60;
    }
    // Deep, brightly polished crown bezel and teal machined concentric rail.
    ring(2.46,.13,.29,brass);
    ring(2.51,.042,.35,bright);
    ring(2.32,.027,.39,bronze);
    ring(2.59,.035,.15,graphite);
    ring(2.66,.018,-.10,halo,tilt);
    const bulbs=48,orbGeo=new THREE.SphereGeometry(.046,9,7);
    const lightMaterial=new THREE.MeshStandardMaterial({color:0xe6f6ff,emissive:0x1d9cf1,emissiveIntensity:1.8,roughness:.12});
    const bulbsMesh=new THREE.InstancedMesh(orbGeo,lightMaterial,bulbs);
    const dummy=new THREE.Object3D();
    for(let i=0;i<bulbs;i++){
      const a=TAU*i/bulbs;
      dummy.position.set(Math.sin(a)*2.49,Math.cos(a)*2.49,.43);
      dummy.scale.setScalar(i%6===0?1.35:1);
      dummy.updateMatrix();bulbsMesh.setMatrixAt(i,dummy.matrix);
    }
    bulbsMesh.instanceMatrix.needsUpdate=true;wheel.add(bulbsMesh);
    disposables.push(orbGeo,lightMaterial);
    // Center mechanical shield and text medallion (NOT a replacement for official logos).
    const hub=mesh(new THREE.CylinderGeometry(.72,.72,.40,64),brass,wheel,0,0,.48);hub.rotation.x=Math.PI/2;
    const inset=mesh(new THREE.CylinderGeometry(.62,.62,.07,64),graphite,wheel,0,0,.73);inset.rotation.x=Math.PI/2;
    ring(.63,.042,.76,bright);
    const crest=document.createElement('canvas');crest.width=512;crest.height=320;
    const crestCtx=crest.getContext('2d');
    if(crestCtx){
      crestCtx.clearRect(0,0,512,320);
      crestCtx.textAlign='center';crestCtx.textBaseline='middle';
      crestCtx.fillStyle='#f6fcff';crestCtx.shadowColor='#0286e0';crestCtx.shadowBlur=11;
      crestCtx.font='800 142px Cairo,Arial,sans-serif';crestCtx.fillText('MTS',256,143);
      crestCtx.shadowBlur=0;crestCtx.fillStyle='#57d98d';crestCtx.font='800 36px Cairo,Arial,sans-serif';
      crestCtx.fillText('TRAINING ARENA',256,235);
      const texture=new THREE.CanvasTexture(crest);texture.colorSpace=THREE.SRGBColorSpace;
      const mat=new THREE.SpriteMaterial({map:texture,transparent:true});
      const sprite=new THREE.Sprite(mat);sprite.position.set(0,0,.81);sprite.scale.set(1.17,.73,1);
      wheel.add(sprite);disposables.push(texture,mat);
    }
    // Jewelled fixed top pointer: it does not rotate with the game sectors.
    const pointerShape=new THREE.Shape();
    pointerShape.moveTo(-.28,2.92);pointerShape.lineTo(.28,2.92);
    pointerShape.lineTo(.18,2.66);pointerShape.lineTo(0,2.38);
    pointerShape.lineTo(-.18,2.66);pointerShape.closePath();
    const pointer=mesh(new THREE.ExtrudeGeometry(pointerShape,{depth:.16,bevelEnabled:true,bevelSegments:2,bevelSize:.025,bevelThickness:.035}),bright,stage,0,0,.81);
    const jewel=mesh(new THREE.OctahedronGeometry(.16,0),new THREE.MeshStandardMaterial({color:0x35de83,metalness:.28,roughness:.10,emissive:0x026b4e,emissiveIntensity:.23}),stage,0,2.78,1.03);
    disposables.push(jewel.material);
    jewel.scale.y=.85;
    // Sculpted stand / base with stage halo.
    const pole=mesh(new THREE.CylinderGeometry(.13,.23,1.1,20),graphite,stage,0,-2.85,-.55);
    const foot=mesh(new THREE.CylinderGeometry(1.72,1.89,.27,64),bronze,stage,0,-3.42,-.37);
    const plate=mesh(new THREE.CylinderGeometry(1.59,1.72,.12,64),graphite,stage,0,-3.26,-.37);
    const footRing=mesh(new THREE.TorusGeometry(1.70,.054,10,92),bright,stage,0,-3.30,-.06);
    footRing.rotation.x=Math.PI/2;
    const plinth=mesh(new THREE.BoxGeometry(1.25,.39,.79),sapphire,stage,0,-2.88,-.29);
    const arc=mesh(new THREE.TorusGeometry(3.02,.017,8,100,Math.PI*1.25),halo,scene,0,-.03,-2.1);
    arc.rotation.z=Math.PI*.34;
    let angle=0,spinId='',lastFrame=performance.now();
    let finish:{start:number;from:number;to:number;ms:number}|null=null;
    let width=0,height=0,frames=0;
    const resize=()=>{
      const w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);
      if(w===width&&h===height)return;
      width=w;height=h;renderer.setSize(w,h,false);
      camera.aspect=w/h;
      camera.fov=w<520?39:34;
      camera.position.z=w<520?16.3:w<850?14.1:11.7;
      camera.updateProjectionMatrix();
    };
    onLost=(e:Event)=>{e.preventDefault();failRef.current();};
    canvas.addEventListener('webglcontextlost',onLost,false);
    const render=(frame:number)=>{
      if(removed)return;
      raf=requestAnimationFrame(render);
      if(document.hidden)return;
      if(coarse&&++frames%2!==0)return;
      resize();
      const dt=Math.min(.055,Math.max(0,(frame-lastFrame)/1000));lastFrame=frame;
      const current=spinRef.current;
      const now=wheelClock(clockRef.current.serverNow,clockRef.current.at,frame);
      if(current?.id!==spinId){spinId=current?.id||'';finish=null;}
      if(current?.id){
        if(now<(current.startsAt||0)){/* real server countdown, no early spin */}
        else if(current.revealed&&Number.isInteger(current.index)&&current.index!>=0&&current.index!<sectors.length){
          if(!finish){
            const to=sectorAngle(current.index!,sectors.length);
            finish={start:frame,from:angle,to:angle+forwardSweep(angle,to),ms:reduced?0:380};
          }
          angle=finish.from+(finish.to-finish.from)*easedStop(finish.ms?(frame-finish.start)/finish.ms:1);
        }else if(!current.revealed){
          // Spin without knowing the outcome; final alignment only after the signed reveal.
          angle+=dt*(reduced?1.1:now>(current.stopsAt||Infinity)?4.8:10.5);
        }
      }
      wheel.rotation.z=angle;
      if(!reduced&&!coarse)stage.rotation.y=-.045+Math.sin(frame*.00027)*.035;
      if(!reduced)key.intensity=148+5*Math.sin(frame*.0016);
      camera.lookAt(0,-.23,0);
      renderer.render(scene,camera);
    };
    resize();raf=requestAnimationFrame(render);
   }catch(error){
    if(!removed){console.warn('Arena Cinematic B Wheel: WebGL unavailable; accessible action displayed.',error);failRef.current();}
   }
  };
  void initialize();
  return ()=>{removed=true;cancelAnimationFrame(raf);
   if(renderer){renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.dispose();renderer.domElement.remove();}
   for(const asset of disposables)try{asset.dispose();}catch{/* dispose resource */}
  };
 },[sectorsKey]);
 return <div className="arena-wheel3d arena-wheel3d--crown arena-wheel3d--cinematic-b" data-testid="arena-wheel3d" aria-label={ar?'عجلة الحظ ثلاثية الأبعاد':'Arena Cinematic B Wheel'}>
  <div className="arena-wheel3d__canvas" ref={mount} aria-hidden="true"/>
  <div className="arena-wheel3d__ambient" aria-hidden="true"/>
  <button type="button" className="arena-wheel3d__tap" disabled={!canSpin}
   aria-label={ar?'اضغط على مجسم عجلة الحظ لبدء اللف':'Tap the Arena Cinematic B wheel to spin'}
   title={ar?'لف عجلة الحظ':'Spin the wheel'} onClick={onSpin}/>
  {countdown>0&&countdown<=3&&<div className="arena-wheel3d__countdown" aria-live="polite">{countdown}</div>}
  <div className="arena-wheel3d__status">MTS · CINEMATIC B 3D</div>
  <div className="arena-wheel3d__pill">{canSpin?(ar?'المس العجلة لبدء التحدي':'TOUCH THE WHEEL TO SPIN'):(spin&&!spin.revealed?(ar?'لحظة الحظ… العجلة بتلف':'THE WHEEL IS SPINNING…'):(ar?'عجلة الحظ':'FORTUNE WHEEL'))}</div>
 </div>;
}
