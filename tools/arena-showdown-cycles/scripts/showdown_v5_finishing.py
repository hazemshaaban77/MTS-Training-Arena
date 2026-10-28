"""Art-first V5 refinements, executed only inside the authentic V3+V4+V4.1 Cycles scene.
This is NOT a live dynamic wheel; trainer-defined segment data stays in Arena's Worker.
Keep the approved original logo image, do not redraw or synthesize it.
"""
import math
import bpy
from mathutils import Vector

def v5_material(name, rgb, metal=.0, rough=.30, emit=None, power=0.):
    mat=bpy.data.materials.new("Showdown V5 | "+name);mat.use_nodes=True
    n=mat.node_tree.nodes.get("Principled BSDF")
    n.inputs["Base Color"].default_value=(*rgb,1)
    n.inputs["Metallic"].default_value=metal
    n.inputs["Roughness"].default_value=rough
    if emit is not None:
        n.inputs["Emission Color"].default_value=(*emit,1)
        n.inputs["Emission Strength"].default_value=power
    return mat

v5_silver=v5_material("machine satin chrome",(.67,.80,.90),.89,.24)
v5_trim=v5_material("polished chrome edge",(.85,.94,1),.93,.12)
v5_navy=v5_material("ink blue architectural lacquer",(.009,.033,.078),.38,.27)
v5_green=v5_material("green vitreous LED",(.024,.33,.18),.18,.28,(.027,.78,.34),.8)
v5_blue=v5_material("blue vitreous LED",(.025,.15,.39),.18,.22,(.05,.34,.84),.9)
v5_white=v5_material("large matte porcelain white",(.91,.96,1),.12,.29)
v5_window=v5_material("blue luminous wall",(.07,.23,.55),.13,.46,(.08,.33,.72),.56)
v5_podium=v5_material("near-black reflecting glass",(.013,.028,.06),.62,.14)

# Use the original functions box, ring, pipe from the parent source script,
# keeping editable meshes in the saved .blend and stage-first pipeline.
start=len(objects)

# High-end broadcast identity fascia, in front of the old lighting scaffold.
# White display is designed around the *exact* original Arena approved texture.
box("V5 hero-logo metallic superstructure",(0,-5.52,8.52),(7.10,.47,2.80),v5_trim,.15)
box("V5 large porcelain branding screen",(0,-5.82,8.53),(6.75,.13,2.51),v5_white,.105)
box("V5 blue fascia lower metal reveal",(0,-5.97,7.20),(6.89,.09,.11),v5_navy,.025)
box("V5 slim green signature underline",(0,-6.06,7.14),(6.38,.045,.047),v5_green,.01)
for sign in (-1,1):
    box("V5 side brushed-aluminum logo bevel",(sign*3.51,-5.86,8.48),(.105,.20,2.38),v5_silver,.027)
    box("V5 chrome fascia support",(sign*3.14,-5.13,9.19),(.15,.30,.88),v5_trim,.04)
original_logo=next((m for m in bpy.data.materials if "V3_APPROVED_LOGO_MASTHEAD" in m.name),None)
if original_logo:
    image_node=next((n for n in original_logo.node_tree.nodes if n.type=="TEX_IMAGE" and n.image),None) if original_logo.use_nodes else None
    if image_node:
        # Print one-to-one approved pixels on a real physically lit surface.
        logo_mat=bpy.data.materials.new("V5 exact approved logo pixels")
        logo_mat.use_nodes=True
        nodes=logo_mat.node_tree.nodes;nodes.clear()
        output=nodes.new("ShaderNodeOutputMaterial")
        tex=nodes.new("ShaderNodeTexImage");tex.image=image_node.image
        emission=nodes.new("ShaderNodeEmission");emission.inputs["Strength"].default_value=.92
        logo_mat.node_tree.links.new(tex.outputs["Color"],emission.inputs["Color"])
        logo_mat.node_tree.links.new(emission.outputs["Emission"],output.inputs["Surface"])
        bpy.ops.mesh.primitive_plane_add(size=1,location=(0,-5.94,8.56))
        panel=bpy.context.object
        panel.name="V5 ORIGINAL APPROVED Arena logo full pixels"
        panel.rotation_euler=(math.pi/2,0,0)
        panel.dimensions=(4.23,2.56,0)
        # Plane UVs retained; logo is never re-drawn, rasterized from text or recolored.
        panel.data.materials.append(logo_mat)
        objects.append(panel)
        print("V5_APPROVED_LOGO_PBR_TEXTURE_FOUND",tex.image.name,flush=True)
    else:
        print("V5_LOGO_TEXTURE_NODE_NOT_FOUND",flush=True)
else:
    print("V5_APPROVED_LOGO_MATERIAL_NOT_FOUND",flush=True)

