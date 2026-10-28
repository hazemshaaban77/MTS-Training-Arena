"""Stage 1 / V6 PREMIUM HERO lookdev. Real editable Blender geometry.
Art-only visualization: six example Cairo labels are NOT a live trainer-wheel.
The approved user-logo image is referenced from the unchanged original V3 GLB.
"""
import math
import bpy
from pathlib import Path
from mathutils import Vector

scene=bpy.context.scene
V6_ADDED=[]
def newmat(name,color,metal=.0,rough=.3,emission=None,strength=0):
    m=bpy.data.materials.new("Hero V6 | "+name);m.use_nodes=True
    bs=m.node_tree.nodes.get("Principled BSDF")
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metal
    bs.inputs['Roughness'].default_value=rough
    if emission:
        bs.inputs['Emission Color'].default_value=(*emission,1)
        bs.inputs['Emission Strength'].default_value=strength
    return m
navy=newmat('navy black lacquer',(.005,.019,.055),.44,.27)
mid=newmat('cobalt deep blue',(.014,.112,.39),.43,.23)
green=newmat('emerald enamel',(.024,.34,.19),.38,.24)
silver=newmat('machined satin chrome',(.52,.68,.81),.87,.24)
mirror=newmat('white polished chrome',(.78,.89,.98),.94,.13)
white=newmat('porcelain',(.86,.94,1),.14,.27)
cyan=newmat('neon cyan light',(.028,.26,.65),.12,.38,(.035,.43,1.0),1.05)
lime=newmat('LED emerald light',(.02,.34,.16),.10,.38,(.05,.88,.44),1.05)
floor=newmat('black mirrored floor',(.009,.022,.045),.66,.14)

def register(ob,label,mat=None):
    ob.name="PREMIUM_HERO_"+label
    if mat:ob.data.materials.append(mat)
    V6_ADDED.append(ob)
    return ob
def box(name,pos,scale,mat,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    obj=bpy.context.object
    obj.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=obj.modifiers.new("Product quality round edges","BEVEL");m.width=bevel;m.segments=3
        obj.modifiers.new("Weighted normals","WEIGHTED_NORMAL")
    return register(obj,name,mat)
def ring(name,pos,r,t,mat,vertical=False):
    bpy.ops.mesh.primitive_torus_add(major_segments=128,minor_segments=12,location=pos,major_radius=r,minor_radius=t)
    ob=bpy.context.object
    if vertical:ob.rotation_euler.x=math.pi/2
    return register(ob,name,mat)
def pipe(name,start,end,r,mat):
    a,b=Vector(start),Vector(end)
    delta=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=r,depth=delta.length,location=(a+b)/2)
    ob=bpy.context.object;ob.rotation_euler=delta.to_track_quat("Z","Y").to_euler()
    return register(ob,name,mat)
def curve_line(name,coords,width,mat):
    cv=bpy.data.curves.new(name,"CURVE");cv.dimensions='3D';cv.resolution_u=24
    sp=cv.splines.new('POLY');sp.points.add(len(coords)-1)
    for pt,co in zip(sp.points,coords):pt.co=(*co,1)
    cv.bevel_depth=width;cv.bevel_resolution=3
    ob=bpy.data.objects.new(name,cv);scene.collection.objects.link(ob)
    return register(ob,name,mat)

# The former flat rectangular high banner is masked: the real design needs a
# suspended CANOPY, not a giant lightbox hiding the circular stage.
for o in list(scene.objects):
    if any(k in o.name for k in (
        "V5 large porcelain branding screen","V5 hero-logo metallic superstructure",
        "V5 ORIGINAL APPROVED Arena logo full pixels",
        "V5 side brushed-aluminum logo bevel",
        "V5 blue fascia lower metal reveal","V5 slim green signature underline",
        "V4_branded masthead monolith","V4_Original_Arena_Approved_Logo_Masthead",
        "V4_masthead chrome top lip","V4_masthead chrome lower lip")):
        o.hide_render=True

# 1) Cylindrical suspended broadcast masthead, arched around the wheel:
# Actual radial depth, chrome end caps and smoothly illuminated ring.
def curved_panel(name,r1,r2,zlo,zhi,ma,theta_lo=-2.42,theta_hi=-.72,n=52):
    vertices=[]; faces=[]
    for rad in (r1,r2):
        for z in (zlo,zhi):
            for i in range(n+1):
                a=theta_lo+(theta_hi-theta_lo)*i/n
                vertices.append((rad*math.cos(a),rad*math.sin(a),z))
    K=n+1
    for i in range(n):
        faces.extend([(i,i+1,K+i+1,K+i),
                      (2*K+i,3*K+i,3*K+i+1,2*K+i+1),
                      (K+i,K+i+1,3*K+i+1,3*K+i),
                      (i,2*K+i,2*K+i+1,i+1)])
    faces.extend([(0,K,3*K,2*K),(n,2*K+n,3*K+n,K+n)])
    me=bpy.data.meshes.new("Premium arched zinc alloy");me.from_pydata(vertices,[],faces);me.update()
    ob=bpy.data.objects.new("Premium canopy",me)
    scene.collection.objects.link(ob)
    return register(ob,name,ma)
