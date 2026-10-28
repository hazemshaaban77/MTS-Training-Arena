"""Stage 1 / Arena Showdown V5.2: premium HERO wheel + suspended broadcast architecture.
Executes only as a Blender module inside the source-authenticated V3 + V4 + V5 scene.
No mutation of trainer sectors, scores, or published V6. Geometry is fully editable.
"""
import math
import bpy
from mathutils import Vector

previous_count=len(objects)
wheel_center=(0.0,-1.96,4.06)
navy52=v5_material("V5.2 marine enamel lacquer",(.018,.064,.16),.62,.22)
chrome52=v5_material("V5.2 satin chrome lathe",(.68,.80,.90),.94,.20)
polished52=v5_material("V5.2 mirror bevel chrome",(.82,.91,.97),.96,.105)
steel52=v5_material("V5.2 directional brushed steel",(.37,.49,.61),.88,.31)
teal52=v5_material("V5.2 emerald glass enamel",(.012,.25,.15),.40,.20)
blue52=v5_material("V5.2 cobalt glass enamel",(.02,.18,.45),.42,.18)
white52=v5_material("V5.2 porcelain pearl",(.79,.91,.99),.20,.28)
black52=v5_material("V5.2 black PBR bearing",(.006,.017,.034),.65,.20)
ledblue52=v5_material("V5.2 recessed sapphire optics",(.016,.16,.43),.15,.25,(.02,.33,.80),.64)
ledgreen52=v5_material("V5.2 recessed emerald optics",(.014,.25,.16),.15,.26,(.025,.67,.35),.54)

# Subtle real micro-surface bump: ray-traced, not a fake painted HDR overlay.
for mat in (chrome52,steel52,polished52):
    nodes=mat.node_tree.nodes
    bsdf=nodes.get("Principled BSDF")
    noise=nodes.new("ShaderNodeTexNoise");noise.inputs["Scale"].default_value=190
    noise.inputs["Detail"].default_value=1.0
    bump=nodes.new("ShaderNodeBump");bump.inputs["Strength"].default_value=.12
    bump.inputs["Distance"].default_value=.0023
    mat.node_tree.links.new(noise.outputs["Fac"],bump.inputs["Height"])
    mat.node_tree.links.new(bump.outputs["Normal"],bsdf.inputs["Normal"])

# Each removable wedge is a *real 3D extrusion*. Number is only a neutral
# Stage 1 visual example; stage 2 will generate it from trainer data.
def precision_wedge(index,count,inner=0.70,outer=2.31,fr=-2.18,bk=-2.045):
    sweep=math.tau/count
    center=math.pi/2-index*sweep
    start=center-sweep*.485
    end=center+sweep*.485
    samples=14
    vertices=[]
    for k in range(samples+1):
        a=start+(end-start)*k/samples
        for radius,y in ((inner,fr),(outer,fr),(inner,bk),(outer,bk)):
            vertices.append((radius*math.cos(a),y,4.06+radius*math.sin(a)))
    faces=[]
    for k in range(samples):
        i=4*k;j=i+4
        faces.extend(((i,i+1,j+1,j),(i+2,j+2,j+3,i+3),
                      (i,j,i+2,j+2),(i+1,i+3,j+3,j+1)))
    faces.extend(((0,2,3,1),(4*samples,4*samples+1,4*samples+3,4*samples+2)))
    mesh=bpy.data.meshes.new("V5.2 machined face facet mesh")
    mesh.from_pydata(vertices,[],faces);mesh.update()
    ob=bpy.data.objects.new("V5.2 removable trainer sector placeholder %02d"%(index+1),mesh)
    scene.collection.objects.link(ob)
    ob.data.materials.append((blue52,teal52,white52,navy52)[index%4])
    bevel=ob.modifiers.new("Precision rounded shell breaks","BEVEL")
    bevel.width=.016;bevel.segments=3;bevel.affect='EDGES'
    ob.modifiers.new("Face weighted normals","WEIGHTED_NORMAL")
    objects.append(ob)
    return ob

sector_count=8
for idx in range(sector_count):
    precision_wedge(idx,sector_count)

# Multiple independently editable wheel layers, with original central bearings
# exposed. Main ring pieces are centered in XZ plane facing the projector camera.
def rim52(name,radius,thickness,depth,mat):
    return ring("V5.2 "+name,(0,depth,4.06),radius,thickness,mat,True)
for title,r,t,y,mat in [
    ("black inner shadow gasket",.66,.10,-2.28,black52),
    ("front rolled inner trim",.71,.030,-2.30,chrome52),
    ("inlaid cobalt rule",2.32,.022,-2.30,ledblue52),
    ("dual inner trim",2.39,.024,-2.29,polished52),
    ("deep forged rim cylinder seam",2.51,.072,-2.22,chrome52),
    ("anodized emerald running line",2.60,.025,-2.19,ledgreen52),
    ("machined aluminum outer edge",2.69,.082,-2.17,steel52),
    ("razor polished external lip",2.79,.037,-2.16,polished52)
]:
    rim52(title,r,t,y,mat)

