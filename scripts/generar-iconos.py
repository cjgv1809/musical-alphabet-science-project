"""Genera los iconos PNG de la app (PWA y apple-touch-icon) con Pillow.

Uso:  python scripts/generar-iconos.py
La geometría replica public/favicon.svg (nota musical blanca sobre fondo
ámbar). Los PNG se escriben en public/.
"""
from pathlib import Path

from PIL import Image, ImageDraw

FONDO = (154, 85, 24, 255)  # #9a5518 (--accent-inst)
BLANCO = (255, 255, 255, 255)
BASE = 512  # el diseño está dibujado sobre 512 x 512
SUPERMUESTREO = 4  # dibuja más grande y reduce: bordes suaves


def bezier(p0, p1, p2, p3, pasos=24):
    puntos = []
    for i in range(pasos + 1):
        t = i / pasos
        u = 1 - t
        x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        puntos.append((x, y))
    return puntos


def dibujar(tamano, maskable=False):
    """Icono cuadrado. `maskable`: sin esquinas redondas y nota más pequeña."""
    g = tamano * SUPERMUESTREO
    img = Image.new('RGBA', (g, g), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        d.rectangle((0, 0, g, g), fill=FONDO)
    else:
        d.rounded_rectangle((0, 0, g - 1, g - 1), radius=g * 112 // 512, fill=FONDO)

    # La nota se dibuja en un lienzo de 512 y se escala (menos en maskable,
    # que debe caber en la "zona segura" central del 80 %).
    escala = g / BASE * (0.78 if maskable else 1.0)
    desplazar = (g - BASE * escala) / 2

    def P(x, y):
        return (desplazar + x * escala, desplazar + y * escala)

    # Cabeza: elipse rotada -20 grados, como polígono.
    import math
    cx, cy, rx, ry, ang = 196, 354, 68, 52, math.radians(-20)
    cabeza = []
    for i in range(72):
        a = 2 * math.pi * i / 72
        x, y = rx * math.cos(a), ry * math.sin(a)
        cabeza.append(P(cx + x * math.cos(ang) - y * math.sin(ang),
                        cy + x * math.sin(ang) + y * math.cos(ang)))
    d.polygon(cabeza, fill=BLANCO)
    # Plica.
    d.rectangle((*P(236, 116), *P(264, 354)), fill=BLANCO)
    # Corchete: dos curvas cúbicas unidas.
    c1 = bezier((264, 116), (330, 132), (384, 170), (372, 252))
    c2 = bezier((372, 252), (350, 204), (316, 192), (264, 188))
    d.polygon([P(*p) for p in c1 + c2], fill=BLANCO)

    return img.resize((tamano, tamano), Image.LANCZOS)


def main():
    destino = Path(__file__).resolve().parent.parent / 'public'
    salidas = {
        'icon-192.png': dibujar(192),
        'icon-512.png': dibujar(512),
        'icon-maskable-512.png': dibujar(512, maskable=True),
        'apple-touch-icon.png': dibujar(180, maskable=True),  # iOS recorta solo
    }
    for nombre, imagen in salidas.items():
        imagen.save(destino / nombre, optimize=True)
        print('escrito', nombre)


if __name__ == '__main__':
    main()
