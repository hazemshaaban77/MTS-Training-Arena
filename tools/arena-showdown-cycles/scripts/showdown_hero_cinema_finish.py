"""Final Stage 1 3D hero/lookdev iteration; executes after the original signed GLB, V4, V5, Premium components.
Photo imagery is used only on *physical LED screen meshes*, never as a fake 3D stage. 
Source model and logo texture are preserved.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
asset=PROJECT/"art_assets"
start_count=len(objects)
# Actual sampled studio HDRI drives metal reflections; screen textures remain physical panels.
hdri=asset/"studio_small_01_1k.hdr"
if hdri.is_file():
    nodes=scene.world.node_tree.nodes
    bg=nodes.get("Background")
    env=nodes.new("ShaderNodeTexEnvironment")
    env.image=bpy.data.images.load(str(hdri),check_existing=True)
    scene.world.node_tree.links.new(env.outputs["Color"],bg.inputs["Color"])
    bg.inputs["Strength"].default_value=.31
    print("STAGE1_REAL_HDRI_LIGHTING_APPLIED",flush=True)
else:
    print("STAGE1_HDRI_NOT_AVAILABLE_KEEP_PHYSICAL_SOFTBOX_LIGHTING",flush=True)

ink=v5_material("HERO black cobalt lacquer",(.007,.023,.052),.54,.22)
brightsteel=v5_material("HERO brushed platinum",(.66,.79,.86),.89,.19)
matte=v5_material("HERO black broadcast metal",(.012,.027,.054),.34,.37)
blueled=v5_material("HERO azure LEDs",(.02,.15,.33),.12,.26,(.025,.41,.86),.9)
greenled=v5_material("HERO emerald LEDs",(.025,.20,.12),.12,.24,(.025,.85,.34),1.03)
glass=v5_material("HERO studio lens glass",(.023,.054,.11),.43,.18)
# Read the source file generated from a documented public-domain image (or explicit fallback).
photo=asset/"skyline_public_domain.jpg"
if not photo.is_file():raise RuntimeError("The physical studio screen photo is missing")
img=bpy.data.images.load(str(photo),check_existing=True)
m=bpy.data.materials.new("HERO actual emissive digital stage media: "+(asset/"SOURCE_NOTICE.txt").read_text().splitlines()[0])
m.use_nodes=True
nd=m.node_tree.nodes; nd.clear()
out=nd.new("ShaderNodeOutputMaterial");tex=nd.new("ShaderNodeTexImage");tex.image=img
emi=nd.new("ShaderNodeEmission");emi.inputs["Strength"].default_value=.85
m.node_tree.links.new(tex.outputs["Color"],emi.inputs["Color"])
m.node_tree.links.new(emi.outputs["Emission"],out.inputs["Surface"])
def led_panel(name,x,y,z,w,h,photo_mat):
    bpy.ops.mesh.primitive_plane_add(size=1,location=(x,y,z))
    ob=bpy.context.object;ob.name="HERO_"+name
    ob.rotation_euler=(math.pi/2,0,0);ob.scale=(w,h,1)
    ob.data.materials.append(photo_mat);objects.append(ob)
    return ob
# The city's image is confined to two physical, framed LED display objects in the set.
for sign in [-1,1]:
    x=sign*9.22
    # hide old procedural dots; these panels sit in front of historic art but behind foreground pillars
    for ob in scene.objects:
        if ob.name.startswith(("V4_PREMIUM illuminated metropolis tower","V4_PREMIUM real city luminous slot")):
            ob.hide_render=True
    box("HERO deep media frame",(x,4.89,4.13),(5.45,.34,6.23),matte,.12)
    led_panel("Dubai public-domain digital broadcast screen",x,4.69,4.13,5.15,5.91,m)
    box("HERO top steel media bezel",(x,4.54,7.25),(5.55,.20,.13),brightsteel,.03)
    box("HERO bottom steel media bezel",(x,4.54,1.03),(5.55,.20,.13),brightsteel,.03)
    for sx in (-2.75,2.75):
        box("HERO steel upright LED bezel",(x+sx,4.51,4.13),(.17,.16,6.05),brightsteel,.025)
    for dx in (-2.6,2.6):
        box("HERO emerald light track",(x+dx,4.41,4.1),(.04,.08,5.65),greenled,.01)
# Full readable Arabic typeset at the actual face positions in front of the 3D wheel.
# These are editable, transparent textures on separate planar objects — can be rebuilt
# dynamically in the subsequent real-time wheel stage from trainer sectors.
sector_items=["سؤال","تحدي","مهمة","نقاط","جائزة","مفاجأة"]
for i,label in enumerate(sector_items):
    material=bpy.data.materials.new("HERO Cairo shaped wheel label "+label)
    material.use_nodes=True
    nodes=material.node_tree.nodes;nodes.clear()
    out=nodes.new("ShaderNodeOutputMaterial")
    tex=nodes.new("ShaderNodeTexImage");tex.image=bpy.data.images.load(str(asset/f"wheel_label_{i}.png"),check_existing=True)
    emi=nodes.new("ShaderNodeEmission");emi.inputs["Strength"].default_value=1.15
    transp=nodes.new("ShaderNodeBsdfTransparent")
    mix=nodes.new("ShaderNodeMixShader")
    material.node_tree.links.new(tex.outputs["Color"],emi.inputs["Color"])
    material.node_tree.links.new(tex.outputs["Alpha"],mix.inputs[0])
    material.node_tree.links.new(transp.outputs[0],mix.inputs[1])
    material.node_tree.links.new(emi.outputs[0],mix.inputs[2])
    material.node_tree.links.new(mix.outputs[0],out.inputs["Surface"])
    t=math.pi/2-(i+.5)*(2*math.pi/6)
    cx=2.36*math.cos(t);cz=4.06+2.36*math.sin(t)
    led_panel("Cairo trainer-editable art sample "+str(i),cx,-2.44,cz,1.65,.52,material)
# Reinforced chrome arches, with integrated supports instead of randomly distributed accents.
for sign in (-1,1):
    pipe("HERO upper stainless truss",(sign*5.0,1.8,9.60),(sign*6.9,2.6,7.2),.10,brightsteel)
    pipe("HERO lower stabilizer",(sign*6.9,2.6,7.2),(sign*7.0,2.25,1.05),.075,brightsteel)
    for a in range(7):
        z=1.25+a*.82
        box("HERO real stadium luminous stair trim",(sign*10.67,-2.7+a*.22,z),(.70,.12,.045),blueled,.01)
# Drama is from real softboxes/low-intensity sources in the physical scene.
area("HERO luxury clean strip",(0,-11.2,11.2),(0,-1.0,4.0),(1,1,1),980,12,1.1)
area("HERO city side separation",(-11,-3.6,7.8),(-8,3.5,4.5),(.22,.54,1),650,5,5)
area("HERO second city separation",(11,-2,7.7),(8.5,4.0,4.5),(.11,1,.56),580,5,5)
# Keep the canopy visible: ensure the approved original pixel-logo remains unchanged.
srcLogo=[ob for ob in scene.objects if ob.name=="V5 ORIGINAL APPROVED Arena logo full pixels"]
if not srcLogo:raise RuntimeError("Official approved logo source not present")
for ob in srcLogo:
    ob.hide_render=False; ob.hide_set(False)
# Low noise and high DR filmic sample, authentic Cycles.
scene.render.resolution_x=1440
scene.render.resolution_y=810
scene.cycles.samples=48
scene.view_settings.exposure=-.35
cam.location=(0,-25.4,6.42)
aim(cam,(0,-.1,5.25))
cam.data.lens=31.8
try:scene.cycles.use_denoising=True;bpy.context.view_layer.cycles.use_denoising=True
except Exception:pass
print("STAGE1_FINAL_ACTUAL_3D_ASSETS_ADDED",len(objects)-start_count,flush=True)
print("STAGE1_FINAL_ARABIC_FACE_LABELS",sector_items,flush=True)
print("STAGE1_FINAL_SOURCE_SCREEN",img.name,flush=True)
