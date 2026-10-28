"""Render generic 6-wheel art labels with ORIGINAL local Cairo font and PIL RAQM.
These 3D textures are only for visual art direction. Trainer-authorable sectors are Phase 2.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, features
root=Path(__file__).resolve().parents[1]
font=root.parents[1]/'work-site-recovery-v6'/'public'/'fonts'/'cairo-800.ttf'
assert font.exists(), f"Missing bundled Cairo: {font}"
assert features.check("raqm"), "Missing RAQM: can't faithfully render Arabic Cairo"
dest=root/'textures'/'cairo_sector_labels'
dest.mkdir(parents=True,exist_ok=True)
names=("سؤال","تحدّي","جائزة","مهمّة","نقاط","مفاجأة")
symbols=("؟","◉","★","✓","+","✦")
for i,(name,symbol) in enumerate(zip(names,symbols)):
    im=Image.new("RGBA",(768,344),(0,0,0,0))
    d=ImageDraw.Draw(im)
    font1=ImageFont.truetype(str(font),113,layout_engine=ImageFont.Layout.RAQM)
    font2=ImageFont.truetype(str(font),145,layout_engine=ImageFont.Layout.RAQM)
    # Draw an emblem/label over the real mesh, retaining transparent margins.
    d.text((384,89),symbol,font=font2,anchor="mm",fill=(240,249,255,249),stroke_width=2,stroke_fill=(6,32,62,180))
    d.text((384,253),name,font=font1,anchor="mm",direction="rtl",language="ar",fill=(255,255,255,255),stroke_width=4,stroke_fill=(7,26,51,248))
    im.save(dest/f"sector_{i:02d}.png",optimize=True)
print("ARENA_V6_TRUE_CAIRO_RAQM_LABELS", len(names), str(font))
