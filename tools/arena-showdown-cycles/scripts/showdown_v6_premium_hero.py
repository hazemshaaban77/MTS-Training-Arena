"""Arena Showdown — premium hero architectural rebuild.
Non-destructive, art-first lookdev. Source GLB remains untouched.
This builds render geometry, NOT the authoritative trainer-configured live wheel.
"""
import bpy,math
from mathutils import Vector
ART_NAME="ARENA_SHOWDOWN_V6_PREMIUM_HERO"
starter=len(objects)
# Corporate PBR colorways. Dial down noisy neon and contrast.
pearl=v5_material("V6 pearlescent titanium",(.62,.77,.89),.86,.22)
polish=v5_material("V6 optical chrome",(.76,.84,.92),.92,.12)
titanium=v5_material("V6 satin graphite titanium",(.065,.10,.16),.83,.27)
marquee=v5_material("V6 navy metallic marquee",(.004,.035,.096),.55,.26)
blackglass=v5_material("V6 deep blue reflective black glass",(.004,.019,.048),.65,.19)
ledb=v5_material("V6 laser blue light strips",(.028,.24,.60),.12,.31,(.055,.42,.94),1.05)
ledg=v5_material("V6 architectural emerald light",(.025,.31,.20),.15,.28,(.03,.63,.31),.85)
frost=v5_material("V6 diffused white light strip",(.66,.80,.92),.12,.32,(.73,.87,1.0),.68)
goldhint=v5_material("V6 restrained champagne pointer",(.58,.46,.24),.82,.23)
# Remove previous rectangular logo billboards from final render; don't delete source.
hidden=0
for ob in scene.objects:
    n=ob.name.lower()
    if (("v5" in n and any(q in n for q in ["hero-logo","large porcelain branding","blue fascia lower","slim green signature","side brushed-aluminum logo","chrome fascia support","original approved arena logo"])) or
        ("v4" in n and any(q in n for q in ["branded masthead","masthead chrome","masthead emerald","original_arena_approved_logo"])) or
        ("v3_approved_logo_masthead" in n) or
        ("v3_oversize_billboard" in n)):
        ob.hide_render=True
        hidden+=1
# Keep original logo visible on the physical central wheel hub and side banners.

