#!/usr/bin/env python3
"""Robo Groove art script (NerdHomies style: ink outlines, flat fill + one shine,
soft shade for volume, radial ground shadows, faces with cheeks).
Writes:  ../stage.html  (the stage section with every character as inline SVG, animatable by class)
         sheet.html     (contact sheet to screenshot and check)
         svg/<name>.svg (standalone sprites)"""
import os, math
HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE, "svg"), exist_ok=True)
INK = "#231B33"
CHEEK = '#FF9DBE'

DEFS = f'''<defs>
<radialGradient id="rgShine" cx=".32" cy=".26" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="rgShade" cx=".72" cy=".82" r=".75"><stop offset=".35" stop-color="{INK}" stop-opacity="0"/><stop offset="1" stop-color="{INK}" stop-opacity=".28"/></radialGradient>
<radialGradient id="rgShadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0D0818" stop-opacity=".55"/><stop offset="1" stop-color="#0D0818" stop-opacity="0"/></radialGradient>
<radialGradient id="rgGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
<linearGradient id="lgGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1A8"/><stop offset=".55" stop-color="#FFD23F"/><stop offset="1" stop-color="#FF9F1C"/></linearGradient>
<linearGradient id="lgPink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD6EC"/><stop offset=".55" stop-color="#FF7AC6"/><stop offset="1" stop-color="#E0479E"/></linearGradient>
<linearGradient id="lgChrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#C9D3E0"/><stop offset="1" stop-color="#8D99AE"/></linearGradient>
<linearGradient id="lgWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9C5A2B"/><stop offset=".45" stop-color="#D98C4A"/><stop offset="1" stop-color="#8A4C22"/></linearGradient>
<radialGradient id="rgSunburst" cx=".45" cy=".5" r=".6"><stop offset="0" stop-color="#FFD23F"/><stop offset=".55" stop-color="#FF8A3D"/><stop offset="1" stop-color="#B84A1B"/></radialGradient>
<clipPath id="foxVestClip"><ellipse cx="134" cy="198" rx="44" ry="52"/></clipPath>
</defs>'''

def attrs(d): return " ".join(f'{k.replace("_","-")}="{v}"' for k, v in d.items())
def shp(tag, a, fill, sw=3.5, shine=True, shade=True, cls=None, extra=""):
    """outlined shape + soft shade + one shine, all from the same geometry"""
    A = attrs(a); c = f' class="{cls}"' if cls else ""
    s = f'<{tag} {A} fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"{c}{extra}/>'
    if shade: s += f'<{tag} {A} fill="url(#rgShade)" pointer-events="none"/>'
    if shine: s += f'<{tag} {A} fill="url(#rgShine)" pointer-events="none"/>'
    return s
def circ(cx, cy, r, fill, **k): return shp("circle", dict(cx=cx, cy=cy, r=r), fill, **k)
def ell(cx, cy, rx, ry, fill, **k): return shp("ellipse", dict(cx=cx, cy=cy, rx=rx, ry=ry), fill, **k)
def rect(x, y, w, h, rx, fill, **k): return shp("rect", dict(x=x, y=y, width=w, height=h, rx=rx), fill, **k)
def path(d, fill, **k): return shp("path", dict(d=d), fill, **k)
def limb(x1, y1, x2, y2, w, fill):
    """an outlined tube (arm/leg/stick): ink stroke under a colored stroke"""
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{INK}" stroke-width="{w+6}" stroke-linecap="round"/>'
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{fill}" stroke-width="{w}" stroke-linecap="round"/>')
def shadow(cx, cy, rx, ry): return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#rgShadow)"/>'
def eye(cx, cy, r=6):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{INK}"/><circle cx="{cx-r*.35:.1f}" cy="{cy-r*.35:.1f}" r="{r*.38:.1f}" fill="#fff"/>'
def cheeks(x1, x2, y, rx=8, ry=5): return f'<ellipse cx="{x1}" cy="{y}" rx="{rx}" ry="{ry}" fill="{CHEEK}" opacity=".7"/><ellipse cx="{x2}" cy="{y}" rx="{rx}" ry="{ry}" fill="{CHEEK}" opacity=".7"/>'
def smile(x, y, w=9, sw=3.5): return f'<path d="M{x-w} {y} q{w} {w*.9} {w*2} 0" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>'
def g(body, cls=None, origin=None, extra=""):
    c = f' class="{cls}"' if cls else ""; o = f' style="transform-origin:{origin[0]}px {origin[1]}px"' if origin else ""
    return f"<g{c}{o}{extra}>{body}</g>"