curved_panel("suspended architectural blue fascia",5.46,5.60,8.48,10.15,navy)
for z,mat,th in [(8.43,mirror,.070),(8.56,lime,.045),(10.19,mirror,.073),(10.29,cyan,.038)]:
    coords=[]
    for k in range(77):
        a=-2.42+1.70*k/76
        coords.append((5.55*math.cos(a),5.55*math.sin(a),z))
    curve_line("machined suspended fascia edge",coords,th,mat)
for r,t,z,mt in [(4.1,.065,8.43,silver),(4.18,.033,8.35,lime),(4.47,.040,10.34,mirror),(4.57,.031,10.38,cyan)]:
    ring("suspended halo underplate",(0,0,z),r,t,mt)
for sign in (-1,1):
    pipe("load bearing suspension rod",(sign*2.8,0,10.38),(sign*3.1,0,13.4),.085,silver)
    box("polished masthead end cap",(sign*3.79,-3.74,9.27),(.13,.31,1.82),mirror,.03)

# Approved identity from the *original model*, not text synthesized as logo.
origmat=next((m for m in bpy.data.materials if 'V3_APPROVED_LOGO_MASTHEAD' in m.name),None)
texnode=next((node for node in origmat.node_tree.nodes
              if node.type=='TEX_IMAGE' and node.image),None) if origmat and origmat.use_nodes else None
if texnode is None:raise RuntimeError("Missing the original embedded owner-approved Arena identity texture")
logo=bpy.data.materials.new("PREMIUM_HERO - ORIGINAL approved Arena image")
logo.use_nodes=True;nodes=logo.node_tree.nodes;nodes.clear()
out=nodes.new("ShaderNodeOutputMaterial");img=nodes.new("ShaderNodeTexImage");img.image=texnode.image
em=nodes.new("ShaderNodeEmission");em.inputs["Strength"].default_value=1.05
trans=nodes.new("ShaderNodeBsdfTransparent");mix=nodes.new("ShaderNodeMixShader")
logo.node_tree.links.new(img.outputs["Color"],em.inputs["Color"])
logo.node_tree.links.new(img.outputs["Alpha"],mix.inputs[0])
logo.node_tree.links.new(trans.outputs[0],mix.inputs[1])
logo.node_tree.links.new(em.outputs[0],mix.inputs[2])
logo.node_tree.links.new(mix.outputs[0],out.inputs["Surface"])
bpy.ops.mesh.primitive_plane_add(size=1,location=(0,-5.77,9.25))
obj=bpy.context.object;obj.rotation_euler.x=math.pi/2
obj.scale=(4.65,1.57,1);register(obj,"authentic original logo on curved canopy",logo)
print("V6_ORIGINAL_APPROVED_LOGO_FROM_V3",img.image.name,flush=True)

# 2) The actual mechanical dial. Precise separate 3D wedge metal faces,
# thick machined chrome ring, real bolts, depth and single stage pointer.
CX,CZ=0,4.06
materials=[mid,white,green,mid,white,green]
N=6
for i in range(N):
    a0=math.pi/2-(i-.5)*math.tau/N
    a1=math.pi/2-(i+.5)*math.tau/N
    segs=14;pts=[]
    for y in (-1.99,-2.035):
        for r in (.64,2.39):
            for j in range(segs+1):
                a=a0+(a1-a0)*j/segs
                pts.append((r*math.cos(a),y,CZ+r*math.sin(a)))
    K=segs+1;faces=[]
    for j in range(segs):
        faces.append((j,j+1,K+j+1,K+j))
        faces.append((2*K+j,3*K+j,3*K+j+1,2*K+j+1))
        faces.append((j,2*K+j,2*K+j+1,j+1))
        faces.append((K+j,K+j+1,3*K+j+1,3*K+j))
    faces.append((0,K,3*K,2*K));faces.append((segs,2*K+segs,3*K+segs,K+segs))
    me=bpy.data.meshes.new('premium radial wedge');me.from_pydata(pts,[],faces);me.update()
    ob=bpy.data.objects.new('premium radial wedge',me);scene.collection.objects.link(ob)
    register(ob,'physically extruded dial wedge %02d'%i,materials[i])
    boundary=a0
    pipe('sector chamfer delimiter',
         (.67*math.cos(boundary),-2.08,CZ+.67*math.sin(boundary)),
         (2.43*math.cos(boundary),-2.08,CZ+2.43*math.sin(boundary)),.027,mirror)
for r,y,t,mat in [(2.46,-2.12,.10,mirror),(2.55,-2.05,.058,navy),(2.67,-2.11,.092,silver),
                   (2.79,-2.13,.075,mirror),(2.85,-2.13,.026,cyan),(.66,-2.17,.10,mirror)]:
    ring('precision brushed bearing / glossy bezel',(CX,y,CZ),r,t,mat,True)
