"""Generate REAL Cairo typeface demo-sector textures and licensed LED photo panels.
These are media textures INSIDE actual 3D objects, not a screenshot substituted for 3D.
Pexels photo source: https://www.pexels.com/photo/city-skyscrapers-at-night-17877152/
Photographer: Mo Eid; Pexels free license (may be used for personal/commercial design).
"""
from PIL import Image,ImageDraw,ImageFont,ImageFilter,features
from pathlib import Path
import os,random,math
random.seed(229)
base=Path(__file__).resolve().parents[1]
out=base/"assets"/"premium"
out.mkdir(parents=True,exist_ok=True)
fontpath=base.parents[1]/"work-site-recovery-v6"/"public"/"fonts"/"cairo-800.ttf"
assert fontpath.exists(),("Cairo original font missing",str(fontpath))
print("CAIRO_RAQM",features.check("raqm"))
names=["سؤال","تحدي","مهمة","نقاط","جائزة","مفاجأة"]
glyphs=["؟","✦","✓","★","✧","!"]
for i,word in enumerate(names):
 im=Image.new("RGBA",(768,384),(0,0,0,0))
 dr=ImageDraw.Draw(im)
 face=ImageFont.truetype(str(fontpath),142,layout_engine=ImageFont.Layout.RAQM)
 icon_font=ImageFont.truetype(str(fontpath),72,layout_engine=ImageFont.Layout.RAQM)
 color=(9,47,84,255) if i in (1,4) else (255,255,255,255)
 edge=(240,250,255,210) if i not in (1,4) else (220,240,252,230)
 shadow=Image.new("RGBA",im.size,(0,0,0,0))
 sh=ImageDraw.Draw(shadow)
 sh.text((386,201),word,font=face,fill=(0,10,30,195),stroke_width=7,stroke_fill=(0,10,30,180),anchor="mm",direction="rtl")
 shadow=shadow.filter(ImageFilter.GaussianBlur(5))
 im.alpha_composite(shadow)
 dr=ImageDraw.Draw(im)
 dr.text((384,191),word,font=face,fill=color,stroke_width=2,stroke_fill=edge,anchor="mm",direction="rtl")
 
 im.save(out/("sector_%02d.png"%i))
print("CAIRO_RAQM_LABELS_RENDERED",len(names))
cityfile=out/"night_city.jpg"
source=out/"pexels_source.jpg"
if source.exists() and source.stat().st_size>50000:
 im=Image.open(source).convert("RGB")
 print("CITY_PHOTO_SOURCE",im.size)
 w,h=im.size
 # Cropped as an actual luminous screen panoramic photo texture.
 im=im.resize((1600,max(720,int(h*1600/w))),Image.Resampling.LANCZOS)
 w,h=im.size; im=im.crop((0,max(0,(h-975)//2),1600,max(0,(h-975)//2)+min(h,975)))
 im=im.resize((1600,975),Image.Resampling.LANCZOS)
 # Controlled cool filmic screen tint; original source remains in its own file.
 overlay=Image.new("RGB",im.size,(6,32,82))
 im=Image.blend(im,overlay,.20)
else:
 print("CITY_FALLBACK_GENERATED_NO_EXTERNAL_PHOTO")
 im=Image.new("RGB",(1600,975))
 pix=im.load()
 for y in range(975):
  t=y/974
  for x in range(1600):
   pix[x,y]=(int(3+11*t),int(15+28*t),int(43+36*t))
 draw=ImageDraw.Draw(im)
 for _ in range(140):
  x=random.randrange(1600);y=random.randrange(40,460);r=random.choice([1,2,3])
  draw.ellipse((x-r,y-r,x+r,y+r),fill=(90,130,200))
 for i in range(88):
  x=int(i*1600/87)
  h=random.randrange(140,560)
  w=random.randrange(22,70)
  top=945-h
  draw.rectangle((x,top,x+w,945),fill=(2+random.randrange(5),16+random.randrange(15),37+random.randrange(28)))
  if i%8==0:
   draw.line((x+w//2,top,x+w//2,top-random.randint(35,120)),fill=(120,177,237),width=2)
  for yy in range(top+17,940,20):
   for xx in range(x+5,x+w-2,12):
    if random.random()>.58:
     draw.rectangle((xx,yy,xx+3,yy+7),fill=random.choice([(30,102,178),(60,164,211),(186,172,132)]))
im.save(cityfile,quality=93,optimize=True)
print("CITY_LED_SCREEN_TEXTURE",cityfile.stat().st_size)
