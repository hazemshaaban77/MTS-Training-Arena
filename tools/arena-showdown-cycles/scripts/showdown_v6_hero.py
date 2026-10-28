"""SHOWDOWN Stage 1 V6: true 3D architectural hero lookdev.
Executed after the V3 GLB + V4 + V5 finishing. The original 3D model is unchanged.
All additions are geometry / shaders / genuine rotor-face textures, not a generated stage photo.
Six Arabic labels are examples for art sign-off only; trainer-defined sector content comes in Phase 2.
"""
import bpy, math, os, random
from mathutils import Vector

# Remove oversized porcelain logo BOX, not the authentic source logo texture.
# Source V3 branding assets are not deleted; original .glb is kept intact.
for ob in list(scene.objects):
    nm=ob.name.lower()
    if any(fragment in nm for fragment in (
        "v5 hero-logo metallic superstructure",
        "v5 large porcelain branding screen",
        "v5 blue fascia lower metal reveal",
        "v5 slim green signature underline",
        "v5 side brushed-aluminum logo bevel",
        "v5 chrome fascia support",
        "v5 original approved arena logo full pixels",
        "v4_branded masthead monolith",
        "v4_masthead chrome",
        "v4_original_arena_approved_logo_masthead",
        "v4_cairo 3d type specimen",
    )):
        ob.hide_render=True
        ob.hide_viewport=True
    if "curved_header_panel" in nm:
        ob.hide_render=True
        ob.hide_viewport=True
    # Render legible newly designed sector markings instead of text baked on older
    # technical rotor which was never convincing at laptop 16:9 projection.
    if "v5 physical machined wedge emblem" in nm:
        ob.hide_render=True
        ob.hide_viewport=True

before=len(scene.objects)
navy=v5_material("V6 ring enamel cobalt",(.012,.036,.106),.52,.22)
midnight=v5_material("V6 obsidian graphite",(.008,.019,.043),.63,.24)
silver=v5_material("V6 milled 316L chrome",(.79,.88,.97),.92,.19)
rim=v5_material("V6 steel glint",(.9,.97,1),.93,.14)
emerald=v5_material("V6 emerald glass",(.01,.28,.14),.12,.2,(.015,.63,.25),.7)
azure=v5_material("V6 laser blue glass",(.012,.15,.48),.12,.2,(.035,.33,.94),.85)
snow=v5_material("V6 bright optical diffuser",(.73,.85,1),.20,.24,(.39,.58,.78),.30)
diffuser=v5_material("V6 lightbox",(.46,.63,.82),.09,.48,(.32,.56,.72),.38)

# Clean visual hierarchy: V3+V4+V5 prototypes stacked too many redundant rings.
# Hide geometry from rendering (do not delete or damage the approved underlying GLB).
for ob in scene.objects:
    name=ob.name.lower()
    if name.startswith(("wheel_ring_1","wheel_ring_2","wheel_ring_4","wheel_ring_5")):
        ob.hide_render=True
    if name.startswith(("v4_precision machined rotor","v5 precision orbital bearing housing")):
        ob.hide_render=True
    if name.startswith(("v3_canopy_ring_0","v3_canopy_ring_2")):
        ob.hide_render=True

# 1. Premium suspended banner: actual CURVED solid panels and 3D chrome ring.
def arc_band(name,R,zlow,zhigh,arc,mat,segments=86):
    vv=[];ff=[]
    for j in range(segments+1):
        a=-arc+2*arc*j/segments
        x=R*math.sin(a);y=-R*math.cos(a)
        vv.extend([(x,y,zlow),(x,y,zhigh)])
    for j in range(segments):
        k=j*2;ff.append((k,k+2,k+3,k+1))
    mesh=bpy.data.meshes.new(name+" Mesh")
    mesh.from_pydata(vv,[],ff);mesh.update()
    ob=bpy.data.objects.new(name,mesh);scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    solid=ob.modifiers.new("Solid machined wall 34mm","SOLIDIFY");solid.thickness=.034
    bev=ob.modifiers.new("Round-cut chrome edges","BEVEL");bev.width=.022;bev.segments=3
    ob.modifiers.new("Weighted normals","WEIGHTED_NORMAL")
    return ob

