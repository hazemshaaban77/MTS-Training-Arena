"""Create correct RTL Cairo wheel-face textures, and retrieve a public-domain Dubai skyline photo for physical LED stage panels."""
from PIL import Image,ImageDraw,ImageFont,features,ImageFilter
from pathlib import Path
import urllib.request,random,json
root=Path(__file__).resolve().parents[1]
out=root/"art_assets";out.mkdir(exist_ok=True)
font=root.parent.parent/"work-site-recovery-v6/public/fonts/cairo-800.ttf"
assert font.exists(), f"Original Cairo 800 font missing at {font}"
assert features.check("raqm"),"Pillow RAQM is required for correctly shaped Arabic letters"
labels=["سؤال","تحدي","مهمة","نقاط","جائزة","مفاجأة"]
for idx,name in enumerate(labels):
 im=Image.new("RGBA",(720,240));d=ImageDraw.Draw(im)
 f=ImageFont.truetype(str(font),94)
 d.text((360,117),name,font=f,anchor="mm",direction="rtl",fill="#ffffff",stroke_width=5,stroke_fill="#00192b")
 im.save(out/f"wheel_label_{idx}.png")
# Public-domain reference: https://commons.wikimedia.org/wiki/File:Dubai_skyline_in_the_evening.jpg
# Author: Lehtm25; public domain. Photograph ONLY shown on digital studio LED screens.
photo=out/"skyline_public_domain.jpg"
url="https://commons.wikimedia.org/wiki/Special:Redirect/file/Dubai_skyline_in_the_evening.jpg?width=1800"
source="Public domain Dubai skyline photograph"
try:
 req=urllib.request.Request(url,headers={"User-Agent":"Arena-Showdown-art-review/1.0 (Blender staged review)"})
 with urllib.request.urlopen(req,timeout=45) as response: data=response.read()
 if len(data)<10000:raise RuntimeError("Image too short")
 photo.write_bytes(data)
 img=Image.open(photo)
 if img.width<800 or img.height<500:raise RuntimeError("Photo dimensions too small")
 img.convert("RGB").save(photo,quality=90)
except Exception as e:
 # Explicit honest fallback, not passed off as photoreal or an actual photo.
 source=f"procedural LED color fallback (photo unavailable: {type(e).__name__})"
 random.seed(19)
 img=Image.new("RGB",(1800,1050))
 px=img.load()
 for y in range(1050):
  for x in range(1800):
   t=y/1050
   px[x,y]=(int(4+10*t),int(22+30*t),int(62+56*t))
 d=ImageDraw.Draw(img)
 for i in range(130):
  x=random.randrange(1800);w=random.randrange(16,60);h=random.randrange(130,620)
  top=990-h
  d.rectangle((x,top,x+w,1050),fill=(5,18+random.randrange(12),39+random.randrange(20)))
  for ry in range(top+12,1020,22):
   for rx in range(x+7,x+w-3,12):
    if random.random()<.35:d.rectangle((rx,ry,rx+4,ry+4),fill=(random.randrange(66,135),random.randrange(124,196),random.randrange(174,237)))
 img.save(photo,quality=90)
(out/"SOURCE_NOTICE.txt").write_text(source+"\\nCairo local font is bundled in MTS Training Arena V6.\\n",encoding="utf8")
print("SHOWDOWN_ART_ASSETS_READY",source,labels,flush=True)
