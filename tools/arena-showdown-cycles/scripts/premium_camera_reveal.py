"""Cinematic camera/light entrance on the SAME editable stage-1 Blender model.
This is a 3D camera/light animation; no fake picture footage. 40 actual frames.
"""
import bpy, os, math
from pathlib import Path
from mathutils import Vector
base=Path(__file__).resolve().parents[1]
blend=base/"renders"/"premium"/"Arena_Showdown_Stage1_Master.blend"
assert blend.exists(),blend
bpy.ops.wm.open_mainfile(filepath=str(blend))
scene=bpy.context.scene
out=base/"renders"/"premium"/"camera_sequence"
out.mkdir(parents=True,exist_ok=True)
cam=scene.camera
assert cam and cam.type=="CAMERA"
def orient(location,target):
 cam.location=location
 cam.rotation_euler=(Vector(target)-cam.location).to_track_quat("-Z","Y").to_euler()
for f,loc,look,lens in [
 (1,(-11,-31,9.1),(0,0,5.5),31),
 (18,(-5,-28,7.7),(0,0,5.0),33),
 (40,(-1.4,-27.5,6.5),(0,-.3,5.0),35),
 (76,(0,-28,6.25),(0,-.3,5.0),36.5)]:
 scene.frame_set(f)
 orient(loc,look)
 cam.keyframe_insert("location",frame=f)
 cam.keyframe_insert("rotation_euler",frame=f)
 cam.data.lens=lens
 cam.data.keyframe_insert("lens",frame=f)
# Lighting cues: fade from dim 3D physical stage to full broadcast brightness.
for ob in list(scene.objects):
 if ob.type!="LIGHT":continue
 orig=ob.data.energy
 for f,t in ((1,.017),(10,.035),(25,.34),(42,.84),(60,1),(76,1)):
  ob.data.energy=orig*t
  ob.data.keyframe_insert("energy",frame=f)
# Dim physical LED emission and embedded source-brand logo as part of the intro.
for mat in bpy.data.materials:
 if not mat.use_nodes:continue
 for node in mat.node_tree.nodes:
  if node.type=="BSDF_PRINCIPLED":
   inp=node.inputs.get("Emission Strength")
  elif node.type=="EMISSION": inp=node.inputs.get("Strength")
  else:inp=None
  if inp is None:continue
  baseval=inp.default_value
  if baseval<=0:continue
  for f,t in ((1,.015),(8,.03),(18,.12),(32,.54),(48,1),(76,1)):
   inp.default_value=baseval*t
   inp.keyframe_insert("default_value",frame=f)
scene.render.engine="CYCLES"
scene.render.resolution_x=800
scene.render.resolution_y=450
scene.render.resolution_percentage=100
scene.cycles.samples=6
try: scene.cycles.use_denoising=True
except:pass
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(out/"frame_")
scene.frame_start=1;scene.frame_end=76;scene.frame_step=2
print("ARENA_REAL_3D_CINEMATIC_CAMERA_FRAMES",len(range(1,77,2)),flush=True)
bpy.ops.render.render(animation=True)
print("ARENA_CAMERA_SEQUENCE_COMPLETE",flush=True)