# Main ring is mechanically suspended over wheel from the upper truss.
arc_band("V6 elevated CIRCULAR midnight fascia",4.35,7.95,9.42,1.18,navy)
for rr,z,rrmat,th in [(4.39,7.95,rim,.07),(4.40,9.43,silver,.075),
                       (4.36,8.03,emerald,.032),(4.41,9.32,azure,.024)]:
    ring("V6 machined continuous ring enclosure",(0,0,z),rr,th,rrmat,False)
for x in (-2.75,2.75):
    pipe("V6 real truss suspension cable",(x,-3.4,9.4),(x,-3.4,11.28),.033,silver)
    sphere("V6 rigging collar",(x,-3.4,9.40),.087,silver)

# IMPORTANT: exact approved logo pixels are reused, including their exact aspect.
sourceLogo=next((m for m in bpy.data.materials if m.name.startswith("V5 exact approved logo pixels")),None)
if sourceLogo is not None:
    box("V6 logo floating panel anodized mount",(0,-4.52,8.66),(3.56,.17,1.18),silver,.072)
    box("V6 illuminated logo inset porcelain",(0,-4.63,8.66),(3.42,.07,1.04),v5_white,.034)
    bpy.ops.mesh.primitive_plane_add(size=1,location=(0,-4.685,8.67))
    logo=bpy.context.object;logo.name="V6 EXACT APPROVED ARENA LOGO / NOT REDRAWN"
    logo.rotation_euler=(math.pi/2,0,0)
    logo.scale=(3.18,1.01,1)
    logo.data.materials.append(sourceLogo)
    print("V6_APPROVED_LOGO_SOURCE_TEXTURE_REUSED",flush=True)
else:
    raise RuntimeError("Exact approved original Arena logo material missing; refuse substituted art")

# 2. True double-arched chrome proscenium behind rotor.
# Wheel center at z=4.06, set chrome C-shaped supports behind its silhouette.
for side in (-1,1):
    for radius,th,mat in [(3.83,.095,silver),(4.06,.060,midnight),
                           (4.15,.032,azure),(4.35,.021,emerald)]:
        cr=bpy.data.curves.new("V6 machined proscenium", "CURVE")
        cr.dimensions="3D";cr.resolution_u=3
        cr.bevel_depth=th;cr.bevel_resolution=4
        cr.use_fill_caps=True
        sp=cr.splines.new("POLY");sp.points.add(56)
        for i,p in enumerate(sp.points):
            fraction=i/56
            theta=fraction*math.pi*.98
            xx=side*(radius*math.cos(theta))
            zz=4.06+radius*math.sin(theta)
            p.co=(xx,1.45,zz,1)
        ob=bpy.data.objects.new("V6 cast-chrome arched structural beam",cr)
        scene.collection.objects.link(ob);ob.data.materials.append(mat)
    for level in (1.3,2.6,4.05):
        box("V6 3D structural brushed-steel fins",(side*4.88,1.12,level),(.21,.25,.87),silver,.055)

# 3. Visually clean the rotor. The original wedge COLORS and physical sectors stay
# part of the imported geometry. We're improving face readability, not freezing sectors.
for ob in scene.objects:
    if ob.name.startswith("V5 precision orbital bearing housing") and "002" in ob.name:
        ob.hide_render=True
    if "V4_precision machined rotor" in ob.name and any(s in ob.name for s in (".003",".004")):
        ob.hide_render=True

# Substantive machined geometry: deep housing, lit rim lenses, bolts and pointer.
for rad,depth,mat in [(2.94,.095,silver),(2.82,.034,emerald),
                       (2.76,.025,rim),(2.69,.038,azure)]:
    ring("V6 physical stepped rotor enclosure",(0,-1.92,4.06),rad,depth,mat,True)
for i in range(48):
    theta=math.tau*i/48
    xx=2.86*math.cos(theta);zz=4.06+2.86*math.sin(theta)
    sphere("V6 polished bezel jewel",(xx,-2.01,zz),.048,snow)
# Real 3D scene pointer, not an image overlay.
pipe("V6 indicator chrome shaft",(0,-2.28,7.42),(0,-2.28,7.10),.079,silver)
pointer=box("V6 triangular pointer housing",(0,-2.37,7.02),(.38,.16,.39),emerald,.028)

