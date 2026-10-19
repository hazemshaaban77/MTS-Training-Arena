"""Prepare transparency-preserving, tightly-cropped COPIES of the approved logos.

Never redraw brand lettering, replace its proportions, or touch mts.png/training.png.
Remove near-white matte pixels only; keep meaningful gray and blue shadow pixels.
"""
from pathlib import Path
from PIL import Image
import hashlib

# Retains the original pixel colors on opaque strokes.
ROOT=Path('work-site-recovery-v6/public')
for name in ['mts','training']:
    source=ROOT / f'{name}.png'
    image=Image.open(source).convert('RGBA')
    px=image.load()
    for y in range(image.height):
        for x in range(image.width):
            r,g,b,a=px[x,y]
            low=min(r,g,b)
            high=max(r,g,b)
            # Background white or near-white. Leave saturated logo pigments untouched.
            if low>=248:
                px[x,y]=(r,g,b,0)
            elif low>=229 and high-low<=20:
                # Edge antialiasing: fade nearly white matte to transparency.
                opacity=round((248-low)*255/19)
                if opacity:
                    # Account for the source image's original white matte.
                    alpha=opacity/255
                    rr=round(max(0,min(255,(r-255*(1-alpha))/alpha)))
                    gg=round(max(0,min(255,(g-255*(1-alpha))/alpha)))
                    bb=round(max(0,min(255,(b-255*(1-alpha))/alpha)))
                    px[x,y]=(rr,gg,bb,opacity)
                else:
                    px[x,y]=(r,g,b,0)
    bounds=image.getchannel('A').getbbox()
    if bounds is None: raise RuntimeError(f'{name} became empty')
    # 2.5% visual breathing space, rather than the huge original white margins.
    cropped=image.crop(bounds)
    pad=max(10,round(max(cropped.size)*.025))
    final=Image.new('RGBA',(cropped.width+pad*2,cropped.height+pad*2),(0,0,0,0))
    final.paste(cropped,(pad,pad))
    dest=ROOT/f'{name}-transparent.png'
    final.save(dest,optimize=True)
    assert final.getpixel((0,0))[3] == 0
    print(f'{source.name}: {image.size} -> {dest.name}: {final.size}, sha256={hashlib.sha256(dest.read_bytes()).hexdigest()}')
