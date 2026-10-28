"""Bake six purely illustrative wheel-face Cairo textures for art-review.
Real trainer labels will be populated dynamically in Stage 2, not hardcoded here.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,features
root=Path(__file__).resolve().parents[1]
font=root.parent.parent/'work-site-recovery-v6'/'public'/'fonts'/'cairo-800.ttf'
assert font.is_file(),font
out=root/'labels';out.mkdir(exist_ok=True)
names=['سؤال','تحدي','مهمة','جائزة','نقاط','مفاجأة']
ink=[(251,252,255,255),(9,52,93,255),(251,252,255,255),
     (251,252,255,255),(9,52,93,255),(251,252,255,255)]
for i,name in enumerate(names):
    im=Image.new('RGBA',(560,245),(0,0,0,0))
    draw=ImageDraw.Draw(im)
    f=ImageFont.truetype(str(font),102)
    draw.text((280,119),name,font=f,anchor='mm',direction='rtl',fill=ink[i],
              stroke_width=1,stroke_fill=(3,32,67,240) if i not in (1,4) else (246,253,255,150))
    im.save(out/('sector-%d.png'%i))
print('V6_CAIRO_LABELS_RENDERED_WITH_RAQM',features.check('raqm'),len(names))
