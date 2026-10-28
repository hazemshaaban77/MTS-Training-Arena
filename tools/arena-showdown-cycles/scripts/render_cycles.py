"""CPU Blender Cycles art review, separate from V6 and from gameplay.
Use: blender -b -t 2 --python scripts/render_cycles.py -- [path/to/Arena_Showdown_Stage1_v3.glb]
If the model has not been uploaded yet, render a small physically based studio calibration frame.
"""
import math, sys, os, hashlib
from pathlib import Path
import bpy
from mathutils import Vector

PROJECT = Path(__file__).resolve().parents[1]
OUTPUT = PROJECT / "renders"
OUTPUT.mkdir(exist_ok=True)
CUSTOM = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
MODEL = Path(CUSTOM[0]).resolve() if CUSTOM else PROJECT / "models" / "Arena_Showdown_Stage1_v3.glb"
REAL_MODEL = MODEL.is_file()
EXPECTED_SHA256 = "c5104ded9cfb0714bf74a89fcaf59adf4d905e3a8952560c96c9accb0f8873ba"
if REAL_MODEL:
    digest = hashlib.sha256(MODEL.read_bytes()).hexdigest()
    if digest != EXPECTED_SHA256:
        raise RuntimeError("Model checksum mismatch; refusing to render a different GLB: " + digest)
    print("ARENA_SOURCE_VERIFIED_SHA256", digest, "BYTES", MODEL.stat().st_size, flush=True)
elif os.getenv("ARENA_REQUIRE_REAL_MODEL") == "1":
    raise FileNotFoundError("The original authentic V3 GLB is required. Upload the exact file to tools/arena-showdown-cycles/models/ first.")


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 48 if REAL_MODEL else 24
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 4
# Ubuntu 24.04's official Blender 4.0.2 package may ship without OpenImageDenoiser.
# Disable BOTH scene and view-layer denoising so actual Cycles CPU kernels still run.
scene.cycles.use_denoising = False
try:
    bpy.context.view_layer.cycles.use_denoising = False
except (AttributeError, TypeError):
    pass
scene.render.resolution_x = 1152 if REAL_MODEL else 720
scene.render.resolution_y = 648 if REAL_MODEL else 405
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
try:
    scene.view_settings.view_transform = "AgX"
except Exception:
    pass
try:
    scene.view_settings.look = "AgX - Medium High Contrast"
