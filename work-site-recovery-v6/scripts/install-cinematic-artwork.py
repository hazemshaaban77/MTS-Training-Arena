"""Import the ten image-generated 3D cinematic 16:9 WebP cards.

Usage (from repository root):
    python work-site-recovery-v6/scripts/install-cinematic-artwork.py /path/to/MTS_Arena_3D_Activity_Artwork.zip
This script edits only the 10 V6 artwork files and the V6 ActivityArt mapping.
It does not publish the site and never changes older MTS Training Arena releases.
"""
from pathlib import Path
from zipfile import ZipFile
import sys

NAMES = ['quiz','wheel-of-fortune','ultimate-game-show','meta-plan',
         'escape-room','live-poll','order-it','open-the-box','flashcards','scenario-challenge']
BASE = Path(__file__).resolve().parent.parent
DEST = BASE/'public'/'activity-art'
MAPPING = BASE/'components'/'arena'/'ActivityArt.tsx'

def install(zip_path:Path):
    if not zip_path.is_file():
        raise SystemExit('Cannot find image ZIP: '+str(zip_path))
    with ZipFile(zip_path) as archive:
        entries = {p.filename:p for p in archive.infolist() if not p.is_dir()}
        expected={name+'.webp' for name in NAMES}
        if set(entries)!=expected:
            raise SystemExit('ZIP must contain exactly the ten named .webp image assets.')
        for name in NAMES:
            f = entries[name+'.webp']
            if not 1000<=f.file_size<=700_000:
                raise SystemExit('Asset has unexpected size: '+f.filename)
            data=archive.read(f)
            if data[:4]!=b'RIFF' or data[8:12]!=b'WEBP':
                raise SystemExit('Asset is not WebP: '+f.filename)
            (DEST/f.filename).write_bytes(data)
    s=MAPPING.read_text()
    marker="(artwork[normalized]||'quiz')+'.svg'"
    if marker in s:
        MAPPING.write_text(s.replace(marker,"(artwork[normalized]||'quiz')+'.webp'"))
    elif "(artwork[normalized]||'quiz')+'.webp'" not in s:
        raise SystemExit('Unknown ActivityArt mapping. Do not modify.')
    print('Imported ten original 3D artworks; run V6 tests before publishing.')

if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('Usage: install-cinematic-artwork.py /path/to/images.zip')
    install(Path(sys.argv[1]))