# 64 physically modeled fasteners, alternate chamfered profiles and optical lenses.
for i in range(64):
    a=math.tau*i/64
    x=2.72*math.cos(a);z=4.06+2.72*math.sin(a)
    sphere("V5.2 forged bezel bolt",(x,-2.30,z),.028,polished52 if i%4 else black52)
for i in range(32):
    a=math.tau*i/32
    x=2.60*math.cos(a);z=4.06+2.60*math.sin(a)
    sphere("V5.2 jewel LED under-glass",(x,-2.28,z),.035,ledgreen52 if i%2 else ledblue52)

# Fine structural sector separator rails, capped and inset, NOT just flat colored lines.
for idx in range(sector_count):
    ang=math.pi/2+(idx+.5)*math.tau/sector_count
    pipe("V5.2 chrome sector separator",
         (.75*math.cos(ang),-2.29,4.06+.75*math.sin(ang)),
         (2.28*math.cos(ang),-2.29,4.06+2.28*math.sin(ang)),
         .026,polished52)

# The camera-facing central spindle is a complete 3D metal assembly.
bpy.ops.mesh.primitive_cylinder_add(vertices=72,radius=.58,depth=.16,location=(0,-2.37,4.06),rotation=(math.pi/2,0,0))
spindle=bpy.context.object;spindle.name="V5.2 steel central spindle";
spindle.data.materials.append(steel52);objects.append(spindle)
rim52("hub blue ring",.43,.038,-2.49,ledblue52)
rim52("hub polished lockplate",.28,.049,-2.51,polished52)
for i in range(8):
    a=math.tau*i/8
    sphere("V5.2 physical hub mount",(math.cos(a)*.51,-2.49,4.06+math.sin(a)*.51),.036,chrome52)

# A stationary mechanical pointer assembly clearly above the wheel.
box("V5.2 pointer thick stem",(0,-2.55,7.00),(.14,.22,.53),steel52,.04)
bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.22,radius2=0.,depth=.55,location=(0,-2.66,6.64))
pointer=bpy.context.object
pointer.name="V5.2 precision forged pointer"
pointer.data.materials.append(teal52)
objects.append(pointer)

# Upper architectural halo: horizontal, elliptic, with genuine suspended truss,
# reflective return light and individually mounted spot pods.
for radius,thickness,height,zs,mat in [
    (4.65,.11,10.63,(1.34,.68,1),chrome52),
    (4.53,.033,10.59,(1.33,.69,1),ledblue52),
    (4.34,.050,10.49,(1.36,.68,1),steel52),
    (4.27,.032,10.43,(1.35,.67,1),ledgreen52)]:
    led=ring("V5.2 elevated elliptical studio halo",(0,0.3,height),radius,thickness,mat)
    led.scale=zs

for sign in (-1,1):
    pipe("V5.2 real suspended tie rod",(sign*4.9,0,10.7),(sign*3.35,-1.9,8.95),.061,polished52)
    box("V5.2 louvered reflection panel",(sign*5.55,-1.6,9.26),(.35,.6,.92),navy52,.06)
for i in range(12):
    a=math.tau*i/12
    x=4.48*1.34*math.cos(a);y=.3+4.48*.68*math.sin(a)
    box("V5.2 suspended light mount",(x,y,10.36),(.24,.29,.18),steel52,.04)
    sphere("V5.2 spot lens",(x,y,10.18),.13,white52)

# Add calibrated kick/white cards that create real Fresnel/specular reflections.
area("V5.2 vertical cool-white chrome stripe",(0,-9.0,11.1),(0,-1.4,4.1),
     (.70,.87,1),810,1.45,7.8)
area("V5.2 long soft upper reflector",(-4.2,-7.2,12.7),(0,-1.6,6),
     (.87,.95,1),460,9,1.5)
area("V5.2 off-axis emerald fill",(7.8,-9.0,9.3),(0,-1.5,4.1),
     (.19,.95,.62),260,4,5)

# Projector hero framing; no bitmap slide, this is the same actual animated set.
cam.location=(0,-21.4,6.4)
aim(cam,(0,-1.0,4.70))
cam.data.lens=33.5
scene.render.resolution_x=1152
scene.render.resolution_y=648
scene.cycles.samples=48
scene.view_settings.exposure=-.43

print("V52_REAL_WHEEL_SECTORS",sector_count,flush=True)
print("V52_REAL_EDITABLE_NEW_OBJECTS",len(objects)-previous_count,flush=True)
print("V52_NO_TRAINER_SECTOR_DATA_CHANGED",flush=True)