def cylinder(name,loc,radius,depth,mat,vertices=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    ob=bpy.context.object;ob.data.materials.append(mat);ob.name="V6_"+name
    ob.modifiers.new("Precision polished normals","WEIGHTED_NORMAL")
    objects.append(ob);return ob

def ring6(name,loc,rad,t,mat):
    ob=ring(name,loc,rad,t,mat)
    return ob

def signage(name,words,location,fontsize,mat,font=None):
    cu=bpy.data.curves.new(name,"FONT")
    cu.body=words
    if font:cu.font=font
    cu.size=fontsize
    cu.align_x="CENTER";cu.align_y="CENTER"
    cu.extrude=.007;cu.bevel_depth=.003
    ob=bpy.data.objects.new("V6_"+name,cu);scene.collection.objects.link(ob)
    ob.location=location;ob.rotation_euler=(math.pi/2,0,0)
    ob.data.materials.append(mat);objects.append(ob)
    return ob
cairo_path=PROJECT.parent.parent/"work-site-recovery-v6"/"public"/"fonts"/"cairo-800.ttf"
font=bpy.data.fonts.load(str(cairo_path)) if cairo_path.is_file() else None
if font:print("V6_CAIRO_ORIGINAL_FONT_LOADED",flush=True)
# Main hero: suspended 3D circular broadcast halo, curved vertical dark fascia.
# Entirely physical chrome/navy components. No flat screenshot or square poster.
r=4.54; cy=0.75; zcenter=9.45
bpy.ops.mesh.primitive_cylinder_add(vertices=144,radius=r,depth=1.24,location=(0,cy,zcenter))
band=bpy.context.object
band.name="V6_SUPERSTRUCTURE_CYLINDRICAL_NAVY_LED_MARQUEE"
band.data.materials.append(marquee)
bevel=band.modifiers.new("machined marquee rim profile","BEVEL");bevel.width=.055;bevel.segments=3
band.modifiers.new("weighted reflective corners","WEIGHTED_NORMAL")
objects.append(band)
for height,radius,thick,mat in [
    (10.11,4.58,.10,polish),(10.01,4.61,.022,ledb),
    (8.82,4.58,.12,pearl),(8.91,4.61,.041,ledg),
    (9.44,4.58,.023,titanium)]:
    ring6("floating ring broadcast structural machining",(0,cy,height),radius,thick,mat)
# Actual curved support diagonals + 8 ceiling fixtures. All ray-traced geometry.
for i in range(12):
    a=2*math.pi*i/12
    x=r*math.cos(a);y=cy+r*math.sin(a)
    pipe("suspended truss rig",(x,y,10.07),(x*.91,y*.91,11.45),.048,pearl)
    if i%2==0:
        cylinder("studio downlight fixture",(x,y,8.64),.15,.20,titanium,24)
        sphere("studio white lens",(x,y,8.48),.12,frost)
# Proper MTS channel name on a curved sign (silver/white on navy), with
# approved logo pixels retained in original wheel hub and side banners.
signage("CHROME MTS MASTHEAD","MTS",(0,-3.88,9.67),1.57,polish,font)
signage("CAIRO TRAINING ARENA","TRAINING ARENA",(0,-3.90,9.02),.46,frost,font)
# Architectural silver proscenium cutouts: brushed steel and lit inlays.
for side in (-1,1):
    # Mount physically curved steel ribs to frame wheel, with one strip per arc.
    for radius,depth,mat in [(3.60,.112,pearl),(3.73,.040,ledb),(3.88,.065,polish)]:
        curve=bpy.data.curves.new("V6 bent studio arch","CURVE")
        curve.dimensions="3D";curve.resolution_u=32
        curve.bevel_depth=depth;curve.bevel_resolution=4
        sp=curve.splines.new("POLY");sp.points.add(48)
        for j,p in enumerate(sp.points):
            t=j/48
            a=t*math.pi*.95
            p.co=(side*radius*math.sin(a),
                  .55+radius*.1*(1-math.cos(a)),
                  4.05+radius*math.cos(a),1)
        ob=bpy.data.objects.new("V6_Architectural_Gate_Curved_Chrome",curve)
        scene.collection.objects.link(ob);ob.data.materials.append(mat);objects.append(ob)
    # Four tall corner marquee columns like the owner-selected final Showdown.
    x=side*6.18
    box("V6 FULL HEIGHT DISPLAY TOWER",(x,-.80,4.33),(1.34,.57,6.64),titanium,.12)
    box("V6 TOWER OPTICAL BLACK",(x,-1.13,4.33),(1.06,.08,6.32),blackglass,.032)
    box("V6 VERTICAL SILVER RAIL",(x+side*.59,-1.16,4.33),(.075,.09,6.58),polish,.019)
    box("V6 VERTICAL GREEN SIGNATURE",(x-side*.60,-1.18,4.33),(.055,.09,5.98),ledg,.017)
    for row in range(18):
        zp=1.52+row*.34
        box("V6 TOWER JEWEL MICRO LED",(x+side*.57,-1.21,zp),(.06,.02,.048),frost,.007)
    # angled broadcast desk with curved silver feet; mostly dark lacquer
    px=side*7.5
    box("V6 PRESENTER BROADCAST DESK",(px,-7.12,.49),(2.36,1.22,.97),blackglass,.14)
    box("V6 PRESENTER GREEN DIAGONAL",(px,-7.77,.45),(1.76,.08,.15),ledg,.02)
    box("V6 PRESENTER CHROME DESK EDGE",(px,-7.80,1.01),(2.42,.10,.065),polish,.019)

# Rebuild the two actual 3D media walls as luminous, physically layered set panels.
# The hand-built skyline, window geometry and gradient emissive screen are genuine
# 3D stage objects; no photo of the selected reference is pasted as a fake scene.
import random
random.seed(30729)
ledsky=v5_material("V6.1 city broadcast luminous deep blue",(0.012,.10,.29),.05,.48,(.045,.20,.52),.83)
nightcity=v5_material("V6.1 steel blue buildings",(.013,.023,.049),.42,.41)
nightglass=v5_material("V6.1 lit city glass",(.018,.13,.28),.22,.28,(.12,.29,.65),.77)
warmglass=v5_material("V6.1 selected warm glass",(.25,.20,.12),.1,.23,(.95,.64,.27),.70)
citytrim=v5_material("V6.1 light roofline",(.22,.37,.55),.56,.31,(.22,.52,.91),.30)
for side in (-1,1):
    mid=side*8.90
    box("V6.1 CINEMATIC LED CITY WALL",(mid,-2.15,4.26),(4.35,.16,5.62),ledsky,.08)
    box("V6.1 OUTER CHROME PANORAMA FRAME",(mid,-2.35,7.16),(4.52,.11,.075),polish,.02)
    box("V6.1 LOWER CHROME PANORAMA FRAME",(mid,-2.35,1.39),(4.52,.11,.074),polish,.02)
    # Night skyline with true extruded building masses & lit individual windows.
    for k in range(29):
        x=mid-2.0+k*.143
        ht=random.uniform(.78,3.26)
        box("V6.1 physically extruded illuminated city tower",(x,-2.32,1.50+ht*.5),(.115,.12,ht),nightcity)
        if k%7==0:
            pipe("V6.1 city spire",(x,-2.29,1.50+ht),(x,-2.29,1.81+ht+.26),.014,citytrim)
        for j in range(max(1,int(ht/.33))):
            if random.random()<.54:
                z=1.67+j*.32
                box("V6.1 lit window physical glass",(x,-2.392,z),(.035,.018,.042),
                    warmglass if (k+j)%9==0 else nightglass,.004)
    for row in range(4):
        z=1.76+row*1.17
        box("V6.1 cobalt media image scanline",(mid,-2.44,z),(4.04,.016,.024),citytrim,.008)

# Mechanical 3D precision wheel wheel expands radiance but keeps source sector art.
# This is stage-1 static art; actual dynamic trainer-created wedges remain in stage 2.
for rad,thick,y,mat in [(3.00,.11,-2.04,polish),(2.92,.041,-2.12,ledb),
                        (2.86,.035,-2.15,pearl),(2.72,.028,-2.14,ledg),
                        (2.55,.035,-2.08,polish)]:
    q=ring6("TITANIUM WHEEL PRECISION ROTOR",(0,y,4.06),rad,thick,mat)
    q.rotation_euler.x=math.pi/2
for k in range(60):
    a=k*math.tau/60
    x=2.96*math.sin(a);z=4.06+2.96*math.cos(a)
    sphere("wheel machined platinum light lens",(x,-2.16,z),.040,frost)
# Shaped champagne arrow pointing down at the top wedge, as in the reference.
bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.27,radius2=0,depth=.58,location=(0,-2.48,7.38))
pointer=bpy.context.object
pointer.name="V6_CHAMPAGNE_PHYSICAL_ROTARY_INDICATOR"
pointer.rotation_euler.y=math.pi
pointer.data.materials.append(goldhint)
objects.append(pointer)
# Floor rings centered BELOW wheel are physically inset; not drawn over render.
for rr,t,mat in [(4.55,.047,polish),(4.70,.040,ledb),(5.08,.065,titanium),(5.22,.029,ledg)]:
    ring6("REAL MIRROR GLASS FLOOR INLAY",(0,-7.10,-.10),rr,t,mat)
# Balanced studio exposure and keylights to preserve legibility.
for ob in scene.objects:
    if ob.type=="LIGHT":
        if "Mega softbox" in ob.name:ob.data.energy=1150
        if "Chrome reflection strip" in ob.name:ob.data.energy=850
        if "overhead broad reflection" in ob.name:ob.data.energy=1050
        if "V5 left warm-white TV key" in ob.name:ob.data.energy=900
scene.view_settings.exposure=-.28
# Distinct camera composition; clean 16:9 full-screen projector safe margins.
cam.location=(0,-26.6,6.55)
aim(cam,(0,-.5,4.90))
cam.data.lens=33
scene.cycles.samples=64
scene.render.resolution_x=1280;scene.render.resolution_y=720
print(ART_NAME,"ART_OBJECTS",len(objects)-starter,"HIDDEN_OLD_SIGNAGE",hidden,flush=True)
print("ARENA_V6_HERO_ART_COMPLETE",flush=True)
