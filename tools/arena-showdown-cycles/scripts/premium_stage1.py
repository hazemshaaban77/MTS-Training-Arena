"""Arena Showdown — art-first CINEMATIC MASTER stage.
Standalone actual geometry, NOT a screenshot or CSS scene.
The original GLB is read solely to reuse its approved unaltered logo image.
All output is Blender 4.5 Cycles physically lit and editable.
No gameplay logic, deployment, secrets or paid assets.
"""
import bpy, math, random, os, hashlib, sys
from pathlib import Path
from mathutils import Vector
from math import pi, sin, cos
random.seed(1742)
BASE=Path(__file__).resolve().parents[1]
REPO=BASE.parents[1]
OUT=BASE/"renders"/"premium"
ASSETS=BASE/"assets"/"premium"
OUT.mkdir(parents=True,exist_ok=True)
MODEL=BASE/"models"/"Arena_Showdown_Stage1_v3.glb"
SHA="c5104ded9cfb0714bf74a89fcaf59adf4d905e3a8952560c96c9accb0f8873ba"
assert MODEL.exists() and hashlib.sha256(MODEL.read_bytes()).hexdigest()==SHA, "Authentic Arena V3 GLB mismatch"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(MODEL))
original=next((m for m in bpy.data.materials if "V3_APPROVED_LOGO_MASTHEAD" in m.name),None)
assert original is not None and original.use_nodes, "Approved embedded logo missing"
texnode=next((n for n in original.node_tree.nodes if n.type=="TEX_IMAGE" and n.image is not None),None)
assert texnode and texnode.image, "Approved source logo image is missing"
logo_img=texnode.image
print("ARENA_LOGO_SOURCE_UNCHANGED",logo_img.name,tuple(logo_img.size),flush=True)
# Reset only objects, preserving imported exact logo image data.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine="CYCLES"
scene.cycles.device="CPU"
scene.cycles.samples=int(os.getenv("SAMPLES","40"))
scene.cycles.max_bounces=6
scene.cycles.diffuse_bounces=3
scene.cycles.glossy_bounces=4
scene.render.resolution_x=int(os.getenv("RES_W","1280"))
scene.render.resolution_y=int(os.getenv("RES_H","720"))
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.image_settings.color_mode="RGB"
scene.render.film_transparent=False
scene.render.engine="CYCLES"
try:
 scene.cycles.use_denoising=True
 bpy.context.view_layer.cycles.use_denoising=True
