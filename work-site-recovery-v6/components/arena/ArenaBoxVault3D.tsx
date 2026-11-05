'use client';
/** Agustín Hönnun Sci-Fi Crate (CC BY), user-provided model. Visuals only:
 * session API remains authoritative for box selection, reveal and scoring. */
import {useEffect,useRef,useState} from 'react';
import {loadArenaCrateGeometry} from './ArenaSciFiCrateGeometry';
import './ArenaBoxVault3D.css';
type Props={items:string[];used:number[];active:number;canChoose:boolean;repeatable:boolean;onOpen:(i:number)=>void;ar:boolean};
export default function ArenaBoxVault3D({items,used,active,canChoose,repeatable,onOpen,ar}:Props){
 const ref=useRef<HTMLDivElement>(null);
 const state=useRef({used,active,canChoose,repeatable,onOpen});
 const [unavailable,setUnavailable]=useState(false);
 state.current={used,active,canChoose,repeatable,onOpen};
 useEffect(()=>{
  const root=ref.current;if(!root||!items.length)return;
  let gone=false,raf=0,renderer:any,select:(e:PointerEvent)=>void=()=>{};
  const assets:Array<{dispose:()=>void}>=[];
  const coarse=!!window.matchMedia?.('(pointer: coarse)')?.matches;
  const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const onLost=(e:Event)=>{e.preventDefault();if(!gone)setUnavailable(true);};
  const start=async()=>{
   try{
    const THREE=await import('three');
    const parts=await loadArenaCrateGeometry(THREE);
    assets.push(...parts.map(x=>x.geometry));
    if(gone)return;
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:!coarse,powerPreference:coarse?'low-power':'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.2:1.6));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.55;
    root.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost',onLost,false);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100);
    scene.add(new THREE.HemisphereLight(0xd8efff,0x0b1e36,2.7));
    const key=new THREE.SpotLight(0xffe0a6,135,30,Math.PI/4,.5,1.7);
    key.position.set(-5,8,9);scene.add(key);
    const teal=new THREE.PointLight(0x24d5ab,120,30);
    teal.position.set(5,2,6);scene.add(teal);
    const cyan=new THREE.PointLight(0x359cf5,90,30);
    cyan.position.set(-4,-1,7);scene.add(cyan);
    const navy=new THREE.MeshStandardMaterial({color:0x0b2d4a,metalness:.72,roughness:.33,side:THREE.DoubleSide});
    const blue=new THREE.MeshStandardMaterial({color:0x155d83,metalness:.58,roughness:.31,side:THREE.DoubleSide});
    const gold=new THREE.MeshStandardMaterial({color:0xc7a86e,metalness:.86,roughness:.27,side:THREE.DoubleSide});
    const glow=new THREE.MeshStandardMaterial({color:0x24dba8,metalness:.35,roughness:.22,emissive:0x04a87e,emissiveIntensity:1.5,side:THREE.DoubleSide});
    const dark=new THREE.MeshStandardMaterial({color:0x172d3d,metalness:.83,roughness:.31,side:THREE.DoubleSide});
    assets.push(navy,blue,gold,glow,dark);
    const material=(name:string)=>name.startsWith('9Base')?dark:name.startsWith('7Box')?navy:
      name.startsWith('5Chasis')?blue:name.startsWith('4Lights')?glow:
      name.startsWith('1Handle')||name.startsWith('6Edges')?gold:
      name.startsWith('3Cover')?navy:name.startsWith('2Top')?blue:gold;
    const upper=(name:string)=>/^(2Top|4Lights|3Cover|1Handle|6Edges)/.test(name);
    const world=new THREE.Group();scene.add(world);
    const count=items.length,columns=Math.min(5,Math.ceil(Math.sqrt(count*1.5))),rows=Math.ceil(count/columns);
    const dx=1.67,dy=1.79;
    const crates:Array<{root:any;lid:any;rim:any;index:number;open:number}>=[];
    for(let i=0;i<count;i++){
     const col=i%columns,row=Math.floor(i/columns);
     const chest=new THREE.Group();world.add(chest);
     chest.position.set((col-(Math.min(count,columns)-1)/2)*dx,((rows-1)/2-row)*dy,0);
     const model=new THREE.Group();model.position.y=-.75;model.scale.setScalar(2.15);chest.add(model);
     // All source meshes are in their original GLB coordinate system.
     const lid=new THREE.Group();lid.position.set(0,.603,-.31);model.add(lid);
     const lidPieces=new THREE.Group();lidPieces.position.set(0,-.603,.31);lid.add(lidPieces);
     for(const part of parts){
      const mesh=new THREE.Mesh(part.geometry,material(part.name));
      mesh.userData.boxIndex=i;
      (upper(part.name)?lidPieces:model).add(mesh);
     }
     const number=document.createElement('canvas');number.width=128;number.height=128;
     const ctx=number.getContext('2d');
     if(ctx){
      ctx.fillStyle='#ffe2a9';ctx.font='bold 82px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(i+1).padStart(2,'0'),64,64);
      const texture=new THREE.CanvasTexture(number);texture.colorSpace=THREE.SRGBColorSpace;
      const mat=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});
      const badge=new THREE.Sprite(mat);badge.position.set(0,-.19,.83);badge.scale.set(.5,.5,1);
      chest.add(badge);assets.push(texture,mat);
     }
     const rimMat=new THREE.MeshBasicMaterial({color:0x14d3b2,transparent:true,opacity:.12,depthWrite:false});
     const rim=new THREE.Mesh(new THREE.RingGeometry(.69,.75,40),rimMat);
     rim.position.z=-.42;chest.add(rim);assets.push(rim.geometry,rimMat);
     crates.push({root:chest,lid,rim,index:i,open:0});
    }
    // Leave the broadcast floor open: no opaque rectangular placeholder stage.
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    select=(event:PointerEvent)=>{
     const st=state.current;if(!st.canChoose)return;
     const rect=renderer.domElement.getBoundingClientRect();
     pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
     raycaster.setFromCamera(pointer,camera);
     for(const hit of raycaster.intersectObjects(world.children,true)){
      let obj:any=hit.object;
      while(obj&&obj.userData?.boxIndex===undefined)obj=obj.parent;
      const i=obj?.userData?.boxIndex;
      if(Number.isInteger(i)&&(!st.used.includes(i)||st.repeatable)){st.onOpen(i);return;}
     }
    };
    renderer.domElement.addEventListener('pointerup',select);
    let w=0,h=0,previous=performance.now(),frames=0,verticalOffset=0;
    const draw=(time:number)=>{
     if(gone)return;
     raf=requestAnimationFrame(draw);if(document.hidden)return;
     if(coarse&&++frames%2!==0)return;
     const rw=Math.max(1,root.clientWidth),rh=Math.max(1,root.clientHeight);
     if(rw!==w||rh!==h){w=rw;h=rh;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
     const dt=Math.min(.07,Math.max(0,(time-previous)/1000));previous=time;
     const st=state.current;
     for(const chest of crates){
      const official=st.used.includes(chest.index)||st.active===chest.index;
      const target=official?1:0;
      chest.open=reduced?target:chest.open+(target-chest.open)*Math.min(1,dt*4.3);
      chest.lid.rotation.x=-1.13*chest.open;
      chest.root.position.z=st.active===chest.index?.2:0;
      chest.rim.material.opacity=st.active===chest.index?.86:official?.27:.12;
     }
     if(!reduced)world.rotation.y=Math.sin(time*.00032)*.055;
     const radians=THREE.MathUtils.degToRad(camera.fov);
     const vertical=2*Math.tan(radians/2),horizontal=vertical*camera.aspect;
     // Fill the available projector/phone scene but keep the whole crate grid
     // within both frame axes, regardless of box count and aspect ratio.
     const gridWidth=columns*dx+.55,gridHeight=rows*dy+.7;
     const distance=Math.max(3.6,Math.max(gridWidth/horizontal,gridHeight/vertical)*1.14);
     // After a confirmed opening, frame the hinged top inside the vault,
     // easing camera framing instead of abruptly moving the whole scene.
     const targetOffset=st.used.length?.34:0;
     verticalOffset=reduced?targetOffset:verticalOffset+(targetOffset-verticalOffset)*Math.min(1,dt*4);
     camera.position.set(0,.20+verticalOffset,distance);
     camera.lookAt(0,verticalOffset,0);
     renderer.render(scene,camera);
    };
    raf=requestAnimationFrame(draw);
   }catch(error){if(!gone){console.warn('Sci-Fi Crate unavailable; using accessible numbered selection.',error);setUnavailable(true);}}
  };
  void start();
  return ()=>{
   gone=true;cancelAnimationFrame(raf);
   if(renderer){renderer.domElement.removeEventListener('pointerup',select);renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.dispose();renderer.domElement.remove();}
   for(const item of assets)try{item.dispose();}catch{/* release GPU resource */}
  };
 },[items.length]);
 return <div data-source-model="agustin-honnun-sci-fi-crate" data-geometry-meshes="9" className={'arena-box3d'+(unavailable?' arena-box3d--lite':'')} role="group" aria-label={ar?'صناديق الجوائز ثلاثية الأبعاد':'3D prize vault'}>
  {!unavailable&&<div className="arena-box3d__scene" aria-hidden="true" ref={ref}/>}
  <div className="arena-box3d__numbers" aria-label={ar?'اختيار الصندوق':'Choose a box'}>
   {items.map((label,i)=>{
    const exhausted=!repeatable&&used.includes(i),chosen=active===i;
    return <button type="button" key={i} className={'arena-box3d__selector'+(chosen?' arena-box3d__selector--active':'')+(exhausted?' arena-box3d__selector--used':'')}
      aria-pressed={chosen} aria-label={(ar?'صندوق رقم ':'Box number ')+(i+1)+(exhausted?(ar?' تم فتحه':' opened'):'')}
      disabled={!canChoose||exhausted} onClick={()=>onOpen(i)}>{String(i+1).padStart(2,'0')}</button>;
   })}
  </div>
  {unavailable&&<span className="arena-box3d__lite-note">{ar?'المجسم غير متاح على الجهاز؛ اختار الصندوق من الأرقام':'3D unavailable. Choose a numbered box.'}</span>}
 </div>;
}
