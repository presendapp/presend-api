"""Génère les fichiers de test binaires utilisés par test.js.
Committé dans le dépôt (contrairement aux fichiers eux-mêmes, jamais
versionnés puisqu'ils sont regénérés à chaque exécution des tests) --
corrige le vrai problème trouvé le 13/09 : ces fixtures n'existaient
que par accident dans /tmp d'une session précédente, jamais reproductibles.
"""
import os
from PIL import Image
from PIL.ExifTags import Base
import piexif
import qrcode
from reportlab.pdfgen import canvas

FIXTURES_DIR = '/tmp/test-fixtures'
os.makedirs(FIXTURES_DIR, exist_ok=True)

def path(name):
    return os.path.join(FIXTURES_DIR, name)

# 1. photo.jpg -- une vraie image JPEG avec de vraies métadonnées EXIF (pour cleanImage)
img = Image.new('RGB', (200, 150), color=(100, 150, 200))
exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}
exif_dict["0th"][piexif.ImageIFD.Make] = b"TestCamera"
exif_dict["GPS"][piexif.GPSIFD.GPSLatitude] = ((48, 1), (51, 1), (0, 1))
exif_bytes = piexif.dump(exif_dict)
img.save(path('photo.jpg'), 'jpeg', exif=exif_bytes)

# 2 & 3. doc1.pdf, doc2.pdf -- deux PDF valides simples (pour mergeAndCompressPdf, malwareCheck)
for name, text in [('doc1.pdf', 'Document de test 1'), ('doc2.pdf', 'Document de test 2')]:
    c = canvas.Canvas(path(name))
    c.drawString(100, 750, text)
    c.save()

# 4 & 5. similar_a.png + similar_a2.jpg -- une image et sa quasi-jumelle recompressée (pour imageSimilarity)
base = Image.new('RGB', (300, 300), color=(200, 50, 50))
base.save(path('similar_a.png'), 'png')
base.save(path('similar_a2.jpg'), 'jpeg', quality=70)  # recompressée, légèrement différente

# 6. qr_url.png -- un vrai QR code encodant une URL (pour qrScan)
qr = qrcode.make('https://presend.pages.dev')
qr.save(path('qr_url.png'))

# 7. photo.png -- un JPEG réel mais enregistré sous une extension .png (pour fileType, détection de type réel)
img.save(path('photo.png'), 'png')  # vrai PNG -- le test appelle fileType(buf, 'image/jpeg') pour tester la détection de non-concordance côté API, pas l'extension du fichier

print("Fixtures générées:")
for f in sorted(os.listdir(FIXTURES_DIR)):
    size = os.path.getsize(path(f))
    print(f"  {f} ({size} octets)")