def star(cx, cy, r1, r2, fill, sw=2.5):
    pts = []
    for i in range(10):
        a = -math.pi/2 + i*math.pi/5; r = r1 if i % 2 == 0 else r2
        pts.append(f"{cx + r*math.cos(a):.1f},{cy + r*math.sin(a):.1f}")
    return shp("polygon", dict(points=" ".join(pts)), fill, sw=sw, shade=False)
def stand(x, y1, y2): return limb(x, y1, x, y2, 3, "#B8C2D3") + limb(x-14, y2, x, y2-14, 2.5, "#B8C2D3") + limb(x+14, y2, x, y2-14, 2.5, "#B8C2D3")

CH = {}   # name -> (viewBox, body, extra svg attrs)

# ------------------------------------------------------------------ TEDDY BEAR on drums
FUR, BELLY = "#C08552", "#F0D2A8"
bear = shadow(130, 289, 118, 10)
bear += stand(226, 128, 286) + g(ell(226, 118, 36, 8, "url(#lgGold)", sw=3) + ell(226, 116, 6, 2.5, "#FFF1A8", shine=False, shade=False, sw=2),
                                 cls="crash tapx", origin=(226, 120), extra=' data-hit="x"')
bear += g(ell(130, 184, 58, 58, FUR) + ell(130, 196, 36, 38, BELLY, shade=False), cls="bBody")
head = (circ(86, 60, 20, FUR) + circ(86, 60, 10, BELLY, shine=False, shade=False, sw=2.5) +
        circ(174, 60, 20, FUR) + circ(174, 60, 10, BELLY, shine=False, shade=False, sw=2.5) +
        circ(130, 98, 50, FUR) + ell(130, 120, 25, 18, BELLY, shade=False) +
        ell(130, 110, 10, 7, "#4A2C1A", sw=2.5, shade=False) + eye(108, 90) + eye(152, 90) +
        smile(130, 124, 7, 3) + cheeks(100, 160, 112))
bear += g(head, cls="bHead", origin=(130, 150))
bear += stand(205, 186, 286) + g(ell(205, 184, 35, 7, "url(#lgGold)", sw=3) + ell(205, 176, 35, 7, "url(#lgGold)", sw=3),
                                 cls="hat taph", origin=(205, 182), extra=' data-hit="h"')
bear += stand(58, 238, 286) + g(rect(22, 214, 72, 26, 5, "#2FB5A8") + rect(20, 210, 76, 7, 3, "url(#lgChrome)", sw=2.5, shade=False) +
                                rect(20, 236, 76, 6, 3, "url(#lgChrome)", sw=2.5, shade=False) + ell(58, 211, 37, 9, "#FFF6E4", sw=3),
                                cls="snare taps", origin=(58, 226), extra=' data-hit="s"')
bear += g(limb(90, 152, 66, 196, 20, FUR) + limb(64, 196, 36, 214, 4, "#F3D19C") + circ(66, 196, 10, FUR, sw=3), cls="bArmL", origin=(90, 152))
bear += g(limb(170, 152, 194, 188, 20, FUR) + limb(196, 188, 226, 172, 4, "#F3D19C") + circ(194, 188, 10, FUR, sw=3), cls="bArmR", origin=(170, 152))
bear += g(rect(106, 178, 48, 20, 5, "#6C5CE7") + ell(130, 178, 25, 7, "#FFF6E4", sw=3), cls="tom tapt", origin=(130, 188), extra=' data-hit="t"')
kick = (circ(130, 240, 50, "#FF5D73", sw=4) + circ(130, 240, 41, "#FFF6E4", shade=False, sw=3) +
        star(130, 240, 22, 10, "#FFD23F") + "".join(
            f'<circle cx="{130+46*math.cos(a):.1f}" cy="{240+46*math.sin(a):.1f}" r="3" fill="url(#lgChrome)" stroke="{INK}" stroke-width="1.5"/>'
            for a in [i*math.pi/4 for i in range(8)]))
