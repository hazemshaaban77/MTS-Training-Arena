"""Stage 1 PREMIUM HERO: actual edit-ready 3D scene / exact owner logo / Blender 4.5 Cycles.
Art-review ONLY: sector labels are static art placeholders, not trainer-authoritative game data.
The original GLB and the earlier V5 art script remain unchanged.
"""
import math, random
import bpy
from mathutils import Matrix, Vector
random.seed(621728)
start_count=len(objects)

def cylinder(name,where,radius,depth,mat,vertices=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=where)
    ob=bpy.context.object;ob.name="PREMIUM_"+name
    ob.data.materials.append(mat);objects.append(ob);return ob

# Remove the procedural visual clutter from earlier iterations; original GLB stays in .blend.
hidden_prefixes=("V4_audience","V4_theater","V4_V5 hero-logo","V4_V5 large porcelain",
                 "V4_V5 blue fascia","V4_V5 slim green","V4_V5 side brushed",
                 "V4_V5 chrome fascia","V4_branded masthead","V4_masthead",
                 "V3_APPROVED_LOGO_MASTHEAD","V4_Original_Arena",
                 "AUDIENCE_SEAT_","THEATER_BANK_",
                 "V4_large curved media wing","V4_studio city silhouette")
for ob in scene.objects:
    if ob.name.startswith(hidden_prefixes):
        ob.hide_render=True
        ob.hide_set(True)

# Physically modeled overhead ring, not two flat lines.
ink=v5_material("PREMIUM deep sapphire enamel",(.006,.025,.063),.48,.19)
blueblack=v5_material("PREMIUM blue-black anodised titanium",(.022,.070,.13),.72,.21)
silver=v5_material("PREMIUM white satin chrome",(.58,.69,.76),.88,.21)
bright=v5_material("PREMIUM mirror bevel",(.88,.94,.98),.95,.09)
glass=v5_material("PREMIUM stage glass",(.012,.045,.088),.59,.17)
emerald=v5_material("PREMIUM emerald illuminated",(.016,.29,.16),.12,.25,(.045,.69,.32),.82)
cobalt=v5_material("PREMIUM cobalt illuminated",(.025,.12,.33),.12,.24,(.024,.41,.85),1.02)
warm=v5_material("PREMIUM soft white studio lens",(.91,.93,.95),.15,.20,(.94,.88,.76),.36)
dark=v5_material("PREMIUM acoustic velvet",(.010,.018,.039),.04,.78)
reflect=v5_material("PREMIUM neutral lacquer floor",(.009,.017,.033),.64,.135)

# Truss: machined 360-degree navy cylindrical wall with actual front-facing volume.
radius=5.20
zlo,zhi=8.62,10.58
arc=bpy.data.meshes.new("360-degree broadcast canopy machined shell")
verts=[];faces=[];uvs=[]
steps=128
for i in range(steps+1):
    angle=2*math.pi*i/steps
    xx=radius*math.cos(angle);yy=radius*math.sin(angle)
    verts.append((xx,yy,zlo));verts.append((xx,yy,zhi))
for i in range(steps):
    j=2*i;faces.append((j,j+2,j+3,j+1))
arc.from_pydata(verts,[],faces);arc.update()
can=bpy.data.objects.new("PREMIUM 3D solid broadcast canopy ring",arc)
scene.collection.objects.link(can);can.data.materials.append(ink);objects.append(can)
solid=can.modifiers.new("Engineered structural band thickness","SOLIDIFY")
solid.thickness=.24;solid.offset=-1
bev=can.modifiers.new("Cut metal edge blend","BEVEL");bev.width=.045;bev.segments=3
can.modifiers.new("Weighted can normals","WEIGHTED_NORMAL")
for rr,t,zz,mat in [(5.34,.075,10.62,bright),(5.25,.095,8.60,silver),
                     (5.12,.055,8.44,emerald),(4.91,.075,8.32,cobalt),
                     (5.37,.037,10.48,cobalt)]:
    ring("PREMIUM suspended canopy machined rings",(0,0,zz),rr,t,mat)
for k in range(22):
    t=2*math.pi*k/22
    x=(radius-.31)*math.cos(t);y=(radius-.31)*math.sin(t)
    sphere("PREMIUM overhead real lens",(x,y,8.24),.09,warm)
    if k%4==0:
        pipe("PREMIUM canopy chandelier stay",(x,y,10.56),(x,y,12.02),.04,silver)