except Exception: pass
scene.view_settings.view_transform="AgX"
try: scene.view_settings.look="AgX - Medium High Contrast"
except Exception: pass
scene.view_settings.exposure=-.20
scene.world=bpy.data.worlds.new("Studio midnight blue")
scene.world.use_nodes=True
bg=scene.world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value=(.019,.034,.082,1)
bg.inputs["Strength"].default_value=.34
def mat(name,rgb,metal=0,rough=.3,em=None,bright=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 n=m.node_tree.nodes.get("Principled BSDF")
 n.inputs["Base Color"].default_value=(*rgb,1)
 n.inputs["Metallic"].default_value=metal
 n.inputs["Roughness"].default_value=rough
 if em is not None:
  n.inputs["Emission Color"].default_value=(*em,1)
  n.inputs["Emission Strength"].default_value=bright
 return m
chrome=mat("PBR / mirror chromium",(.82,.92,1),.92,.125)
brushed=mat("PBR / satin machine aluminum",(.47,.62,.74),.84,.245)
matte=mat("PBR / electroplated stainless",(.31,.49,.61),.87,.30)
navy=mat("PBR / opaque architectural navy",(.009,.030,.080),.32,.24)
lacquer=mat("PBR / black mirror enamel",(.007,.021,.047),.58,.16)
deck=mat("PBR / dark stage floor mirror",(.009,.024,.062),.72,.145)
blue=mat("PBR / anodized sapphire blue",(.025,.20,.52),.62,.24)
green=mat("PBR / emerald anodized",(.02,.43,.20),.55,.23)
white=mat("PBR / porcelain white",(.84,.93,.99),.16,.27)
bulb=mat("PBR / warm studio bulbs",(.88,.93,1),.05,.20,(1,.91,.65),1.55)
glow_blue=mat("PBR / cobalt linear LED",(.028,.16,.43),.12,.28,(.035,.47,1.0),2.0)
glow_green=mat("PBR / emerald linear LED",(.025,.30,.14),.10,.27,(.029,.91,.40),1.7)
cold=mat("PBR / ice-white linear LED",(.68,.86,1),.16,.25,(.65,.82,1),.95)
black=mat("Audience dark clothing",(.008,.016,.032),.02,.78)
seat=mat("Audience upholstered seat",(.024,.035,.076),.12,.7)
warm=mat("Polished champagne accent",(.69,.63,.44),.68,.26)
glass=mat("Broadcast deep glass",(.014,.045,.095),.35,.13)
num=0
def tag(o,n,m=None):
 global num;num+=1;o.name="ShowdownMaster | "+n
 if m:o.data.materials.append(m)
 return o
def cub(n,xyz,whd,m,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz)
 o=bpy.context.object;o.dimensions=whd
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  b=o.modifiers.new("CNC edge profile","BEVEL");b.width=bevel;b.segments=3
  o.modifiers.new("Machined weighted normals","WEIGHTED_NORMAL")
 return tag(o,n,m)
def cyl(n,xyz,r,depth,m,verts=64,rot=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=xyz,rotation=rot or (0,0,0))
 return tag(bpy.context.object,n,m)
def tor(n,xyz,r,section,m,vertical=False):
 bpy.ops.mesh.primitive_torus_add(major_segments=104,minor_segments=12,major_radius=r,minor_radius=section,location=xyz,rotation=(pi/2,0,0) if vertical else (0,0,0))
 return tag(bpy.context.object,n,m)
def bar(n,a,b,r,m,sides=10):
 a,b=Vector(a),Vector(b);axis=b-a
 bpy.ops.mesh.primitive_cylinder_add(vertices=sides,radius=r,depth=axis.length,location=(a+b)*.5)
 o=bpy.context.object;o.rotation_euler=axis.to_track_quat("Z","Y").to_euler()
 return tag(o,n,m)
def sphere(n,xyz,r,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=r,location=xyz)
 return tag(bpy.context.object,n,m)
def arc(n,ctr,r,start,end,depth,m):
 curve=bpy.data.curves.new(n,"CURVE");curve.dimensions="3D";curve.resolution_u=12
 curve.bevel_depth=depth;curve.bevel_resolution=4
 spline=curve.splines.new("POLY");spline.points.add(70)
 for i,p in enumerate(spline.points):
  a=start+(end-start)*i/70
  p.co=(ctr[0]+r*cos(a),ctr[1],ctr[2]+r*sin(a),1)
 o=bpy.data.objects.new(n,curve);scene.collection.objects.link(o);return tag(o,n,m)
def area(n,xyz,target,c,power,w,h):
 d=bpy.data.lights.new(n,"AREA");d.shape="RECTANGLE";d.energy=power;d.color=c
 d.size=w;d.size_y=h;o=bpy.data.objects.new(n,d);scene.collection.objects.link(o)
 o.location=xyz;o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
 return o
def spot(n,xyz,target,c,power,size):
 d=bpy.data.lights.new(n,"SPOT");d.energy=power;d.color=c;d.spot_size=size;d.spot_blend=.45
 o=bpy.data.objects.new(n,d);scene.collection.objects.link(o);o.location=xyz
 o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
 return o
def image_material(name,im):
 m=bpy.data.materials.new(name);m.use_nodes=True
 nt=m.node_tree;nt.nodes.clear()
 out=nt.nodes.new("ShaderNodeOutputMaterial")
 image=nt.nodes.new("ShaderNodeTexImage");image.image=im
 emission=nt.nodes.new("ShaderNodeEmission")
 emission.inputs["Strength"].default_value=.9
 nt.links.new(image.outputs["Color"],emission.inputs["Color"])
 nt.links.new(emission.outputs[0],out.inputs["Surface"])
 return m
brand=image_material("Exact approved Arena brand pixels",logo_img)
def image_panel(n,im,x,y,z,w,h):
 p=bpy.data.meshes.new(n)
 p.from_pydata([(-w/2,0,-h/2),(w/2,0,-h/2),(w/2,0,h/2),(-w/2,0,h/2)],[],[(0,1,2,3)])
 p.update()
 uv=p.uv_layers.new()
 for poly in p.polygons:
  for idx in poly.loop_indices:
   vid=p.loops[idx].vertex_index; uv.data[idx].uv=[(0,0),(1,0),(1,1),(0,1)][vid]
 o=bpy.data.objects.new(n,p);scene.collection.objects.link(o)
 o.location=(x,y,z)
 tag(o,n,image_material("UV original "+n,im))
 return o
# 01: broad real studio shell, with polished architectural foreground.
cub("seamless black lacquer studio floor",(0,1,-.34),(36,34,.34),deck,.08)
cub("subtle stage-to-audience curved rear wall",(0,10.7,5.65),(33,.65,11.3),navy,.30)
cub("full-span rear upper chrome trim",(0,10.13,11.25),(30,.19,.20),chrome,.055)
for side in (-1,1):
 cub("sapphire side architectural wall",(side*15.3,2.3,5.0),(.6,23,10),navy,.08)
 cub("full-height chrome side light track",(side*14.8,-1.0,5),(.13,19,9.5),matte,.03)
 for z in [1.15,3.15,5.2,7.28,9.35]:
  bar("architectural studio wall bay",(side*14.68,-9,z),(side*14.68,9,z),.03,chrome)
# 02: suspended broadcast architecture: chrome rings in true 3D.
for r,z,section,m in [(5.75,10.15,.145,chrome),(5.58,10.02,.078,glow_green),
                       (5.4,9.97,.11,brushed),(5.22,9.88,.044,cold),
                       (6.06,10.52,.055,glow_blue)]:
 tor("suspended 360 degree header truss",(.0,1.22,z),r,section,m)
for i in range(12):
 a=2*pi*i/12
 x=5.65*cos(a);y=1.22+5.65*sin(a)
 bar("suspended masthead structural brace",(x,y,10.18),(x*.90,y*.9,11.9),.048,matte)
# central premium navy fascia + exact source approved logo
cub("large polished chrome header", (0,-4.65,9.0), (7.1,.48,2.18),chrome,.15)
cub("deep sapphire logo fascia", (0,-4.98,9.0),(6.74,.22,1.91),navy,.10)
cub("ceramic original-logo signboard",(0,-5.135,9.0),(4.65,.07,1.64),white,.035)
image_panel("approved logo unmodified on real fascia",logo_img,0,-5.185,9.00,4.40,1.55)
cub("emerald masthead underglow",(0,-5.13,7.90),(6.42,.10,.07),glow_green,.018)
cub("silver underglow guide",(0,-5.15,7.77),(6.72,.12,.055),chrome,.012)
# 03: overhead truss metal lattice with real studio spot fixtures.
for y in (-4.3,7.3):
 for x in (-14.5,14.5):
  pass
 for z in (11.08,11.65):
  bar("stereo lighting grid span",(-15,y,z),(15,y,z),.038,chrome)
 for x in range(-14,15,2):
  bar("ceiling lattice / truss slash",(x,y,11.08),(x+1.1,y,11.65),.027,brushed)
  bar("ceiling lattice / return",(x+1.1,y,11.65),(x+2,y,11.08),.027,brushed)
 for x in range(-12,13,3):
  c=cyl("physical hanging studio Fresnel", (x,y,10.82),.16,.36,lacquer,16)
  bulb_mesh=sphere("studio spot eye",(x,y-.12,10.71),.105,bulb)
# 04: deep panoramic 3D video walls (photo only INSIDE actual mesh/LED panels).
cityphoto=ASSETS/"night_city.jpg"
img=None
if cityphoto.exists():
 try: img=bpy.data.images.load(str(cityphoto),check_existing=True)
 except Exception as e:print("CITY_WALL_IMAGE_ERROR",str(e),flush=True)
for side in (-1,1):
 x=side*10.3
 cub("architectural media wing bezel",(x,6.45,5.2),(6.0,.45,6.75),chrome,.13)
 cub("media panel sapphire dark underglass",(x,6.08,5.2),(5.72,.13,6.47),glass,.065)
 if img:
  image_panel("publicly licensed city scene on physical LED wall",img,x,5.98,5.2,5.52,6.20)
 else:
  cub("fallback deep-blue media wall",(x,5.98,5.2),(5.55,.05,6.15),blue,.035)
 cub("vertical sapphire divider",(x-side*3.01,5.93,5.2),(.10,.12,6.71),glow_blue,.022)
 cub("media screen white top bezel",(x,5.90,8.62),(6.12,.18,.10),white,.017)
 cub("media screen green bottom bezel",(x,5.90,1.75),(6.12,.18,.13),glow_green,.018)
 # foreground 3D glass towers giving the photographed screen visual depth
 for j in range(11):
  bx=x-2.7+j*.51
  height=random.uniform(.7,2.3)
  cub("layered city silhouette in front of screen",(bx,5.76,1.9+height*.5),(.24,.18,height),navy,.012)
  for k in range(int(height/.26)):
   if random.random()>.54:
    cub("physical skyline window light",(bx,5.64,2.04+k*.25),(.055,.009,.063),bulb)
 # masthead towers physically integrated with display panels
 px=side*7.0
 cub("monolithic navy stage broadcast column",(px,1.05,5.26),(1.68,1.3,7.80),navy,.11)
 cub("chromed silver tower header",(px,.32,9.13),(1.86,.45,.22),chrome,.05)
 cub("slim emerald tower LED spine",(px-side*.87,.30,5.26),(.085,.10,7.18),glow_green,.026)
 cub("slim ice tower trim",(px+side*.86,.3,5.26),(.08,.09,7.18),cold,.026)
 cub("tower screen physical navy bezel",(px,.255,5.45),(1.46,.12,5.52),brushed,.025)
 cub("tower screen face",(px,.168,5.45),(1.33,.09,5.34),navy,.018)
 image_panel("approved source Arena logo on tower",logo_img,px,.102,5.50,1.19,2.0)
 for z in (2.30,8.66):
  cub("tower chrome cap",(px,.05,z),(1.77,.32,.21),chrome,.047)
 for k in range(11):
  sphere("side pillar machined bulb",(px-side*.90,-.06,2.4+k*.58),.064,bulb)
# 05: twin architectural silver portals behind the giant wheel.
for side in (-1,1):
 for r,m,width in [(4.27,chrome,.10),(4.12,glow_blue,.045),(3.99,brushed,.065)]:
  a0=0 if side>0 else pi/2
  a1=pi/2 if side>0 else pi
  arc("true brushed-aluminum architectural arch",(0,1.46,4.05),r,a0,a1,width,m)
 bar("arch ring architectural support",(side*4.25,1.5,0.5),(side*4.25,1.5,4.15),.12,chrome)
# 06: mechanical vertical wheel — six DEMO wedges ONLY (gameplay remains trainer-defined).
CENTER_Z=4.16
CENTER_Y=-2.27
cyl("wheel shaft 3D black rear",(0,CENTER_Y+.50,CENTER_Z),3.25,.52,lacquer,120,(pi/2,0,0))
cyl("true mechanical blue rotor",(0,CENTER_Y+.15,CENTER_Z),3.16,.34,blue,120,(pi/2,0,0))
demo_names=["سؤال","تحدي","مهمة","نقاط","جائزة","مفاجأة"]
sector_mats=[blue,white,green,blue,white,green]
def wedge(idx,rinner=.79,router=3.02,nsteps=32):
 start=pi/2-idx*2*pi/6
 end=start-2*pi/6
 verts=[]
 front=CENTER_Y-.16;back=CENTER_Y+.06
 for dep in (front,back):
  for rad in (rinner,router):
   for i in range(nsteps+1):
    a=start+(end-start)*i/nsteps
    verts.append((rad*cos(a),dep,CENTER_Z+rad*sin(a)))
 length=nsteps+1
 faces=[]
 for i in range(nsteps):
  faces.append((i,i+1,length+i+1,length+i))
  faces.append((2*length+i,3*length+i,3*length+i+1,2*length+i+1))
 for i in range(nsteps):
  faces.append((length+i,length+i+1,3*length+i+1,3*length+i))
  faces.append((i,2*length+i,2*length+i+1,i+1))
 faces.extend([(0,length,3*length,2*length),(nsteps,2*length+nsteps,3*length+nsteps,length+nsteps)])
 mesh=bpy.data.meshes.new("editable-demo-wheel-segment-"+str(idx))
 mesh.from_pydata(verts,[],faces);mesh.update()
 ob=bpy.data.objects.new("DEMO ONLY — "+demo_names[idx],mesh)
 scene.collection.objects.link(ob);tag(ob,"PBR trainer-configurable placeholder wedge "+demo_names[idx],sector_mats[idx])
 bevel=ob.modifiers.new("sector bevel machining","BEVEL");bevel.width=.025;bevel.segments=3
 ob.modifiers.new("sector face weighted normals","WEIGHTED_NORMAL")
 return ob
for i in range(6): wedge(i)
for i in range(6):
 a=pi/2-i*2*pi/6
 bar("physical radial silver sector divider",
 (cos(a)*.78,CENTER_Y-.30,CENTER_Z+sin(a)*.78),
 (cos(a)*3.04,CENTER_Y-.30,CENTER_Z+sin(a)*3.04),.033,chrome)
# deep chrome machining and rotatable raised housing
for r,th,dep,mt in [(3.20,.12,-.33,chrome),(3.32,.045,-.36,glow_blue),
                    (3.38,.073,-.20,brushed),(3.05,.028,-.40,cold),
                    (.80,.087,-.43,chrome),(.71,.03,-.50,glow_green)]:
 tor("precision-machined physical wheel bezel",(0,CENTER_Y+dep,CENTER_Z),r,th,mt,True)
for i in range(72):
 a=2*pi*i/72
 rad=3.19
 sphere("72 individually shaded cinema-light rivets",(rad*cos(a),CENTER_Y-.53,CENTER_Z+rad*sin(a)),.052,bulb)
# hub in front of sectors, original logo on raised physical insert.
cyl("brushed chrome central mechanical hub",(0,CENTER_Y-.50,CENTER_Z),.77,.21,brushed,72,(pi/2,0,0))
cyl("navy rotor hub cover",(0,CENTER_Y-.64,CENTER_Z),.65,.07,navy,72,(pi/2,0,0))
image_panel("original Arena logo embedded in machined wheel hub",logo_img,0,CENTER_Y-.697,CENTER_Z,.86,.53)
for i in range(12):
 a=2*pi*i/12
 sphere("twelve machined wheel hub microbolts",(.72*cos(a),CENTER_Y-.67,CENTER_Z+.72*sin(a)),.031,chrome)
# actual metal triangular marker above rotor, with green inset.
def triangular_pointer(n,verts,m):
 mesh=bpy.data.meshes.new(n);mesh.from_pydata(verts,[],[(0,1,2)]);mesh.update()
 ob=bpy.data.objects.new(n,mesh);scene.collection.objects.link(ob)
 return tag(ob,n,m)
triangular_pointer("stainless pointer", [(-.30,CENTER_Y-.78,7.64),(.30,CENTER_Y-.78,7.64),(0,CENTER_Y-.78,7.16)],chrome)
triangular_pointer("green pointer insert",[(-.17,CENTER_Y-.79,7.57),(.17,CENTER_Y-.79,7.57),(0,CENTER_Y-.79,7.30)],green)
# screen-based Arabic labels are prerendered with the real Cairo font and RAQM
for i,name in enumerate(demo_names):
 a=pi/2-(i+.5)*pi/3
 radius=2.10
 x=radius*cos(a);z=CENTER_Z+radius*sin(a)
 png=ASSETS/("sector_%02d.png"%i)
 if not png.exists(): raise RuntimeError("Cairo text texture absent: "+str(png))
 im=bpy.data.images.load(str(png),check_existing=True)
 # legible 3D decal, image material alpha mixed with transparent BSDF
 m=bpy.data.materials.new("Live-text placeholder Cairo "+name);m.use_nodes=True
 nt=m.node_tree;nt.nodes.clear()
 tex=nt.nodes.new("ShaderNodeTexImage");tex.image=im
 trans=nt.nodes.new("ShaderNodeBsdfTransparent")
 em=nt.nodes.new("ShaderNodeEmission");em.inputs["Strength"].default_value=1.0
 mix=nt.nodes.new("ShaderNodeMixShader");out=nt.nodes.new("ShaderNodeOutputMaterial")
 nt.links.new(tex.outputs["Color"],em.inputs["Color"])
 nt.links.new(tex.outputs["Alpha"],mix.inputs[0])
 nt.links.new(trans.outputs[0],mix.inputs[1])
 nt.links.new(em.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs["Surface"])
 # UV plane on upright wheel, facing camera negative Y
 mesh=bpy.data.meshes.new("Cairo label UV")
 w=1.72;h=.80
 mesh.from_pydata([(-w/2,0,-h/2),(w/2,0,-h/2),(w/2,0,h/2),(-w/2,0,h/2)],[],[(0,1,2,3)])
 mesh.update();uv=mesh.uv_layers.new()
 for f in mesh.polygons:
  for li in f.loop_indices:
   uv.data[li].uv=[(0,0),(1,0),(1,1),(0,1)][mesh.loops[li].vertex_index]
 o=bpy.data.objects.new("DEMO layout only / trainer defines text: "+name,mesh);scene.collection.objects.link(o)
 o.location=(x,CENTER_Y-.575,z);tag(o,"legible Cairo type "+name,m)
# 07: triple-layer true stage platform and reflective runway.
for radius,z,d,material in [(4.50,.03,.34,navy),(4.28,.21,.22,chrome),
                             (4.05,.31,.15,deck),(3.78,.42,.09,navy)]:
 cyl("circular gameshow broadcast podium",(0,-1.22,z),radius,d,material,128)
for rad,z,th,material in [(4.43,.20,.039,glow_blue),(4.15,.32,.036,cold),
                           (3.78,.48,.033,glow_green)]:
 tor("circular stage real luminous raceway",(0,-1.22,z),rad,th,material)
cub("floating reflective runner / bridge",(0,-8.8,-.05),(6.4,13.8,.13),deck,.13)
for side in (-1,1):
 cub("floating runway brushed-chrome track",(side*3.12,-8.5,.07),(.11,13.7,.075),chrome,.033)
 cub("runway live blue light track",(side*2.97,-8.5,.087),(.058,13.7,.022),glow_blue)
for rad,material in [(4.16,glow_blue),(3.89,chrome),(3.65,glow_green)]:
 tor("foreground high-gloss circular floor emblem",(0,-10.6,.06),rad,.035,material)
# 08: audience galleries with physical seating and soft accents, no fake crowd image
for side in (-1,1):
 for tier in range(4):
  x=side*(8.65+tier*.9)
  floor_z=.25+tier*.55
  cub("theatre audience gallery riser",(x,-1.3,floor_z),(1.47,11.4,.23),navy,.025)
  for j in range(15):
   y=-6.2+j*.65
   cub("individual audience theater seat",(x,y,floor_z+.23),(.54,.46,.45),seat,.035)
   if random.random()>.21:
    ob=sphere("shaded audience spectator head",(x,y,floor_z+.86),.155,black)
    ob.scale=(.8,.7,1)
    ob=sphere("audience shirt silhouette",(x,y,floor_z+.56),.23,black)
    ob.scale=(.85,.54,1.05)
  cub("gallery metallic step riser",(x-side*.71,-1.3,floor_z+.27),(.055,11.4,.11),glow_blue)
# 09: presenter consoles / training-studio technology.
for side in (-1,1):
 for j in range(4):
  y=-6.2+j*1.6
  x=side*(6.3+j*.23)
  cub("competition podium pedestal",(x,y,.56),(1.20,.85,1.12),navy,.07)
  cub("competition chrome top",(x,y,.99),(1.28,.98,.16),chrome,.04)
  cub("competition screen panel",(x,y-.43,.57),(1.04,.12,.63),blue,.025)
  cub("competition console green signature",(x,y-.51,.17),(1.09,.05,.07),glow_green)
# 10: authentic studio lighting, not baked beams.
area("hero giant white softbox",(-7.5,-11,12),(0,-1,4.7),(.9,.96,1),2800,10,6)
area("chrome long-reflection strip",(2.3,-9.5,14),(0,0,5),(.92,.96,1),2250,15,1.2)
area("blue edge key",(9.8,-4,9),(0,0,4),(.22,.52,1),950,6,7)
area("emerald mid-stage rim",(-9,3,8),(0,0,4),(.24,1,.55),750,7,7)
area("forecourt white card",(0,-16,8.7),(0,-6,.5),(.86,.95,1),1100,9,4)
for i in range(12):
 x=-12+i*2.15
 spot("concert moving head + blue Fresnel "+str(i),(x,-4.0,11.1),(x*.47,1.5,0),(.55,.8,1),240,pi/6)
# Elegant practical strip highlights, not a fake photograph of a different scene.
def camera(n,xyz,target,lens):
 d=bpy.data.cameras.new(n);o=bpy.data.objects.new(n,d);scene.collection.objects.link(o)
 o.location=xyz;o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
 d.lens=lens;d.type="PERSP";return o
hero=camera("CINEMA / approved Showdown hero",(0,-27.2,6.1),(0,-.3,5.0),42)
detail=camera("CINEMA / mechanical wheel closeup",(4.5,-14.3,5.6),(0,-1.2,4.7),49)
entrance=camera("CINEMA / prestige reveal wide",(-9,-32,9),(0,.6,5.0),36)
scene.camera=hero
print("ARENA_STAGE_MASTER_GEOMETRY_OBJECTS",num,flush=True)
print("ARENA_CAIRO_RAQM_TEXTURES",len(demo_names),flush=True)
blend=OUT/"Arena_Showdown_Stage1_Master.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
MODE=os.getenv("ARENA_RENDER_MODE","hero")
shots=[("Hero",hero)] if MODE=="hero" else [("Hero",hero),("Wheel",detail),("Entrance",entrance)]
for name,cam in shots:
 scene.camera=cam
 scene.render.filepath=str(OUT/("Arena_Showdown_Master_%s.png"%name))
 bpy.ops.render.render(write_still=True)
 print("ARENA_RENDER_FRAME_COMPLETE",name,flush=True)
print("ARENA_STAGE1_MASTER_RENDER_COMPLETE",len(shots),flush=True)