bear += g(kick, cls="kick tapk", origin=(130, 240), extra=' data-hit="k"')
CH["bear"] = ("0 0 260 300", bear, 'data-tab="drums" aria-label="Teddy bear drummer"')

# ------------------------------------------------------------------ FAIRY on keyboard
SKIN, HAIR, DRESS = "#FFE0C7", "#FF8FC7", "#B98CFF"
wing = lambda cx, cy, rx, ry, rot: (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" transform="rotate({rot} {cx} {cy})" fill="#BDF0FF" fill-opacity=".72" stroke="{INK}" stroke-width="2.5"/>'
                                     f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" transform="rotate({rot} {cx} {cy})" fill="url(#rgShine)"/>')
fairy = shadow(130, 290, 112, 10)
body = g(wing(88, 118, 40, 26, -25) + wing(172, 118, 40, 26, 25) + wing(96, 160, 26, 16, 20) + wing(164, 160, 26, 16, -20), cls="wings", origin=(130, 140))
body += path("M130 116 C112 116 104 150 92 212 Q130 226 168 212 C156 150 148 116 130 116 Z", DRESS)
body += path("M130 118 C120 120 114 140 110 168 L150 168 C146 140 140 120 130 118 Z", "#D8C2FF", shade=False, sw=2.5)
fh = (circ(130, 70, 40, HAIR) + circ(130, 28, 15, HAIR) + circ(130, 82, 29, SKIN, shade=False) +
      path("M102 70 Q116 44 130 52 Q144 44 158 70 Q144 60 130 64 Q116 60 102 70 Z", HAIR, sw=3, shade=False) +
      star(130, 42, 10, 4.5, "#FFD23F", sw=2) + eye(119, 82, 5) + eye(141, 82, 5) + smile(130, 95, 6, 3) + cheeks(111, 149, 92, 6, 4))
body += g(fh, cls="fHead", origin=(130, 112))
body += g(limb(114, 136, 98, 194, 8, SKIN) + circ(98, 196, 6, SKIN, sw=2.5, shade=False), cls="fHandL", origin=(114, 136))
body += g(limb(146, 136, 162, 194, 8, SKIN) + circ(162, 196, 6, SKIN, sw=2.5, shade=False), cls="fHandR", origin=(146, 136))
fairy += g(body, cls="fairyFloat", origin=(130, 150))
fairy += limb(64, 240, 52, 286, 4, "#B8C2D3") + limb(196, 240, 208, 286, 4, "#B8C2D3") + limb(60, 280, 200, 250, 3, "#B8C2D3")
fairy += rect(24, 194, 212, 48, 10, "#6C5CE7", sw=4)
WHITE_MIDI = [60,62,64,65,67,69,71,72,74,76,77,79,81,83]
kx0, kw = 32, 14
keys = ""
for i, m in enumerate(WHITE_MIDI):
    keys += f'<rect class="wk pk" data-midi="{m}" x="{kx0+i*kw}" y="203" width="{kw-1}" height="31" rx="2.5" fill="#FFF6E4" stroke="{INK}" stroke-width="1.8"/>'
for i, m in enumerate(WHITE_MIDI[:-1]):
    if m % 12 in (0, 2, 5, 7, 9):
        keys += f'<rect class="bk pk" data-midi="{m+1}" x="{kx0+i*kw+kw-4.5}" y="203" width="8" height="18" rx="2" fill="{INK}"/>'
fairy += g(keys, cls="keys")
fairy += '<g class="sparkles"></g>'
CH["fairy"] = ("0 0 260 300", fairy, 'data-tab="keys" aria-label="Fairy keyboard player"')

# ------------------------------------------------------------------ MR. SLOW the turtle on bongos
TSKIN, SHELL, PLATE, BELLYT = "#8FD16A", "#3F8F3A", "#67BE4A", "#F3E7B1"
tur = shadow(130, 290, 108, 10)
tur += limb(104, 250, 98, 280, 20, TSKIN) + limb(156, 250, 162, 280, 20, TSKIN)
tur += ell(96, 284, 16, 8, TSKIN, sw=3) + ell(164, 284, 16, 8, TSKIN, sw=3)
shell = path("M62 238 C52 170 80 124 130 122 C180 124 208 170 198 238 Q130 258 62 238 Z", SHELL, sw=4)
hexes = ""
for cx, cy, r in [(84,176,16),(176,176,16),(78,214,13),(182,214,13)]:
    pts = " ".join(f"{cx + r*math.cos(math.pi/6 + i*math.pi/3):.1f},{cy + r*math.sin(math.pi/6 + i*math.pi/3):.1f}" for i in range(6))
    hexes += shp("polygon", dict(points=pts), PLATE, sw=2.5, shade=False)
tur += g(shell + hexes, cls="shell", origin=(130, 240))
tur += path("M96 150 C92 190 96 226 130 236 C164 226 168 190 164 150 C150 140 110 140 96 150 Z", BELLYT, sw=3.5)
tur += f'<path d="M100 178 H160 M98 204 H162" stroke="{INK}" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>'
th = (limb(130, 150, 130, 112, 30, TSKIN) + circ(130, 84, 36, TSKIN) +
      f'<circle cx="116" cy="84" r="12" fill="#fff" fill-opacity=".35" stroke="{INK}" stroke-width="3.5"/><circle cx="144" cy="84" r="12" fill="#fff" fill-opacity=".35" stroke="{INK}" stroke-width="3.5"/>'
      f'<path d="M128 84 h4" stroke="{INK}" stroke-width="3"/>'
      + eye(116, 87, 4.5) + eye(144, 87, 4.5) +
      f'<path d="M105 81 Q116 75 127 81 M133 81 Q144 75 155 81" fill="{TSKIN}" stroke="{INK}" stroke-width="2.5"/>'   # sleepy lids
      + smile(130, 103, 7, 3) + cheeks(104, 156, 98, 6, 4) +
      path("M100 64 Q130 34 160 64 Q130 56 100 64 Z", "#FF8A3D", sw=3, shade=False))  # little cap
tur += g(th, cls="tHead", origin=(130, 140))
bongo = lambda cx, top, rx, h, cls, hit: g(
    path(f"M{cx-rx} {top} L{cx-rx*.72} {top+h} L{cx+rx*.72} {top+h} L{cx+rx} {top} Z", "url(#lgWood)", sw=3.5) +
    rect(cx-rx-1, top+h*.45, rx*2+2, 6, 3, "url(#lgChrome)", sw=2, shade=False) +
    ell(cx, top, rx, rx*.3, "#FFF6E4", sw=3.5), cls=f"{cls} tapb", origin=(cx, top + h/2), extra=f' data-hit="{hit}"')
tur += rect(116, 236, 28, 14, 4, "url(#lgWood)", sw=3, shade=False)
tur += bongo(100, 222, 28, 40, "bongoHi", "hi") + bongo(162, 218, 34, 46, "bongoLo", "lo")
tur += g(limb(100, 168, 98, 214, 14, TSKIN) + ell(98, 216, 11, 8, TSKIN, sw=3), cls="tArmL", origin=(100, 168))
tur += g(limb(160, 168, 162, 210, 14, TSKIN) + ell(162, 212, 11, 8, TSKIN, sw=3), cls="tArmR", origin=(160, 168))
CH["turtle"] = ("0 0 260 300", tur, 'data-tab="bongos" aria-label="Mr. Slow the turtle on bongos"')

# ------------------------------------------------------------------ ROBOTS (same rig as before, restyled)
def robotA():
    T, TD, G = "#36D1C4", "#1D7D75", "#6B7C8F"
    s = shadow(150, 345, 100, 12) + '<g class="mover"><g class="rig">'
    s += g(rect(110, 272, 26, 54, 8, G) + rect(96, 318, 52, 20, 10, "#3E4C5E"), cls="legL")
    s += g(rect(164, 272, 26, 54, 8, G) + rect(152, 318, 52, 20, 10, "#3E4C5E"), cls="legR")
    s += rect(136, 140, 28, 26, 4, G, shade=False)
    s += g(rect(84, 160, 132, 120, 22, T, sw=4) + rect(108, 186, 84, 54, 12, "#2B2440", shine=False, shade=False) +
           '<circle class="pl" cx="127" cy="213" r="9" fill="#FF5D73"/><circle class="pl" cx="150" cy="213" r="9" fill="#FFD166"/><circle class="pl" cx="173" cy="213" r="9" fill="#06D6A0"/>'
           + rect(118, 252, 64, 8, 4, TD, shine=False, shade=False, sw=2), cls="torso")
    hd = (limb(150, 40, 150, 62, 4, G) + '<circle class="antGlow" cx="150" cy="34" r="22" fill="url(#rgGlow)" opacity=".0"/>' +
          circ(150, 34, 12, "#FF5D73", cls="light") + rect(66, 88, 18, 34, 6, G) + rect(216, 88, 18, 34, 6, G) +
          rect(80, 60, 140, 88, 24, T, sw=4) +
          g(circ(120, 98, 17, "#fff", shade=False) + eye(120, 98, 8) + circ(180, 98, 17, "#fff", shade=False) + eye(180, 98, 8), cls="eyes") +
          rect(124, 124, 52, 11, 5, "#2B2440", shine=False, shade=False, sw=2.5) + cheeks(100, 200, 122, 9, 5) +
          f'<circle class="antenna" cx="150" cy="34" r="24" fill="transparent"/>')
    s += g(hd, cls="head")
    s += g(rect(58, 168, 26, 92, 13, "#2BB5A8", sw=3.5) + circ(71, 268, 17, "#FFD166"), cls="armL")
    s += g(rect(216, 168, 26, 92, 13, "#2BB5A8", sw=3.5) + circ(229, 268, 17, "#FFD166"), cls="armR")
    return s + "</g></g>"
def robotB():
    P, PD = "#FF8FAB", "#C9184A"
    s = shadow(150, 345, 85, 12) + '<g class="mover"><g class="rig">'
    s += g(rect(128, 268, 44, 30, 6, "#7A6A8C") + circ(150, 314, 27, "#2B2440", sw=4) + circ(150, 314, 11, "#FFD166", sw=3), cls="legs")
    s += g(ell(150, 216, 68, 64, P, sw=4) + circ(150, 214, 27, "#2B2440", shine=False, shade=False) +
           '<path class="pl" d="M150 228 l-14 -14 a8 8 0 0 1 14 -10 a8 8 0 0 1 14 10 z" fill="#FF5D73"/>', cls="torso")
    hd = (limb(118, 52, 104, 26, 4, "#7A6A8C") + limb(182, 52, 196, 26, 4, "#7A6A8C") +
          circ(102, 22, 10, "#7DF9FF", cls="light") + circ(198, 22, 10, "#7DF9FF", cls="light") +
          circ(150, 100, 62, P, sw=4) + rect(100, 76, 100, 46, 23, "#2B2440", shine=False, shade=False) +
          g(ell(128, 99, 11, 13, "#7DF9FF", sw=0, shade=False) + ell(172, 99, 11, 13, "#7DF9FF", sw=0, shade=False), cls="eyes") +
          cheeks(106, 194, 134, 8, 6) + smile(150, 140, 12, 4.5) +
          '<circle class="antenna" cx="102" cy="22" r="20" fill="transparent"/><circle class="antenna" cx="198" cy="22" r="20" fill="transparent"/>')
    s += g(hd, cls="head")
    s += g(limb(88, 192, 62, 254, 8, "#7A6A8C") + circ(62, 262, 15, "#FFD166"), cls="armL")
    s += g(limb(212, 192, 238, 254, 8, "#7A6A8C") + circ(238, 262, 15, "#FFD166"), cls="armR")
    return s + "</g></g>"
CH["robotA"] = ("0 0 300 360", robotA(), 'data-tab="robot" aria-label="Robot A"')
CH["robotB"] = ("0 0 300 360", robotB(), 'data-tab="robot" aria-label="Robot B"')

# ------------------------------------------------------------------ UNICORN on guitar
WH, MANE = "#FFFFFF", ["#FF7AC6", "#B98CFF", "#4CC9F0", "#FFD23F"]
uni = shadow(130, 290, 100, 10)
tail = path("M172 214 C226 200 236 252 206 286 C214 252 196 236 170 240 Z", MANE[0]) + path("M176 222 C210 218 214 250 198 270 C200 248 188 238 174 236 Z", MANE[1], shade=False, sw=2.5)
uni += g(tail, cls="tail", origin=(172, 214))
uni += rect(102, 232, 22, 52, 10, WH) + rect(136, 232, 22, 52, 10, WH) + rect(100, 274, 26, 14, 6, "#B98CFF") + rect(134, 274, 26, 14, 6, "#B98CFF")
uni += ell(130, 190, 48, 56, WH, sw=4)
uh = (path("M96 54 L90 22 L114 42 Z", WH) + path("M164 54 L170 22 L146 42 Z", WH) +
      "".join(circ(x, y, r, c, shade=False, sw=3) for (x, y, r), c in zip([(94,64,15),(86,86,14),(88,108,13),(96,126,12)], MANE)) +
      ell(130, 88, 40, 38, WH, sw=4) + ell(130, 110, 26, 18, "#FFE5F1", shade=False) +
      f'<circle cx="121" cy="110" r="3" fill="{INK}"/><circle cx="139" cy="110" r="3" fill="{INK}"/>' +
      eye(114, 84, 6) + eye(146, 84, 6) +
      f'<path d="M106 80 l-6 -3 M108 76 l-4 -5 M154 80 l6 -3 M152 76 l4 -5" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>' +
      cheeks(102, 158, 100, 7, 4) + smile(130, 120, 6, 3) +
      circ(116, 62, 11, MANE[0], shade=False, sw=3) + circ(134, 56, 11, MANE[1], shade=False, sw=3) +
      g(path("M120 52 L130 6 L140 52 Z", "url(#lgGold)") + f'<path d="M123 40 L137 35 M125 28 L135 24 M127 17 L133 15" stroke="#E09F3E" stroke-width="3" stroke-linecap="round"/>', cls="horn", origin=(130, 50)))
uni += g(uh, cls="uHead", origin=(130, 130))
gtr = (rect(14, -7, 140, 14, 4, "#8A5A44", sw=3, shade=False) +                       # neck runs into the body
       "".join(f'<line x1="{x}" y1="-6" x2="{x}" y2="6" stroke="#E7D3B5" stroke-width="1.6"/>' for x in range(62, 150, 12)) +
       path("M150 -9 L182 -12 L184 12 L150 9 Z", "#5C3D2E", sw=3, shade=False) +
       "".join(circ(x, y, 3.4, "url(#lgChrome)", sw=1.6, shine=False, shade=False) for x in (160, 170) for y in (-14, 14)) +
       path("M-46 0 C-46 -30 -20 -34 -6 -24 C4 -17 12 -22 24 -24 C42 -28 52 -14 52 0 C52 14 42 28 24 24 C12 22 4 17 -6 24 C-20 34 -46 30 -46 0 Z", "url(#rgSunburst)", sw=4) +
       circ(10, 0, 10, "#3B2314", shine=False, shade=False, sw=3) +
       rect(14, -7, 40, 14, 3, "#8A5A44", sw=3, shine=False, shade=False) +             # fretboard over the body joins it cleanly
       rect(-34, -9, 8, 18, 2, "#5C3D2E", sw=2.5, shine=False, shade=False) +
       "".join(f'<line x1="-30" y1="{y}" x2="152" y2="{y}" stroke="#F5F5F5" stroke-width=".9" opacity=".85"/>' for y in (-4.5, -1.5, 1.5, 4.5)))
uni += g(f'<g transform="translate(116 208) rotate(-28) scale(.92)">{gtr}</g>', cls="guitar tapg", origin=(116, 208))
uni += g(limb(100, 160, 112, 204, 12, WH) + circ(113, 208, 8, "#B98CFF", sw=2.5, shade=False), cls="uStrum", origin=(100, 160))
uni += limb(160, 160, 188, 168, 12, WH) + circ(192, 168, 8, "#B98CFF", sw=2.5, shade=False)
CH["unicorn"] = ("0 0 260 300", uni, 'data-tab="guitar" aria-label="Unicorn guitarist"')

# ------------------------------------------------------------------ MISTER SLY the fox on flute
FX, FXD, CREAM, VEST = "#F28C38", "#C9631F", "#FFF4E6", "#2FB5A8"
fox = shadow(135, 290, 100, 10)
ftail = path("M162 238 C232 250 252 168 214 118 C212 160 196 180 166 202 Z", FX) + path("M214 118 C230 138 232 162 222 178 C210 160 206 138 214 118 Z", CREAM, shade=False, sw=3)
fox += g(ftail, cls="foxTail", origin=(165, 236))
fox += rect(108, 232, 20, 50, 9, FXD) + rect(140, 232, 20, 50, 9, FXD) + ell(117, 284, 15, 7, INK, shine=False, shade=False, sw=2) + ell(151, 284, 15, 7, INK, shine=False, shade=False, sw=2)
fox += ell(134, 198, 44, 52, FX, sw=4, shade=False)
fox += ell(134, 206, 26, 38, CREAM, shine=False, shade=False, sw=2.5)
vest = f'<path d="M80 140 L124 140 L134 200 L144 140 L190 140 L190 260 L80 260 Z" fill="{VEST}" clip-path="url(#foxVestClip)"/>'
vest += f'<path d="M80 140 L124 140 L134 200 L144 140 L190 140 L190 260 L80 260 Z" fill="url(#rgShade)" clip-path="url(#foxVestClip)"/>'
vest += f'<path d="M124 150 L134 200 L144 150" fill="none" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
vest += f'<path d="M134 200 L134 248" stroke="{INK}" stroke-width="2.5" opacity=".6"/>'
vest += circ(134, 214, 3.6, "#FFD23F", sw=2, shade=False) + circ(134, 230, 3.6, "#FFD23F", sw=2, shade=False)
fox += vest + f'<ellipse cx="134" cy="198" rx="44" ry="52" fill="url(#rgShine)"/><ellipse cx="134" cy="198" rx="44" ry="52" fill="none" stroke="{INK}" stroke-width="4"/>'
fh = (path("M100 82 L86 26 L126 64 Z", FX) + path("M168 82 L182 26 L142 64 Z", FX) +
      path("M103 72 L95 42 L117 63 Z", "#4A2C1A", shine=False, shade=False, sw=2) + path("M165 72 L173 42 L151 63 Z", "#4A2C1A", shine=False, shade=False, sw=2) +
      path("M90 100 C90 64 112 58 134 58 C156 58 178 64 178 100 C180 122 160 136 134 146 C108 136 88 122 90 100 Z", FX, sw=4) +
      path("M92 106 C108 112 120 118 134 122 C148 118 160 112 176 106 C170 128 152 140 134 146 C116 140 98 128 92 106 Z", CREAM, shade=False, sw=3) +
      ell(134, 120, 8, 6, INK, shade=False, sw=2) +
      f'<path d="M110 96 q8 -7 16 0 M142 96 q8 -7 16 0" stroke="{INK}" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      f'<path d="M106 84 l18 3 M162 84 l-18 3" stroke="{FXD}" stroke-width="3.5" stroke-linecap="round"/>' + cheeks(108, 160, 110, 7, 4) +
      g(rect(104, 60, 60, 9, 4, "#3A2F52", shade=False) + rect(114, 26, 40, 36, 5, "#3A2F52") + rect(114, 48, 40, 8, 2, "#EF476F", shine=False, shade=False, sw=2.5), cls="foxHat", origin=(134, 66)) +
      path("M120 150 L134 145 L148 150 L148 160 L134 155 L120 160 Z", "#EF476F", sw=2.5, shade=False))
fox += g(fh, cls="foxHead", origin=(134, 150))
fl = (limb(112, 164, 80, 136, 12, FX) + limb(156, 164, 112, 136, 12, FX) +
      rect(28, 127, 116, 11, 5.5, "url(#lgChrome)", sw=3, shade=False) +
      "".join(f'<circle class="fhole" cx="{x}" cy="132.5" r="3" fill="#5B6B7A"/>' for x in (44, 56, 68, 90, 102, 114)) +
      circ(80, 136, 9, FX, sw=3, shade=False) + circ(112, 136, 9, FX, sw=3, shade=False))
fox += g(fl, cls="flute tapf", origin=(134, 132))
fox += '<g class="foxNotes"></g>'
CH["fox"] = ("0 0 260 300", fox, 'data-tab="winds" aria-label="Mister Sly the fox flute player"')

# ------------------------------------------------------------------ TITLE: light-bulb marquee, bow-tie bottom edge
W, H = 560, 132
top, outerB, innerB = 10, 120, 84
panel = f"M18 {top} L{W-18} {top} Q{W-8} {top} {W-8} {top+10} L{W-8} {outerB-6} Q{W-8} {outerB} {W-16} {outerB-2} L{W/2} {innerB} L16 {outerB-2} Q8 {outerB} 8 {outerB-6} L8 {top+10} Q8 {top} 18 {top} Z"
sign = f'<path d="{panel}" fill="#2B1F45" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
sign += f'<path d="{panel}" fill="url(#rgShine)"/>'
inner = f"M28 {top+12} L{W-28} {top+12} L{W-28} {outerB-14} L{W/2} {innerB-12} L28 {outerB-14} Z"
sign += f'<path d="{inner}" fill="none" stroke="#FFD23F" stroke-width="2.5" stroke-linejoin="round" opacity=".7"/>'
# bulbs along the outer border
pts = [(18, top), (W-18, top), (W-8, outerB-6), (W/2, innerB), (8, outerB-6), (18, top)]
bulbs, idx = "", 0
for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
    L = math.hypot(x2-x1, y2-y1); n = max(1, int(L // 20))
    for i in range(n):
        x, y = x1 + (x2-x1)*i/n, y1 + (y2-y1)*i/n
        bulbs += f'<circle class="bulb b{idx%3}" cx="{x:.1f}" cy="{y:.1f}" r="4.6"/>'; idx += 1
sign += f'<g class="bulbs">{bulbs}</g>'
letters, word2 = "ROBO", "GROOVE"
text = ""
chars = [(c, "url(#lgGold)") for c in letters] + [(" ", None)] + [(c, "url(#lgPink)") for c in word2]
xs = [52 + i*42 for i in range(len(chars))]
span = (len(chars)-1)*42; x0 = (W - span)/2
for i, (c, fill) in enumerate(chars):
    if c == " ": continue
    x = x0 + i*42
    d = min(1, abs(x - W/2)/(W/2 - 28))              # 0 centre .. 1 edge
    bottom = (innerB - 12) + ((outerB - 14) - (innerB - 12))*d - 7   # sits just above the bow-tie border
    scale_y = (bottom - (top + 14))/62
    text += (f'<g transform="translate({x:.1f} {top+14}) scale(1 {scale_y:.3f})">'
             f'<text x="0" y="56" text-anchor="middle" font-family="Fredoka, Figtree, system-ui, sans-serif" font-weight="700" font-size="64" '
             f'fill="{fill}" stroke="{INK}" stroke-width="5" paint-order="stroke" stroke-linejoin="round">{c}</text></g>')
sign += text
CH["title"] = (f"0 0 {W} {H}", sign, 'aria-label="Robo Groove"')

# ------------------------------------------------------------------ write outputs
def svg(name, cls="char band"):
    vb, body, extra = CH[name]
    return f'<svg id="{name}" class="{cls}" viewBox="{vb}" {extra}>{body}</svg>'
stage = f'''<section id="stage">
  <svg width="0" height="0" style="position:absolute">{DEFS}</svg>
  <canvas id="viz"></canvas>
  <div id="floor"></div>
  {svg("title", "sign")}
  <div id="topbar"><button id="songsBtn" class="pill">📁 My Songs</button><button id="vizBtn" class="pill">🌈 Lights</button><button id="tempoBtn" class="pill">🏃 120 BPM ▾</button><button id="muteBtn" class="pill" aria-label="Sound on or off">🔊</button><button id="creditsBtn" class="pill" aria-label="Credits">ℹ️</button></div>
  {svg("bear")}
  {svg("fairy")}
  {svg("turtle")}
  {svg("robotA", "char robot on")}
  {svg("robotB", "char robot")}
  {svg("unicorn")}
  {svg("fox")}
</section>'''
open(os.path.join(HERE, "..", "stage.html"), "w").write(stage)
for name, (vb, body, extra) in CH.items():
    open(os.path.join(HERE, "svg", f"{name}.svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{DEFS}{body}</svg>')
sheet = "".join(f'<div class="c"><svg viewBox="{vb}">{body}</svg><p>{n}</p></div>' for n, (vb, body, _) in CH.items())
open(os.path.join(HERE, "sheet.html"), "w").write(f'''<!doctype html><meta charset="utf-8"><style>
body{{background:#3E3266;margin:0;padding:16px;display:flex;flex-wrap:wrap;gap:14px;font:600 14px Figtree,system-ui}}
.c{{background:#5A4A8C;border:3px solid {INK};border-radius:18px;padding:8px;text-align:center;color:#fff}}
.c svg{{height:300px;display:block}} .bulb{{fill:#FFE9A8}}</style>
<svg width="0" height="0" style="position:absolute">{DEFS}</svg>{sheet}''')
print("art written:", ", ".join(CH))
