'use client';
/**
 * Actual 3D prize vault, raycast selection and authoritative lid reveal.
 * Box open state is driven by server selection/used list, never a local prize.
 * Numbered native HTML controls preserve keyboard/screen-reader access.
 */
import {useEffect,useRef,useState} from 'react';
import './ArenaBoxVault3D.css';
import {loadArenaCrateGeometry} from './ArenaSciFiCrateGeometry';
type Props={items:string[];used:number[];active:number;canChoose:boolean;repeatable:boolean;onOpen:(i:number)=>void;ar:boolean};
export default function ArenaBoxVault3D({items,used,active,canChoose,repeatable,onOpen,ar}:Props){
 const ref=useRef<HTMLDivElement>(null),state=useRef({used,active,canChoose,repeatable,onOpen}),[unavailable,setUnavailable]=useState(false),[authentic,setAuthentic]=useState(false);
 state.current={used,active,canChoose,repeatable,onOpen};
 useEffect(()=>{
  const root=ref.current;if(!root||!items.length)return;
  let gone=false,raf=0,renderer:any,onContextLost=(e:Event)=>{e.preventDefault();setUnavailable(true);};
  const assets:Array<{dispose:()=>void}>=[];
  const coarse=!!window.matchMedia?.('(pointer: coarse)')?.matches;
  const reduce=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const start=async()=>{
   try{
    const THREE=await import('three');if(gone)return;
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:!coarse,powerPreference:coarse?'low-power':'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.15:1.65));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.55;
    root.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100);
    scene.add(new THREE.HemisphereLight(0xc8edff,0x1a0b20,2.4));
    const goldLight=new THREE.SpotLight(0xffd57d,120,25,Math.PI/4,.55,1.5);
    goldLight.position.set(-4,7,7);scene.add(goldLight);
    const cyan=new THREE.PointLight(0x3ddaff,85,30);cyan.position.set(4,0,4);scene.add(cyan);
    const gold=new THREE.MeshStandardMaterial({color:0xdba84e,metalness:.82,roughness:.21});
    const dark=new THREE.MeshStandardMaterial({color:0x081f37,metalness:.73,roughness:.30});
    const side=new THREE.MeshStandardMaterial({color:0x09516d,metalness:.48,roughness:.31});
    const glow=new THREE.MeshStandardMaterial({color:0xfdd987,metalness:.45,roughness:.19,emissive:0xd79120,emissiveIntensity:.33});
    const activeMat=new THREE.MeshStandardMaterial({color:0x25c8c9,metalness:.32,roughness:.22,emissive:0x03849c,emissiveIntensity:.5});
    assets.push(gold,dark,side,glow,activeMat);
    const world=new THREE.Group();scene.add(world);
    const object=(geo:any,material:any,parent:any,x=0,y=0,z=0,index?:number)=>{
      const mesh=new THREE.Mesh(geo,material);
      mesh.position.set(x,y,z);parent.add(mesh);assets.push(geo);
      if(index!==undefined)mesh.userData.boxIndex=index;
      return mesh;
    };
    // The exact nine meshes of the user-selected Agustín Hönnun Sci-Fi Crate,
    // repacked without 4K textures. One geometry shared across all boxes.
    // If decompression fails, preserve the existing working accessible vault.
    const sourceParts=await loadArenaCrateGeometry(THREE).catch(error=>{
      console.warn('Original Sci-Fi Crate geometry unavailable; retaining fallback.',error);
      return null;
    });
    if(gone){for(const part of sourceParts||[])part.geometry.dispose();return;}
    if(sourceParts)setAuthentic(true);
    for(const part of sourceParts||[])assets.push(part.geometry);
    const crateBodyMat=new THREE.MeshStandardMaterial({color:0x0b2d4a,metalness:.63,roughness:.35});
    const crateFrameMat=new THREE.MeshStandardMaterial({color:0x36849f,metalness:.87,roughness:.25});
    const crateBronzeMat=new THREE.MeshStandardMaterial({color:0xb9a070,metalness:.85,roughness:.28});
    const crateStrapMat=new THREE.MeshStandardMaterial({color:0x1b6872,metalness:.69,roughness:.30});
    assets.push(crateBodyMat,crateFrameMat,crateBronzeMat,crateStrapMat);
    const count=items.length,columns=Math.min(5,Math.ceil(Math.sqrt(count*1.5))),rows=Math.ceil(count/columns);
    const w=1.46,h=1.32,spacingX=1.75,spacingY=1.75;
    const crates:Array<{root:any;lid:any;gold:any;index:number;open:number;signal?:any}>=[];
    for(let i=0;i<count;i++){
      const col=i%columns,row=Math.floor(i/columns);
      const x=(col-(Math.min(columns,count)-1)/2)*spacingX;
      const y=((rows-1)/2-row)*spacingY;
      const body=new THREE.Group();world.add(body);body.position.set(x,y,0);
      let lid=new THREE.Group(),signal:any;
      if(sourceParts){
        // Source is Z-up in its original FBX, but its glTF world transforms
        // have already been applied to the packed Y-up geometry.
        const assembly=new THREE.Group();
        assembly.scale.setScalar(2.02);
        assembly.position.set(0,-.55,0);
        body.add(assembly);
        // Back hinge: rotate actual top/cover/handle/light geometry rather than
        // a temporary cube. All pieces remain real meshes from the GLB.
        lid.position.set(0,.615,-.30);
        assembly.add(lid);
        signal=new THREE.MeshStandardMaterial({
          color:0x17b59a,metalness:.33,roughness:.22,
          emissive:0x00c99c,emissiveIntensity:.65
        });
        assets.push(signal);
        const moving=/^(2Top|3Cover|1Handle|6Edges|4Lights)/;
        for(const {name,geometry} of sourceParts){
          const material=name.startsWith('4Lights')?signal:
            name.startsWith('8Straps')?crateStrapMat:
            name.startsWith('5Chasis')||name.startsWith('2Top')?crateFrameMat:
            name.startsWith('7Box')||name.startsWith('9Base')?crateBodyMat:crateBronzeMat;
          const mesh=new THREE.Mesh(geometry,material);
          mesh.userData.boxIndex=i;
          if(moving.test(name)){
            mesh.position.set(0,-.615,.30);
            lid.add(mesh);
          }else assembly.add(mesh);
        }
      }else{
        // Fallback still uses the existing legacy geometry for old browsers.
        object(new THREE.BoxGeometry(w,1.02,1.08),dark,body,0,-.13,0,i);
        object(new THREE.BoxGeometry(w+.08,.13,1.16),gold,body,0,-.44,0,i);
        object(new THREE.BoxGeometry(.14,1.07,1.14),gold,body,0,-.12,0,i);
        object(new THREE.BoxGeometry(w+.03,.13,1.17),gold,body,0,.33,0,i);
        object(new THREE.BoxGeometry(.34,.32,.12),glow,body,0,-.15,.60,i);
        object(new THREE.BoxGeometry(.15,.12,.09),activeMat,body,0,-.12,.68,i);
        lid.position.set(0,.43,-.52);body.add(lid);
        object(new THREE.BoxGeometry(w+.12,.23,1.24),gold,lid,0,.03,.52,i);
        object(new THREE.BoxGeometry(1.06,.04,.78),side,lid,0,.165,.52,i);
      }
      const number=document.createElement('canvas');number.width=160;number.height=120;
      const ctx=number.getContext('2d');
      if(ctx){ctx.fillStyle='#fff1ca';ctx.font='bold 83px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1).padStart(2,'0'),80,61);
       const texture=new THREE.CanvasTexture(number);texture.colorSpace=THREE.SRGBColorSpace;
       const mat=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});
       const badge=new THREE.Sprite(mat);badge.position.set(0,-.15,.77);badge.scale.set(.54,.39,1);body.add(badge);assets.push(texture,mat);
      }
      crates.push({root:body,lid,gold:body,index:i,open:0,signal});
    }
    const stage=object(new THREE.BoxGeometry(columns*spacingX+.65,.35,rows*spacingY+.8),dark,world,0,-((rows-1)/2)*spacingY-1.1,-.58);
    const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
    const select=(event:PointerEvent)=>{
      const st=state.current;if(!st.canChoose)return;
      const b=renderer.domElement.getBoundingClientRect();
      mouse.set(((event.clientX-b.left)/b.width)*2-1,-((event.clientY-b.top)/b.height)*2+1);
      raycaster.setFromCamera(mouse,camera);
      const hits=raycaster.intersectObjects(world.children,true);
      for(const hit of hits){
        let obj:any=hit.object;
        while(obj&&obj.userData?.boxIndex===undefined)obj=obj.parent;
        const i=obj?.userData?.boxIndex;
        if(Number.isInteger(i)&&(!st.used.includes(i)||st.repeatable)){st.onOpen(i);return;}
      }
    };
    renderer.domElement.addEventListener('pointerup',select);
    renderer.domElement.addEventListener('webglcontextlost',onContextLost,false);
    let width=0,height=0,tick=0,previous=performance.now();
    const draw=(time:number)=>{
      if(gone)return;
      raf=requestAnimationFrame(draw);if(document.hidden)return;
      if(coarse&&++tick%2!==0)return;
      const rectW=Math.max(1,root.clientWidth),rectH=Math.max(1,root.clientHeight);
      if(rectW!==width||rectH!==height){width=rectW;height=rectH;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
      const dt=Math.min(.07,Math.max(0,(time-previous)/1000));previous=time;
      const st=state.current;
      for(const chest of crates){
        const official=st.used.includes(chest.index)||st.active===chest.index;
        const desired=official?1:0;
        chest.open=reduce?desired:chest.open+(desired-chest.open)*Math.min(1,dt*4.6);
        chest.lid.rotation.x=-1.17*chest.open;
        if(chest.signal)chest.signal.emissiveIntensity=st.active===chest.index?1.75:official?1.1:.48;
        chest.root.position.z=st.active===chest.index?.17:0;
      }
      if(!reduce)world.rotation.y=Math.sin(time*.00032)*.06;
      const maxDim=Math.max(columns*spacingX,rows*spacingY);
      camera.position.set(0,.35,maxDim*1.35+3.15);
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
    };
    raf=requestAnimationFrame(draw);
    return ()=>renderer?.domElement?.removeEventListener('pointerup',select);
   }catch(error){if(!gone){console.warn('3D vault could not start, keeping accessible selection.',error);setUnavailable(true);}}
  };
  void start();
  return ()=>{gone=true;cancelAnimationFrame(raf);if(renderer){renderer.domElement.removeEventListener('webglcontextlost',onContextLost);renderer.dispose();renderer.domElement.remove();}
   for(const item of assets)try{item.dispose();}catch{/* release GPU resource */}
  };
 },[items.length]);
 return <div data-source-model={authentic?'agustin-honnun-sci-fi-crate':'accessible-fallback'} className={'arena-box3d'+(unavailable?' arena-box3d--lite':'')} role="group" aria-label={ar?'صناديق الجوائز ثلاثية الأبعاد':'3D prize vault'}>
  {!unavailable&&<div className="arena-box3d__scene" aria-hidden="true" ref={ref}/>}
  <div className="arena-box3d__numbers" aria-label={ar?'اختيار الصندوق':'Choose a box'}>
  {items.map((label,i)=>{
    const exhausted=!repeatable&&used.includes(i),chosen=active===i;
    return <button type="button" key={i} className={'arena-box3d__selector'+(chosen?' arena-box3d__selector--active':'')+(exhausted?' arena-box3d__selector--used':'')}
     aria-pressed={chosen} aria-label={(ar?'صندوق رقم ':'Box number ')+(i+1)+(exhausted?(ar?' تم فتحه':' opened'):'')}
     disabled={!canChoose||exhausted} onClick={()=>onOpen(i)}>{String(i+1).padStart(2,'0')}</button>;
  })}
  </div>
  <a className="arena-box3d__credit" href="https://sketchfab.com/3d-models/sci-fi-crate-now-free-8a8f77af0de14630b94d2cda49823a74"
     target="_blank" rel="noopener noreferrer" aria-label={ar?'مصدر نموذج الصناديق ثلاثية الأبعاد':'3D crate model credit'}>
     Sci-Fi Crate by Agustín Hönnun · CC BY · Recolored for MTS Arena
  </a>
  {unavailable&&<span className="arena-box3d__lite-note">{ar?'المجسم غير متاح على الجهاز؛ اختار الصندوق من الأرقام':'3D not supported. Choose a numbered box.'}</span>}
 </div>;
}