except (TypeError, ValueError):
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
    # The source GLB uses +Y up / +Z toward viewers. glTF import converts this to
    # Blender +Z up / -Y toward viewers: (x, source_y, source_z) -> (x, -source_z, source_y).
    # Previous reviews mistakenly pointed the camera from above, at the ceiling truss.
    aim_target = (0, 0.1, 4.4)
    cam = camera("Arena – frontal on-axis hero / authentic wheel", (0, -25.3, 5.0), aim_target, 38)
    print("ARENA_CAMERA_CORRECTED_TO_GLB_BLENDER_AXES", flush=True)
    area("Mega softbox left", (-7, -11, 13), aim_target, (0.94, 0.98, 1.0), 2200, 9, 5)
    area("Chrome reflection strip", (2, -12, 12), aim_target, (1.0, 1.0, 1.0), 2700, 12, 1.4)
    area("Cobalt right light", (9, -5, 9), aim_target, (0.28, 0.64, 1.0), 1800, 6, 5)
    area("Emerald rim light", (-8, 4, 8), aim_target, (0.15, 1.0, 0.58), 1500, 5, 5)
    area("Runway floor sheen", (0, -10, 6), (0, -4, 0.2), (0.5, 0.75, 1.0), 1150, 10, 2)
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


    # SHOWDOWN V4 LOOKDEV: physical studio set, NEVER faking target art as a backdrop.
    # The imported original approved Arena logo texture is retained unchanged.
    import random, math
    random.seed(20261028)
    def v4mat(name,rgb,metal=0,rough=.32,glow=None,power=0):
        m=bpy.data.materials.new('Showdown V4 | '+name);m.use_nodes=True
        p=m.node_tree.nodes.get('Principled BSDF')
        p.inputs['Base Color'].default_value=(*rgb,1)
        p.inputs['Metallic'].default_value=metal
        p.inputs['Roughness'].default_value=rough
        if glow is not None:
            p.inputs['Emission Color'].default_value=(*glow,1)
            p.inputs['Emission Strength'].default_value=power
        return m
    chrome=v4mat('physical chrome',(.52,.70,.84),.93,.20)
    satin=v4mat('brushed stainless steel',(.24,.37,.51),.86,.29)
    graphite=v4mat('deep lacquer',(.003,.012,.035),.52,.25)
    floor_m=v4mat('reflective stage floor',(.008,.026,.064),.74,.135)
    cobalt=v4mat('cobalt lacquer',(.015,.12,.43),.46,.20)
    deepglass=v4mat('dark glass',(.006,.043,.11),.25,.18)
    cyan=v4mat('cobalt LED',(.03,.19,.55),.10,.28,(.04,.48,1),1.35)
    emerald=v4mat('emerald LED',(.016,.23,.135),.08,.30,(.04,.84,.39),1.15)
    ice=v4mat('cool white fixtures',(.8,.91,1),.12,.28,(.62,.85,1),.75)
    dark=v4mat('audience silhouette',(.006,.015,.032),.05,.75)
    audience=v4mat('theater chair upholstery',(.016,.038,.09),.01,.76)
    city=v4mat('city night glass',(.013,.031,.074),.27,.27)
    warm=v4mat('night windows',(.28,.17,.075),.15,.31,(1,.62,.29),.43)
    objects=[]
    def addobj(obj,name,mat):
        obj.name='V4_'+name
        if mat:obj.data.materials.append(mat)
        objects.append(obj)
        return obj
    def box(name,xyz,scale,mat,bevel=0):
        bpy.ops.mesh.primitive_cube_add(size=1,location=xyz)
        ob=bpy.context.object;ob.dimensions=scale
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        if bevel:
            b=ob.modifiers.new('Real machined bevel','BEVEL');b.width=bevel;b.segments=2
            ob.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
        return addobj(ob,name,mat)
    def sphere(name,xyz,r,mat):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=r,location=xyz)
        return addobj(bpy.context.object,name,mat)
    def ring(name,xyz,r,t,mat,vertical=False):
        bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=t,major_segments=96,minor_segments=10,location=xyz)
        ob=bpy.context.object
        if vertical:ob.rotation_euler.x=math.pi/2
        return addobj(ob,name,mat)
    def pipe(name,a,b,r,mat):
        from mathutils import Vector
        a,b=Vector(a),Vector(b);axis=b-a
        bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=r,depth=axis.length,location=(a+b)/2)
        ob=bpy.context.object
        ob.rotation_euler=axis.to_track_quat('Z','Y').to_euler()
        return addobj(ob,name,mat)

    # 01 — continuous mirror-black real stage floor and engraved blue-silver rings.
    box('panoramic studio mirror floor',(0,-1.5,-.153),(22.8,18.6,.044),floor_m,.013)
    for radius,thickness,mat in [(4.35,.048,chrome),(4.53,.043,cyan),(4.86,.02,ice),(5.13,.026,emerald)]:
        ring('machined 3D floor track',(0,-7.1,-.118),radius,thickness,mat)
    for sign in (-1,1):
        box('runway live edge',(sign*3.28,-6.5,-.091),(.055,10.3,.052),chrome,.015)
        box('runway cobalt inset',(sign*3.13,-6.5,-.066),(.033,10.3,.028),cyan)
        # Full-height chrome studio pillars form a complete architectural room.
        box('architectural lighting column',(sign*7.28,1.98,4.79),(.33,.66,7.47),chrome,.075)
        box('column emerald inner light',(sign*7.28,1.60,4.79),(.12,.08,6.91),emerald)
        for row in range(6):
            height=1.15+row*.95
            box('side display fins',(sign*(7.9+.21*(row%3)),2.4,height),(.28,.20,.73),deepglass,.03)
        for height in (1.5,2.4):
            pipe('gallery polished railing',(sign*8.3,-4.7,height),(sign*8.85,6.1,height+.16),.033,satin)
    # 02 — LED media panorama and a procedural city that generates actual geometry.
    box('rear panoramic screen steel casing',(0,10.3,4.13),(23.1,.23,7.65),graphite,.11)
    for side in (-1,1):
        for k in range(8):
            x=side*(6.5+k*.71)
            box('blue city media panel',(x,9.9-k*.09,4.10),(.58,.12,6.75),deepglass,.035)
    for i in range(76):
        x=-11.5+i*23/75
        height=random.uniform(1.1,4.8)
        y=9.16+random.uniform(-.25,.38)
        width=random.uniform(.18,.36)
        box('3D metropolitan tower',(x,y,.55+height/2),(width,.23,height),city)
        if i%6==0:
            pipe('skyline architectural mast',(x,y,.55+height),(x,y,.85+height+random.uniform(.32,.9)),.018,satin)
        for j in range(int(height/.31)):
            if random.random()>.65:
                m=warm if random.random()>.77 else cyan
                box('real emissive window',(x,y-.123,1+j*.31),(.060,.015,.055),m)
    # 03 — 3D audience group instead of the low-detail empty side bleachers.
    for side in (-1,1):
        for row in range(5):
            x=side*(8.17+row*.56)
            depth=5.7-row*.70
            height=.93+row*.38
            box('theater riser',(x,depth,height-.48),(1.35,5.4,.26),graphite)
            for k in range(8):
                if random.random()<.13:continue
                yy=depth-2.4+k*.67
                sphere('crowd head',(x,yy,height+.24),.12,dark)
                person=sphere('crowd shoulders',(x,yy,height-.08),.20,audience)
                person.scale=(.91,.77,.69)
    # 04 — rotor mechanical refinements in genuine 3D, not image decals.
    for rad,rimdepth,ypos,mt in [(2.70,.07,-1.09,chrome),(2.61,.025,-1.17,emerald),
                                  (2.53,.044,-1.23,chrome),(2.42,.025,-1.31,cyan),
                                  (2.17,.017,-1.30,satin),(.68,.035,-1.40,chrome)]:
        ring('precision machined rotor',(0,ypos,4.06),rad,rimdepth,mt,True)
    for n in range(48):
        ang=math.pi*2*n/48
        x=2.61*math.cos(ang);z=4.06+2.61*math.sin(ang)
        sphere('rotor pearl LED lens',(x,-1.27,z),.056,ice)
    # 05 — suspended glossy broadcast halo with coherent chrome reflection geometry.
    for rr,thick,mt,z in [(4.47,.090,chrome,8.39),(4.32,.047,emerald,8.32),
                           (4.16,.030,ice,8.25),(4.55,.021,cyan,8.60)]:
        ring('overhead suspended steel LED ring',(0,1.8,z),rr,thick,mt)
    for n in range(30):
        a=n*2*math.pi/30
        sphere('ceiling spotlight lens',(4.20*math.cos(a),1.8+4.20*math.sin(a),8.15),.065,ice)

    # Cairo typeface from V6 is used for the front-facing 3D art title; logos stay original.
    fontpath=ROOT.parent.parent/'work-site-recovery-v6'/'public'/'fonts'/'cairo-800.ttf'
    if fontpath.is_file():
        cafont=bpy.data.fonts.load(str(fontpath))
        textdat=bpy.data.curves.new('Arena Cairo brand title','FONT')
        textdat.body='TRAINING ARENA'
        textdat.font=cafont;textdat.align_x='CENTER';textdat.size=.35
        textdat.extrude=.003;textdat.bevel_depth=.002
        ob=bpy.data.objects.new('V4_Cairo 3D type specimen',textdat)
        scene.collection.objects.link(ob)
        ob.location=(0,-1.78,7.84)
        ob.rotation_euler=(math.pi/2,0,0)
        ob.data.materials.append(ice)
        objects.append(ob)
    # Less overexposed and more physically directional reflection cards.
    for key,col,energy in [('Mega softbox left',(1.,1.,1.),1250),('Chrome reflection strip',(1.,1.,1.),950),
                            ('Cobalt right light',(.25,.59,1),780),('Emerald rim light',(.16,1.,.56),520),
                            ('Runway floor sheen',(.51,.76,1.),450)]:
        for lamp in scene.objects:
            if lamp.type=='LIGHT' and lamp.name==key:
                lamp.data.energy=energy;lamp.data.color=col
    scene.view_settings.exposure=-.55
    scene.cycles.samples=32
    print('ART_V4_ACTUAL_ADDED_MESHES',len(objects),flush=True)
    print('ART_V4_PRESERVED_EMBEDDED_ARENA_LOGO_AND_CAIRO',flush=True)

blend=OUTPUT / ("Arena_Showdown_V4_Art_Review.blend" if REAL_MODEL else "Cycles_Calibration.blend")
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
scene.render.filepath = str(OUTPUT / ("Arena_Showdown_Actual_Model_Cycles_Front.png" if REAL_MODEL else "Cycles_Calibration.png"))
bpy.ops.render.render(write_still=True)
if REAL_MODEL:
    cam.location=(-6.5,-24.0,8.5); aim(cam, aim_target)
    scene.render.filepath=str(OUTPUT / "Arena_Showdown_V4_Cycles_Crane.png")
    bpy.ops.render.render(write_still=True)
    # Camera 3: focus on the actual mechanical rotor and certified logo texture.
    cam.location=(3.3,-11.0,5.0)
    aim(cam, (0,-0.6,4.06))
    cam.data.lens=46
    scene.render.filepath=str(OUTPUT / "Arena_Showdown_V4_Cycles_Wheel.png")
    bpy.ops.render.render(write_still=True)
print("ARENA_CYCLES_COMPLETE:", "ART_V4_REAL_MODEL" if REAL_MODEL else "CALIBRATION_ONLY", flush=True)