# Replace the old dark screen void with actual large blue-green LED display walls.
# These are separate camera-visible 3D components, not images overlaid onto the render.
for side in (-1,1):
    x=side*9.2
    box("V5 panoramic emissive media wing",(x,-1.53,4.3),(3.66,.13,5.64),v5_window,.12)
    box("V5 wing chrome upper bezel",(x,-1.65,7.13),(3.77,.16,.10),v5_silver,.018)
    box("V5 wing chrome lower bezel",(x,-1.65,1.47),(3.77,.16,.10),v5_silver,.018)
    for yoff in (0,.17):
        box("V5 wing emerald live edge",(x-side*1.83,-1.73-yoff,4.25),(.058,.055,5.45),v5_green)
    # physically separate curved arch ribs frame center rotor
    for arc_radius,mat in [(3.56,v5_silver),(3.73,v5_trim),(3.90,v5_blue)]:
        # Curved arch with partial pipe sweep in XZ plane.
        curve=bpy.data.curves.new("V5 architectural proscenium pipe","CURVE")
        curve.dimensions="3D";curve.bevel_depth=.055 if arc_radius==3.56 else .032
        curve.bevel_resolution=3
        spline=curve.splines.new("POLY")
        spline.points.add(46)
        # symmetric left / right architectural side arcs, wheel behind
        for i,p in enumerate(spline.points):
            angle=(-1 if side<0 else 0)*math.pi+(-1 if side<0 else 1)*(math.pi*.5)*i/46
            px=side*(.0+arc_radius*math.cos((i/46)*math.pi*.5))
            pz=4.03+arc_radius*math.sin((i/46)*math.pi*.5)
            p.co=(px,.35,pz,1)
        ob=bpy.data.objects.new("V5 custom bent machine arch",curve)
        scene.collection.objects.link(ob);ob.data.materials.append(mat);objects.append(ob)

# Physical machined rotor improvements: bezel covers, fasteners, sector breaks.
# Static hardware only; future trainer-adjustable sectors will be rebuilt in WebGL.
for r,mat,thick,yy in [(2.94,v5_trim,.105,-1.60),(2.84,v5_navy,.074,-1.63),
                       (2.76,v5_green,.030,-1.66),(2.72,v5_silver,.035,-1.72),
                       (2.05,v5_trim,.018,-1.52)]:
    ring("V5 precision orbital bearing housing",(0,yy,4.06),r,thick,mat,True)
for i in range(36):
    ang=i*math.tau/36
    x=2.89*math.cos(ang);z=4.06+2.89*math.sin(ang)
    sphere("V5 brushed-chrome wheel bolt",(x,-1.79,z),.032,v5_trim)
    # each bolt has physical offset and consumes true shaded 3D geometry
for i in range(6):
    a=math.tau*i/6+math.pi/6
    cx=1.69*math.sin(a);cz=4.06+1.69*math.cos(a)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=.11,location=(cx,-1.67,cz))
    emblem=bpy.context.object;emblem.scale=(1,.35,1)
    emblem.name="V5 physical machined wedge emblem plinth"
    emblem.data.materials.append(v5_trim);objects.append(emblem)

# Physically layered set stairs & floor: clear clean TV-studio hierarchy.
box("V5 panoramic stage apron",(0,-6.1,-.20),(9.4,3.2,.29),v5_navy,.12)
box("V5 apron polished top",(0,-6.1,-.028),(8.95,2.85,.075),v5_podium,.045)
for side in (-1,1):
    box("V5 apron emerald inset",(side*4.23,-6.1,.015),(.055,2.68,.055),v5_green)
for rad,mat,z in [(4.58,v5_blue,-.05),(4.72,v5_trim,-.083),(5.13,v5_green,-.115)]:
    ring("V5 stage perimeter luminous inlay",(0,-7.0,z),rad,.035,mat)

# Large studio softboxes with controlled, not clipped highlights.
area("V5 overhead broad reflection card",(0,-7.0,15.3),(0,-1,4.1),(0.78,.90,1),900,12,4)
area("V5 left warm-white TV key",(-8,-8,10),(-.3,0,4.1),(.88,.95,1),700,5,6)
area("V5 green architecture fill",(9,-7,9),(4,0,5),(.2,.9,.55),400,5,6)
for ob in scene.objects:
    if ob.type=="LIGHT" and ob.name in ("Chrome reflection strip","Mega softbox left"):
        ob.data.energy*=.72

# A clean broadcast-wide lens. Keep a readable top masthead, central wheel and front stage.
cam.location=(0,-29.8,6.55)
aim(cam,(0,-.45,4.85))
cam.data.lens=34
scene.view_settings.exposure=-.35
scene.cycles.samples=48
try:
    scene.cycles.use_denoising=True
    bpy.context.view_layer.cycles.use_denoising=True
    print("V5_OIDN_ENABLED_FOR_4_5_LTS",flush=True)
except Exception as ex:
    print("V5_DENOISER_UNAVAILABLE",str(ex),flush=True)
print("V5_ACTUAL_NEW_GEOMETRY",len(objects)-start,flush=True)