# Textured 3D sector cards use RAQM Cairo shaping generated by GitHub before rendering,
# never need per-label mesh hardcoded in deployed Arena. Dynamic system will replace in Phase 2.
labelsFolder=PROJECT/"textures"/"cairo_sector_labels"
for i in range(6):
    path=labelsFolder/("sector_%02d.png"%i)
    if not path.is_file():
        raise FileNotFoundError("RAQM Cairo sector texture missing: "+str(path))
    texImage=bpy.data.images.load(str(path),check_existing=True)
    texImage.pack()
    mat=bpy.data.materials.new("V6 real Cairo/RAQM live-wheel art preview "+str(i))
    mat.use_nodes=True
    nodes=mat.node_tree.nodes;nodes.clear()
    tex=nodes.new("ShaderNodeTexImage");tex.image=texImage
    tex.interpolation="Linear"
    out=nodes.new("ShaderNodeOutputMaterial")
    transparent=nodes.new("ShaderNodeBsdfTransparent")
    emit=nodes.new("ShaderNodeEmission");emit.inputs["Strength"].default_value=1.15
    mix=nodes.new("ShaderNodeMixShader")
    mat.node_tree.links.new(tex.outputs["Color"],emit.inputs["Color"])
    mat.node_tree.links.new(tex.outputs["Alpha"],mix.inputs[0])
    mat.node_tree.links.new(transparent.outputs[0],mix.inputs[1])
    mat.node_tree.links.new(emit.outputs[0],mix.inputs[2])
    mat.node_tree.links.new(mix.outputs[0],out.inputs["Surface"])
    # Text plane floats IN FRONT of rotor in actual 3D world geometry.
    angle=math.pi/2 + (i+.5)*math.tau/6
    xx=1.60*math.cos(angle); zz=4.06+1.60*math.sin(angle)
    bpy.ops.mesh.primitive_plane_add(size=1,location=(xx,-2.39,zz))
    ob=bpy.context.object
    ob.name="V6 Arabic Cairo beautifully shaped generic segment "+str(i)
    ob.rotation_euler=(math.pi/2,0,0)
    ob.scale=(1.67,.72,1)
    ob.data.materials.append(mat)

# 4. Broadcast screens: materially convincing panels, but not image-backed
# copies of reference set. Procedural cityscape still behind them.
for side in (-1,1):
    x=side*9.20
    box("V6 frame-forming chrome side banner",(x,4.56,4.34),(3.74,.18,5.93),silver,.08)
    box("V6 live navy LED glass side banner",(x,4.40,4.34),(3.51,.052,5.67),navy,.034)
    for d in range(12):
        zz=1.76+d*.45
        box("V6 true angled tiny skyline lightline",(x,4.30,zz),(3.21,.027,.012),azure)
    box("V6 vertical emerald film lamp",(x-side*1.79,4.22,4.34),(.067,.045,5.70),emerald)
    # Physical studio header truss / spot fixtures.
    for idx in range(4):
        xx=side*(5.0+idx*.87)
        sphere("V6 actual stage lamp lens",(xx,-2.60,10.29),.075,snow)
        pipe("V6 ceiling light mount",(xx,-2.6,10.35),(xx,-2.6,10.95),.026,silver)

# 5. Cinematic but physically plausible light: PBR chrome reflection cards.
scene.world.node_tree.nodes.get("Background").inputs["Strength"].default_value=.69
scene.view_settings.view_transform="AgX"
scene.view_settings.exposure=-.20
scene.view_settings.look="AgX - Medium High Contrast"
for lamp in scene.objects:
    if lamp.type=="LIGHT":
        if lamp.name.startswith("V5 overhead broad reflection card"): lamp.data.energy=1300
        if lamp.name.startswith("V5 left warm-white TV key"):lamp.data.energy=850
area("V6 cinematic front eye reflector",(2,-11.5,12.8),(0,-.9,4.1),(0.92,.96,1),680,9,2.3)
area("V6 stage depth blue softbox",(-8,2.5,8.6),(0,0,4.0),(.34,.56,1),900,4,6)
area("V6 stage depth green rake",(8,2.5,7.0),(0,-2,3.4),(.36,1,.69),520,4,5)

# 6. HERO CAMERA: visual hierarchy upper blue banner + large wheel + reflective runway.
cam.location=(0,-25.0,5.96)
aim(cam,(0,-.70,4.66))
cam.data.lens=34
scene.cycles.samples=24
scene.cycles.use_denoising=True
bpy.context.view_layer.cycles.use_denoising=True
scene.render.resolution_x=1152
scene.render.resolution_y=648
print("ARENA_V6_ART_HERO_ACTUAL_3D_OBJECTS",len(scene.objects)-before,flush=True)
print("ARENA_V6_ART_SOURCE_IS_UNCHANGED_GLB",flush=True)