# Preserve exact approved logo texture from source: move prior brand plane onto
# the new physical broad canopy hero plaque rather than inventing a new wordmark.
box("PREMIUM original-logo 3D porcelain signage",(0,-5.56,9.58),(4.32,.18,1.82),blueblack,.11)
box("PREMIUM sapphire banner inset",(0,-5.665,9.58),(4.16,.027,1.66),ink,.05)
logo_found=False
for ob in scene.objects:
    if "V5 ORIGINAL APPROVED Arena logo full pixels" in ob.name:
        ob.hide_render=False
        ob.hide_set(False)
        ob.location=(0,-5.74,9.57)
        ob.scale=(3.70,1.59,1)
        logo_found=True
        break
print("PREMIUM_EXACT_APPROVED_LOGO_FROM_SOURCE",logo_found,flush=True)
if not logo_found:
    raise RuntimeError("Approved logo cannot be found on original V3/V5 art. Refuse substituted brand.")

# Broadcast spokes from the canopy to the main stage, sized rather than repeated random rings.
for sign in (-1,1):
    pipe("PREMIUM architectural angled arch",(sign*4.9,1.4,8.2),(sign*6.3,4.6,4.10),.14,silver)
    box("PREMIUM tall grooved studio pilaster",(sign*7.04,2.80,4.90),(.37,.61,6.65),blueblack,.075)
    for z in [2.2,3.3,4.4,5.5,6.6]:
        box("PREMIUM polished inset rib",(sign*7.13,2.42,z),(.31,.09,.07),bright,.02)
    box("PREMIUM LED column signature",(sign*6.84,2.46,4.75),(.052,.072,5.95),emerald,.02)
    # Side wall: material and proportion mirrors real broadcast LED partitions.
    box("PREMIUM panoramic media-glass screen",(sign*9.23,6.36,4.2),(4.30,.12,6.3),glass,.08)
    box("PREMIUM real metal upper display rim",(sign*9.23,6.19,7.40),(4.49,.16,.10),silver,.025)
    for lane in range(8):
        x=sign*9.23-1.75+lane*.49
        h=random.uniform(2.6,5.6)
        box("PREMIUM illuminated metropolis tower",(x,6.16,.90+h/2),(.25,.15,h),blueblack,.03)
        for q in range(int(h/.27)):
            if random.random()>.57:
                box("PREMIUM real city luminous slot",(x,6.051,1.03+.27*q),(.075,.012,.054),cobalt if q%5 else warm)
    # Real podium desks and sculpted soft edges; not cardboard bleachers.
    for side_depth in range(1):
        x=sign*(9.0+side_depth*.73)
        for i in range(2):
            yy=-3.9+i*1.1
            ob=box("PREMIUM contestants workstation",(x,yy,.57),(.69,.58,.82),blueblack,.12)
            box("PREMIUM chrome workstation top",(x,yy-.03,1.03),(.81,.65,.052),bright,.025)
            box("PREMIUM workstation emerald detail",(x,yy-.31,.63),(.55,.021,.17),emerald,.025)
    for j in range(11):
        yy=2.1+j*.52
        z=1.1+(j//4)*.34
        bb=box("PREMIUM plush lounge audience backrest",(sign*9.6,yy,z),(.68,.39,.62),dark,.12)
        bb.rotation_euler.z=sign*.055

# Scale the complete source rotor assembly around the actual mechanical pivot.
# No image rotation trick; every source mesh stays a genuine Blender object.
center=Vector((0,-1.48,4.06))
M=Matrix.Translation(center) @ Matrix.Diagonal((1.27,1.08,1.27,1.0)) @ Matrix.Translation(-center)
scaled=[]
for ob in list(scene.objects):
    if ob.type!="MESH":continue
    n=ob.name
    label=n.upper()
    wheels=(label.startswith(("ROTOR_","STAGE2_SAMPLE_SECTOR_","RIM_BULB_",
                             "WHEEL_RING_","WHEEL_BACKPLATE","WHEEL_UNDERPLATE",
                             "V3_POINTER","TOP_FIXED_POINTER","FIXED_GREEN_POINTER",
                             "STAGE2_ROTOR_"))
            or "PRECISION MACHINED ROTOR" in label
            or "ROTOR PEARL LED LENS" in label
            or "V5 PRECISION ORBITAL BEARING" in label
            or "V5 BRUSHED-CHROME WHEEL BOLT" in label
            or "V5 PHYSICAL MACHINED WEDGE" in label)
    if wheels:
        ob.matrix_world=M @ ob.matrix_world
        scaled.append(n)
print("PREMIUM_PHYSICAL_WHEEL_RECONSTRUCTED_MESHES",len(scaled),flush=True)

# Physical rotor highlights, carefully balanced and coherent with sectors.
for r,t,yy,mt in [(3.65,.065,-1.83,bright),(3.57,.040,-1.92,emerald),
                   (3.44,.060,-1.94,silver),(3.37,.027,-2.02,cobalt)]:
    ring("PREMIUM wide mechanical wheel lathe",(0,yy,4.06),r,t,mt,True)
for i in range(54):
    ang=i*2*math.pi/54
    x=3.56*math.cos(ang);z=4.06+3.56*math.sin(ang)
    sphere("PREMIUM jewel bulb real enclosure",(x,-2.02,z),.055,warm)

# Stage runway under studio truss; keep reflective highlights photographic rather than blown out.
box("PREMIUM theater-wide real floor",(0,-6.2,-.228),(25.0,19.3,.087),reflect,.02)
box("PREMIUM front elliptical glass inlay",(0,-8.60,-.107),(11.5,4.28,.048),glass,.24)
for rr,mat,depth in [(5.65,bright,-.037),(5.45,cobalt,-.018),(5.07,emerald,-.024)]:
    ring("PREMIUM grounded stage pool rings",(0,-7.48,depth),rr,.034,mat)
for sx in (-1,1):
    box("PREMIUM runway silver side track",(sx*3.8,-7.2,-.075),(.065,10.7,.07),silver,.02)
    box("PREMIUM runway green inner light",(sx*3.58,-7.2,-.048),(.035,10.2,.044),emerald,.01)

# Micro roughness applies to PBR only, never the owner's logo pixels.
for mat in [blueblack,glass,reflect,bright,silver]:
    p=mat.node_tree.nodes.get("Principled BSDF")
    noise=mat.node_tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value=132
    noise.inputs["Detail"].default_value=2
    mapping=mat.node_tree.nodes.new("ShaderNodeMapRange")
    mapping.inputs["From Min"].default_value=0
    mapping.inputs["From Max"].default_value=1
    mapping.inputs["To Min"].default_value=.12 if mat is bright else .17
    mapping.inputs["To Max"].default_value=.21 if mat is bright else .29
    mat.node_tree.links.new(noise.outputs["Fac"],mapping.inputs["Value"])
    mat.node_tree.links.new(mapping.outputs["Result"],p.inputs["Roughness"])

# Cinema-friendly lighting cards, no fake highlights on glass.
for ob in scene.objects:
    if ob.type=="LIGHT":
        ob.data.energy*=.62
area("PREMIUM ceiling high white softbox",(0,-4.0,15.5),(0,0,4.1),(1,1,1),1400,12,4)
area("PREMIUM silver strip reflection",(-6.8,-10.2,11.8),(0,0,4.1),(.89,.96,1),800,1.4,9.2)
area("PREMIUM cobalt rim",(9.5,1.2,10.5),(0,0,4.2),(.26,.61,1),820,5.5,7.2)
area("PREMIUM emerald rim",(-9,2.3,7.6),(0,0,4.3),(.16,.91,.49),740,4,5.5)
area("PREMIUM floor grazing reflection",(0,-12.6,5),(0,-5,.0),(.50,.75,1),620,9,1.4)
scene.world.node_tree.nodes.get("Background").inputs["Strength"].default_value=.78
scene.view_settings.exposure=-.42

# Larger wheel and physically suspended canopy in one 16:9 composition.
cam.location=(0,-26.6,6.35)
aim(cam,(0,-.55,5.35))
cam.data.lens=31
scene.render.resolution_x=1440
scene.render.resolution_y=810
scene.cycles.samples=48
try:
    scene.cycles.use_denoising=True
    bpy.context.view_layer.cycles.use_denoising=True
except Exception:
    pass
print("PREMIUM_STAGE1_ART_OBJECTS_ADDED",len(objects)-start_count,flush=True)
print("PREMIUM_STAGE1_CAMERA_CANOPY_AND_WHEEL_READY",flush=True)
