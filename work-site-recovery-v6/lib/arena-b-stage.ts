/**
 * Physical architectural stage for owner-approved Design B: two chrome arches,
 * a raised white MTS masthead, 3D side banners and a blue illuminated podium.
 * Shared by the animated intro and the playable wheel: NO static image stage.
 */
export function addArenaBArchitecture(T:any,scene:any,assets:Array<{dispose:()=>void}>,intro=false){
 const root=new T.Group();root.name='arena-b-architecture';scene.add(root);
 const silver=new T.MeshStandardMaterial({color:0xd7e7f3,metalness:.83,roughness:.19});
 const chrome=new T.MeshStandardMaterial({color:0x86aec5,metalness:.84,roughness:.23});
 const navy=new T.MeshStandardMaterial({color:0x072247,metalness:.71,roughness:.32});
 const green=new T.MeshStandardMaterial({color:0x20ad70,metalness:.35,roughness:.24,emissive:0x087949,emissiveIntensity:.33});
 const blue=new T.MeshStandardMaterial({color:0x158ce3,metalness:.4,roughness:.17,emissive:0x095daa,emissiveIntensity:.42});
 const white=new T.MeshStandardMaterial({color:0xf3f9fe,metalness:.27,roughness:.27});
 assets.push(silver,chrome,navy,green,blue,white);
 const add=(geo:any,mat:any,x:number,y:number,z:number,parent=root)=>{
  const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);assets.push(geo);return m;
 };
 // Two enormous silver architectural rings behind the fortune wheel.
 add(new T.TorusGeometry(3.39,.16,14,120),chrome,0,.19,-2.3);
 add(new T.TorusGeometry(3.23,.06,12,120),silver,0,.19,-2.08);
 add(new T.TorusGeometry(3.48,.018,8,120),blue,0,.19,-2.19);
 for(const x of [-3.37,3.37]){
  add(new T.BoxGeometry(.21,3.72,.47),chrome,x,-1.3,-2.3);
  add(new T.BoxGeometry(.08,3.59,.2),blue,x,-1.3,-2.04);
  const banner=add(new T.BoxGeometry(.83,3.6,.18),navy,x*1.27,-.3,-2.75);
  add(new T.BoxGeometry(.82,.20,.20),silver,x*1.27,1.55,-2.7);
  add(new T.BoxGeometry(.82,.20,.20),silver,x*1.27,-2.14,-2.7);
  const stripe=add(new T.BoxGeometry(.84,.27,.04),green,x*1.27,-1.22,-2.59);
  stripe.rotation.z=x<0?-.38:.38;
  const lamp=add(new T.CylinderGeometry(.13,.22,.87,16),chrome,x*1.15,-2.7,-1.4);
  add(new T.BoxGeometry(.46,.11,.46),blue,x*1.15,-3.18,-1.4);
 }
 // White elevated identity monolith of the actual chosen B composition.
 add(new T.BoxGeometry(2.17,1.5,.44),white,0,3.21,-2.15);
 add(new T.BoxGeometry(2.24,.12,.49),chrome,0,2.46,-2.05);
 const logo=document.createElement('canvas');logo.width=512;logo.height=360;
 const ctx=logo.getContext('2d');
 if(ctx){
  ctx.clearRect(0,0,512,360);ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#0c5796';ctx.font='900 142px Cairo,Arial,sans-serif';ctx.fillText('MTS',256,139);
  ctx.font='800 65px Cairo,Arial,sans-serif';ctx.fillText('TRAINING',256,231);
  ctx.fillStyle='#128f80';ctx.font='800 84px Cairo,Arial,sans-serif';ctx.fillText('ARENA',256,301);
  const texture=new T.CanvasTexture(logo);texture.colorSpace=T.SRGBColorSpace;
  const mat=new T.MeshBasicMaterial({map:texture,transparent:true,side:T.DoubleSide,depthWrite:false});
  const sign=add(new T.PlaneGeometry(1.83,1.32),mat,0,3.21,-1.91);assets.push(texture,mat);
 }
 const pointer=new T.Mesh(new T.ConeGeometry(.18,.47,4),green);
 pointer.name='cinema-b-stage-top-pointer';pointer.position.set(0,2.37,-.1);pointer.rotation.z=Math.PI;
 root.add(pointer);assets.push(pointer.geometry);
 // Layered circular platform, correctly horizontal and raised like B.
 const base=add(new T.CylinderGeometry(3.39,3.5,.21,92),navy,0,-3.44,-1.0);
 const tier=add(new T.CylinderGeometry(3.15,3.27,.19,92),chrome,0,-3.24,-1.0);
 const top=add(new T.CylinderGeometry(2.96,3.04,.12,92),navy,0,-3.08,-1.0);
 for(const [radius,y,material] of [[3.40,-3.32,blue],[3.1,-3.11,silver],[2.79,-3.0,blue]] as const){
  const led=add(new T.TorusGeometry(radius,.046,10,112),material,0,y,-1.0);
  led.rotation.x=Math.PI/2;
 }
 const fill=new T.PointLight(0x31a8ec,intro?0:60,24);
 fill.position.set(0,-1.8,1.7);scene.add(fill);
 const greenLight=new T.PointLight(0x49e3a2,intro?0:36,24);
 greenLight.position.set(3.8,-1,2.1);scene.add(greenLight);
 const cyanSpot=new T.SpotLight(0xd5f5ff,intro?0:45,30,Math.PI/4,.67,1.5);
 cyanSpot.position.set(-3.2,5,5.5);scene.add(cyanSpot);
 const illuminate=(amount:number)=>{
  const t=Math.max(0,Math.min(1,amount));fill.intensity=60*t;greenLight.intensity=36*t;cyanSpot.intensity=45*t;
 };
 return {root,illuminate};
}
