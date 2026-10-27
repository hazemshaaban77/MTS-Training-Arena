'use client';
/** Real WebGL geometry for the 3D-LAB opt-in. No network or scoring effects.
 * Renderer gracefully falls back to the existing CSS wheel on unsupported devices.
 */
import {useEffect,useRef} from 'react';
import {TAU,sectorAngle,forwardSweep,easedStop,wheelClock} from '../../lib/arena-wheel3d-math';
import './ArenaWheel3D.css';
type Sector={label?:string;kind?:string};
type Spin={id?:string;startsAt?:number;stopsAt?:number;index?:number;revealed?:boolean};
type Props={sectors:Sector[];spin?:Spin|null;serverNow:number;canSpin:boolean;onSpin:()=>void;ar:boolean;countdown:number;onUnavailable:()=>void};
const swatches:Record<string,number[]>={question:[0x2678cf,0x357bd2],prize:[0x0a9a9e,0x0c7089],penalty:[0xa34196,0x803a9a],mystery:[0x6650c9,0x48328f],challenge:[0xb8822b,0xd1a13c]};
export default function ArenaWheel3D({sectors,spin,serverNow,canSpin,onSpin,ar,countdown,onUnavailable}:Props){
 const mount=useRef<HTMLDivElement>(null),spinRef=useRef(spin),clockRef=useRef({serverNow,at:0}),failRef=useRef(onUnavailable);
 spinRef.current=spin;failRef.current=onUnavailable;
 useEffect(()=>{clockRef.current={serverNow,at:performance.now()};},[serverNow]);
 // A rebuilt wheel is intentionally tied only to the authored sectors.
 const sectorsKey=JSON.stringify(sectors.map(s=>[s.label,s.kind]));
 useEffect(()=>{
  const root=mount.current;
  if(!root||sectors.length<2||sectors.length>20){failRef.current();return;}
  let raf=0,removed=false,renderer:any;
  const disposals:Array<{dispose:()=>void}>=[];
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reduced=!!media?.matches;
  const coarse=window.matchMedia?.('(pointer: coarse)')?.matches;
  let onLost:(e:Event)=>void=()=>{};
  const initialize=async()=>{
   try{
    const THREE=await import('three');
    if(removed)return;
    const probe=document.createElement('canvas');
    if(!probe.getContext('webgl2')&&!probe.getContext('webgl'))throw Error('WebGL unavailable');
    renderer=new THREE.WebGLRenderer({antialias:!coarse,alpha:true,powerPreference:coarse?'low-power':'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.4:1.8));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.38;
    const element=renderer.domElement;
    element.setAttribute('aria-hidden','true');
    element.style.display='block';
    root.appendChild(element);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,0.1,100);
    camera.position.set(0,-3.0,11.8);
    const stage=new THREE.Group();scene.add(stage);
    scene.add(new THREE.HemisphereLight(0xd6eeff,0x241d2b,2.7));
    const spot=new THREE.SpotLight(0xffe7ae,140,45,Math.PI/4,.7,1.7);
    spot.position.set(-4.2,6.0,10);scene.add(spot);
    const side=new THREE.PointLight(0x61cbff,120,40);side.position.set(4,-1,7);scene.add(side);
    const blue=new THREE.PointLight(0x4c49d1,65,22);blue.position.set(-5,-3,3);scene.add(blue);
    const gold=new THREE.MeshStandardMaterial({color:0xcca35e,metalness:.8,roughness:.19});
    const bronze=new THREE.MeshStandardMaterial({color:0x5c3d25,metalness:.72,roughness:.27});
    const panel=new THREE.MeshStandardMaterial({color:0x192839,metalness:.72,roughness:.3});
    const wheel=new THREE.Group();
    wheel.rotation.x=-.12;
    stage.add(wheel);
    const rim=(radius:number,thickness:number,z:number,mat:any)=>{
      const tor=new THREE.Mesh(new THREE.TorusGeometry(radius,thickness,12,128),mat);
      tor.position.z=z;wheel.add(tor);
    };
    const backing=new THREE.Mesh(new THREE.CylinderGeometry(2.47,2.47,.37,96),panel);
    backing.rotation.x=Math.PI/2;backing.position.z=-.12;wheel.add(backing);
    const n=sectors.length,step=TAU/n;
    for(let i=0;i<n;i++){
      const begin=Math.PI/2-(i-.5)*step,finish=Math.PI/2-(i+.5)*step;
      const shape=new THREE.Shape();shape.moveTo(0,0);
      const samples=Math.max(6,Math.ceil(45/n));
      for(let j=0;j<=samples;j++){
        const a=begin+(finish-begin)*j/samples;
        shape.lineTo(Math.cos(a)*2.30,Math.sin(a)*2.30);
      }
      shape.closePath();
      const geometry=new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.016,bevelThickness:.015,curveSegments:5});
      const colors=swatches[sectors[i].kind||'']||[0x205e9e,0x148aa3];
      const material=new THREE.MeshStandardMaterial({color:colors[i%colors.length],metalness:.32,roughness:.38,side:THREE.DoubleSide});
      const wedge=new THREE.Mesh(geometry,material);wedge.position.z=.12;wheel.add(wedge);
      disposals.push(geometry,material);
      // Readable sector numbers on canvas textures; the written Arabic labels stay native HTML below.
      const face=document.createElement('canvas');face.width=192;face.height=128;
      const ctx=face.getContext('2d');
      if(ctx){
        ctx.fillStyle='#fff2cf';ctx.font='900 88px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.shadowColor='#05101c';ctx.shadowBlur=7;ctx.fillText(String(i+1).padStart(2,'0'),96,66);
        const tex=new THREE.CanvasTexture(face);tex.colorSpace=THREE.SRGBColorSpace;
        const label=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
        const mid=Math.PI/2-i*step;
        label.position.set(Math.cos(mid)*1.68,Math.sin(mid)*1.68,.44);
        label.scale.set(.66,.47,1);wheel.add(label);
        disposals.push(tex,label.material);
      }
    }
    rim(2.41,.095,.31,gold);rim(2.12,.025,.36,bronze);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.38,48),gold);hub.rotation.x=Math.PI/2;hub.position.z=.49;wheel.add(hub);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.21,24,16),gold);cap.position.z=.75;wheel.add(cap);
    const pointer=new THREE.Mesh(new THREE.ConeGeometry(.23,.52,4),gold);
    pointer.position.set(0,2.64,.79);pointer.rotation.z=Math.PI;stage.add(pointer);
    const rest=new THREE.Mesh(new THREE.CylinderGeometry(.13,.22,1.15,16),bronze);
    rest.position.set(0,-2.95,-.52);stage.add(rest);
    const foot=new THREE.Mesh(new THREE.BoxGeometry(1.22,.17,.85),panel);
    foot.position.set(0,-3.53,-.60);stage.add(foot);
    let angle=0,spinId='',lastFrame=performance.now();
    let finish:{start:number;from:number;to:number;ms:number}|null=null;
    let width=0,height=0,frameCount=0;
    const resize=()=>{
      const w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);
      if(w===width&&h===height)return;
      width=w;height=h;renderer.setSize(w,h,false);
      camera.aspect=w/h;
      camera.position.z=w<500?14.7:11.8;
      camera.fov=w<500?37:34;camera.updateProjectionMatrix();
    };
    onLost=(e:Event)=>{e.preventDefault();failRef.current();};
    element.addEventListener('webglcontextlost',onLost,false);
    const render=(frame:number)=>{
      if(removed)return;
      raf=requestAnimationFrame(render);
      if(document.hidden)return;
      // Do not waste the mobile GPU rendering 60fps for a static wheel.
      if(coarse&&++frameCount%2!==0)return;
      resize();
      const dt=Math.min(.065,Math.max(0,(frame-lastFrame)/1000));lastFrame=frame;
      const current=spinRef.current;
      const now=wheelClock(clockRef.current.serverNow,clockRef.current.at,frame);
      if(current?.id!==spinId){
        spinId=current?.id||'';finish=null;
      }
      if(current?.id){
        if(now<(current.startsAt||0)){
          // The canonical server countdown has not finished: do not spin early.
        }else if(current.revealed&&Number.isInteger(current.index)&&current.index!>=0&&current.index!<n){
          if(!finish){
            const to=sectorAngle(current.index!,n);
            finish={start:frame,from:angle,to:angle+forwardSweep(angle,to),ms:reduced?0:430};
          }
          angle=finish.from+(finish.to-finish.from)*easedStop(finish.ms?(frame-finish.start)/finish.ms:1);
        }else if(!current.revealed){
          // Index stays secret until the server reveals it.
          const late=now>(current.stopsAt||Infinity);
          angle+=dt*(reduced?0:late?3.9:9.8);
        }
      }else if(!reduced&& !coarse){
        stage.rotation.y=Math.sin(frame*.00025)*.055;
      }
      wheel.rotation.z=angle;
      if(!reduced){spot.intensity=130+9*Math.sin(frame*.0016);}
      camera.lookAt(0,-.32,.1);
      renderer.render(scene,camera);
    };
    resize();raf=requestAnimationFrame(render);
    disposals.push(gold,bronze,panel);
    scene.traverse(obj=>{const mesh=obj as any;if(mesh.geometry)disposals.push(mesh.geometry);});
   }catch(e){
    if(!removed){console.warn('Arena WebGL wheel unavailable; using original safe wheel.',e);failRef.current();}
   }
  };
  void initialize();
  return ()=>{removed=true;cancelAnimationFrame(raf);
   if(renderer){renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.dispose();renderer.domElement.remove();}
   for(const asset of disposals)try{asset.dispose();}catch{/* best effort */}
  };
 },[sectorsKey]);
 return <div className="arena-wheel3d" data-testid="arena-wheel3d" aria-label={ar?'عجلة حظ ثلاثية الأبعاد':'Three-dimensional fortune wheel'}>
   <div className="arena-wheel3d__canvas" ref={mount} aria-hidden="true"/>
   <button type="button" className="arena-wheel3d__tap" disabled={!canSpin}
    aria-label={ar?'اضغط على مجسم العجلة لبدء اللف':'Tap the 3D wheel to spin'} title={ar?'لف العجلة ثلاثية الأبعاد':'Spin the 3D wheel'} onClick={onSpin}/>
   {countdown>0&&countdown<=3&&<div className="arena-wheel3d__countdown" aria-live="polite">{countdown}</div>}
   <div className="arena-wheel3d__status">WEBGL · REAL 3D LAB</div>
   <div className="arena-wheel3d__pill">{canSpin?(ar?'المس العجلة عشان تبدأ':'TOUCH TO SPIN'):(spin&&!spin.revealed?(ar?'العجلة بتلف…':'SPINNING…'):(ar?'عجلة الحظ':'FORTUNE WHEEL'))}</div>
  </div>;
}
