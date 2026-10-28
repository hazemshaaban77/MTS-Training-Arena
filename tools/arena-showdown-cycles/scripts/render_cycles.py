"""CPU Blender Cycles art review, separate from V6 and from gameplay.
Use: blender -b -t 2 --python scripts/render_cycles.py -- [path/to/Arena_Showdown_Stage1_v3.glb]
If the model has not been uploaded yet, render a small physically based studio calibration frame.
"""
import math, sys, os
from pathlib import Path
import bpy
from mathutils import Vector

PROJECT = Path(__file__).resolve().parents[1]
OUTPUT = PROJECT / "renders"
OUTPUT.mkdir(exist_ok=True)
CUSTOM = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
MODEL = Path(CUSTOM[0]).resolve() if CUSTOM else PROJECT / "models" / "Arena_Showdown_Stage1_v3.glb"
REAL_MODEL = MODEL.is_file()

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 16 if REAL_MODEL else 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1280 if REAL_MODEL else 720
scene.render.resolution_y = 720 if REAL_MODEL else 405
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
try:
    scene.view_settings.view_transform = "AgX"
except Exception:
    pass
scene.view_settings.look = "Medium High Contrast"
scene.render.image_settings.color_mode = "RGBA"
scene.world = bpy.data.worlds.new("Arena Showdown — night studio")
scene.world.use_nodes = True
b = scene.world.node_tree.nodes.get("Background")
b.inputs["Color"].default_value = (0.025, 0.060, 0.14, 1)
b.inputs["Strength"].default_value = 0.42

def material(name, color, metal, roughness):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = roughness
    return m

def aim(o, target):
    o.rotation_euler = (Vector(target) - o.location).to_track_quat("-Z", "Y").to_euler()

def area(name, xyz, target, rgba, power, width, height):
    d = bpy.data.lights.new(name, "AREA")
    d.shape = "RECTANGLE"
    d.energy = power
    d.color = rgba
    d.size = width
    d.size_y = height
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = xyz
    aim(o, target)
    return o

def camera(name, xyz, target, lens=38):
    d = bpy.data.cameras.new(name)
    d.type = "PERSP"
    d.lens = lens
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = xyz
    aim(o, target)
    scene.camera = o
    return o

if REAL_MODEL:
    print("ARENA_SOURCE_GLB:", str(MODEL), flush=True)
    bpy.ops.import_scene.gltf(filepath=str(MODEL))
    # Embedded brand textures stay unchanged. Improve chrome and steel roughness.
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        n = m.node_tree.nodes.get("Principled BSDF")
        if not n:
            continue
        name = m.name.lower()
        if "chrome" in name or "mirror" in name:
            n.inputs["Metallic"].default_value = 0.95
            n.inputs["Roughness"].default_value = 0.12
        elif "brushed" in name or "steel" in name:
            n.inputs["Metallic"].default_value = 0.85
            n.inputs["Roughness"].default_value = 0.25
        elif "marble" in name:
            n.inputs["Roughness"].default_value = 0.18
    aim_target = (0, 4, -1)
    cam = camera("Arena – front architectural review", (0, 5.5, 27), aim_target, 35)
    area("Mega softbox left", (-7, 13, 11), aim_target, (0.94, 0.98, 1.0), 2600, 9, 5)
    area("Chrome reflection strip", (2, 12, 12), aim_target, (1.0, 1.0, 1.0), 3000, 12, 1.4)
    area("Cobalt right light", (9, 9, 5), aim_target, (0.28, 0.64, 1.0), 1900, 6, 5)
    area("Emerald rim light", (-8, 8, -4), aim_target, (0.15, 1.0, 0.58), 1550, 5, 5)
    area("Runway floor sheen", (0, 6, 10), (0, 0, 4), (0.5, 0.75, 1.0), 1200, 10, 2)
else:
    print("DIAGNOSTIC_ONLY: GLB not yet in models/; rendering real Cycles chrome/light test", flush=True)
    chrome = material("Mirror chrome • real ray-traced Cycles", (0.8, 0.92, 1.0), 1.0, 0.085)
    emerald = material("Arena emerald anodized", (0.055, 0.55, 0.38), 0.82, 0.20)
    sapphire = material("Arena navy stage", (0.014, 0.067, 0.17), 0.42, 0.22)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, location=(-1.15, 0, 0.68))
    bpy.context.object.name = "Calibration polished chrome"; bpy.context.object.data.materials.append(chrome)
    bpy.ops.mesh.primitive_torus_add(major_segments=88, minor_segments=12, location=(1.14, 0, 0.72), major_radius=0.90, minor_radius=0.12)
    bpy.context.object.name = "Calibration aluminum iris"; bpy.context.object.data.materials.append(emerald)
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, -0.53))
    bpy.context.object.name = "Calibration studio floor"; bpy.context.object.scale=(7, 7, 0.08); bpy.context.object.data.materials.append(sapphire)
    aim_target=(0,0,0.4)
    cam=camera("Art-Review calibration camera",(3.8,-7.9,4.2),aim_target,47)
    area("White high strip",(-3,-2,7),aim_target,(1,1,1),1300,6,1.0)
    area("Blue softbox",(4,2,4),aim_target,(0.36,0.7,1),1250,4,4)
    area("Green kicker",(-4,3,3),aim_target,(0.3,1,0.59),1000,2.5,4)
    area("Narrow white reflection",(0,-3,6),aim_target,(1,1,1),1000,1,7)

blend=OUTPUT / ("Arena_Showdown_Actual_Model_Cycles.blend" if REAL_MODEL else "Cycles_Calibration.blend")
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
scene.render.filepath = str(OUTPUT / ("Arena_Showdown_Actual_Model_Cycles_Front.png" if REAL_MODEL else "Cycles_Calibration.png"))
bpy.ops.render.render(write_still=True)
if REAL_MODEL:
    cam.location=(-6.5,8.5,24.0); aim(cam, aim_target)
    scene.render.filepath=str(OUTPUT / "Arena_Showdown_Actual_Model_Cycles_Crane.png")
    bpy.ops.render.render(write_still=True)
print("ARENA_CYCLES_COMPLETE:", "REAL_MODEL" if REAL_MODEL else "CALIBRATION_ONLY", flush=True)