for k in range(42):
    a=math.tau*k/42; x=2.75*math.cos(a);z=CZ+2.75*math.sin(a)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.047,location=(x,-2.20,z))
    register(bpy.context.object,'precise glass bezel spotlight',white if k%3==0 else cyan)
bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.25,radius2=0,depth=.66,location=(0,-2.36,7.05))
pointer=register(bpy.context.object,'large true machine selection arrow',mirror)
pointer.rotation_euler.z=math.pi

# Alpha transparent Cairo-shaped render labels as 3D texture meshes.
label_path=PROJECT/'labels'
for i in range(N):
    path=label_path/('sector-%d.png'%i)
    if not path.exists():raise FileNotFoundError(str(path))
    image=bpy.data.images.load(str(path),check_existing=True)
    imat=bpy.data.materials.new('PREMIUM_HERO_Cairo_%d'%i);imat.use_nodes=True
    nd=imat.node_tree.nodes;nd.clear()
    tex=nd.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Linear'
    tr=nd.new('ShaderNodeBsdfTransparent')
    emiss=nd.new('ShaderNodeEmission');emiss.inputs['Strength'].default_value=1.25
    mix=nd.new('ShaderNodeMixShader');out=nd.new('ShaderNodeOutputMaterial')
    links=imat.node_tree.links
    links.new(tex.outputs['Color'],emiss.inputs['Color'])
    links.new(tex.outputs['Alpha'],mix.inputs[0])
    links.new(tr.outputs[0],mix.inputs[1]);links.new(emiss.outputs[0],mix.inputs[2])
    links.new(mix.outputs[0],out.inputs['Surface'])
    midangle=math.pi/2-i*math.tau/N
    x=1.62*math.cos(midangle);z=CZ+1.62*math.sin(midangle)
    bpy.ops.mesh.primitive_plane_add(size=1,location=(x,-2.14,z))
    ob=bpy.context.object;ob.rotation_euler.x=math.pi/2
    ob.scale=(.99,.53,1)
    register(ob,'real Cairo typeset example sector %d'%i,imat)

# Clean branded floor layers reflect actual front bumper and wheel chrome.
for sign in (-1,1):
    box('broadcast apron polished chrome rail',(sign*3.42,-7.90,-.038),(.08,6.5,.070),silver,.02)
    box('emerald stage runway optic',(sign*3.25,-7.9,-.009),(.031,6.3,.026),lime)
    for j in range(6):
        box('audience stair luminous strip',(sign*(6.42+j*.43),-3.12,.65+j*.24),(.5,2.85,.048),cyan)
ring('physical runway metallic footlights',(0,-8.1,-.054),4.67,.047,mirror)
ring('blue embedded lens',(0,-8.1,-.030),4.51,.022,cyan)

# 3) Professional broadcast lighting, subtle volumetric stage haze.
try:
    vol=bpy.data.materials.new('PREMIUM HERO cinematic stage haze');vol.use_nodes=True
    nodes=vol.node_tree.nodes;nodes.clear()
    output=nodes.new('ShaderNodeOutputMaterial')
    pv=nodes.new('ShaderNodeVolumePrincipled');pv.inputs['Density'].default_value=.004
    pv.inputs['Anisotropy'].default_value=.30
    vol.node_tree.links.new(pv.outputs['Volume'],output.inputs['Volume'])
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,6))
    haz=bpy.context.object;haz.dimensions=(28,24,16)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    register(haz,'low density actual volumetric atmosphere',vol)
except Exception as exc:
    print('V6_HAZE_UNAVAILABLE',str(exc),flush=True)
for n in range(10):
    sign=(-1 if n%2==0 else 1)
    x=sign*(2.1+(n//2)*1.3)
    z=13.1
    area('V6 gallery professional soft spots',(x,-1.3,z),(x*.55,0,4.8),
         (.5,.75,1.0) if n%3 else (.43,1.0,.65),235,2.2,2.2)
for ob in scene.objects:
    if ob.type=='LIGHT' and ob.name in ('Chrome reflection strip','Mega softbox left'):
        ob.data.energy*=.78

# Full HD projector composition (review at 1600x900), subject dominant, logo visible.
cam.location=(0,-25.5,6.0)
aim(cam,(0,-.9,4.84))
cam.data.lens=37
scene.render.resolution_x=1440
scene.render.resolution_y=810
scene.cycles.samples=28
scene.cycles.volume_bounces=1
scene.view_settings.exposure=-.43
try:
    scene.cycles.use_denoising=True
    bpy.context.view_layer.cycles.use_denoising=True
except Exception:pass
print('V6_HERO_ADDED_EDITABLE_OBJECTS',len(V6_ADDED),flush=True)
print('V6_HERO_NOT_LIVE_TRAINER_SECTORS',flush=True)
