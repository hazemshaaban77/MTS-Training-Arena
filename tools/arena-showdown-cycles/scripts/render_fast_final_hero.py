"""FAST Stage 1 quality pass: open the already Cycles-verified REAL 3D Blender scene.
Do not rebuild the original 1,368 source meshes and ~1k previously approved lookdev objects.
"""
from pathlib import Path
import bpy, math
from mathutils import Vector
PROJECT=Path(__file__).resolve().parents[1]
OUTPUT=PROJECT/"renders";OUTPUT.mkdir(exist_ok=True)
source=PROJECT/"source_blend"/"Arena_Showdown_Premium_Stage1.blend"
if not source.is_file():raise FileNotFoundError(f"Required genuine saved Blender stage: {source}")
bpy.ops.wm.open_mainfile(filepath=str(source))
scene=bpy.context.scene
cam=scene.camera
if cam is None:raise RuntimeError("Source has no original trained hero camera")
objects=[]
def aim(o,target):
 o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
def v5_material(name,rgb,metal=0.,rough=.3,emit=None,power=0.):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get("Principled BSDF")
 p.inputs["Base Color"].default_value=(*rgb,1)
 p.inputs["Metallic"].default_value=metal
 p.inputs["Roughness"].default_value=rough
 if emit is not None:
  p.inputs["Emission Color"].default_value=(*emit,1)
  p.inputs["Emission Strength"].default_value=power
 return m
def box(name,where,dimensions,mat,bevel=0.):
 bpy.ops.mesh.primitive_cube_add(size=1,location=where)
 ob=bpy.context.object;ob.name=name;ob.dimensions=dimensions
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 ob.data.materials.append(mat)
 if bevel:
  b=ob.modifiers.new("Machined radius","BEVEL");b.width=bevel;b.segments=2
  ob.modifiers.new("Weighted shading","WEIGHTED_NORMAL")
 objects.append(ob);return ob
def pipe(name,origin,destination,radius,mat):
 a=Vector(origin);b=Vector(destination);dif=b-a
 bpy.ops.mesh.primitive_cylinder_add(vertices=14,radius=radius,depth=dif.length,location=(a+b)/2)
 ob=bpy.context.object;ob.name=name;ob.rotation_euler=dif.to_track_quat("Z","Y").to_euler()
 ob.data.materials.append(mat);objects.append(ob);return ob
def area(name,where,target,color,watts,width,height):
 ld=bpy.data.lights.new(name,"AREA");ld.energy=watts;ld.color=color
 ld.shape="RECTANGLE";ld.size=width;ld.size_y=height
 ob=bpy.data.objects.new(name,ld);scene.collection.objects.link(ob)
 ob.location=where;aim(ob,target);return ob
print("STAGE1_SAVED_PREMIUM_SCENE_ACTUALLY_LOADED",len(scene.objects),flush=True)
exec(compile((PROJECT/"scripts"/"showdown_hero_cinema_finish.py").read_text(encoding="utf-8"),"showdown_hero_cinema_finish.py","exec"),globals())
scene.render.engine="CYCLES"
scene.cycles.device="CPU"
scene.render.resolution_x=1440;scene.render.resolution_y=810;scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
blend=OUTPUT/"Arena_Showdown_Stage1_Final_Hero.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
scene.render.filepath=str(OUTPUT/"Arena_Showdown_Stage1_Final_Hero.png")
bpy.ops.render.render(write_still=True)
print("STAGE1_FINAL_HERO_REAL_3D_COMPLETE",flush=True)
