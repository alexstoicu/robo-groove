#!/usr/bin/env python3
"""Assemble the single-file app (run from this folder).

    python build.py                 -> PREMIUM: www/index.html + web files (manifest, sw, icons)
    python build.py --edition=free  -> FREE (no save/export): www-free/index.html + web files
    python build.py --publish       -> PREMIUM only: also copy www/* to the repo root (GitHub Pages)
    python build.py --android       -> <out>-android/ (index.html + icon.png only, no service worker)

Editions
--------
PREMIUM is the full app and rebuilds BYTE-IDENTICAL to the shipped index.html.

FREE contains NO save/export code at all. It is not a hidden or runtime-gated feature: the code is
simply not in the file. Specifically the free build omits:
  - export.js             (MP3/WAV export, the 💾 Save handler, offline rendering)
  - the "save" half of projects.js (My Songs library, .robogroove save/open, #songsBtn handler)
  - vendor/lame.min.js    (the MP3 encoder — only export.js used it)
  - the 💾 Save and 📁 My Songs buttons, and the Credits line mentioning the MP3 encoder
Kept in BOTH editions: the 🌈 Lights menu, 🔊 Mute, Credits, and session auto-remember (the current
in-progress song, localStorage key roboGroove.v4, handled in app.js).
"""
import os, re, shutil, sys
H = os.path.dirname(os.path.abspath(__file__)); P = lambda *a: os.path.join(H, *a)
rd = lambda *a: open(P(*a), encoding="utf-8").read()

free = "--edition=free" in sys.argv

t = rd("template.html"); s = rd("stage.html")
t = t.replace("/*STYLE*/", rd("style.css").replace("/*FONTS*/", rd("fonts", "fonts.css")))
title = re.search(r'<svg id="title".*?</svg>', s, re.S).group(0).replace('id="title" class="sign"', 'class="startSign"')
t = t.replace("<!--STARTSIGN-->", title)

# --- editions ---------------------------------------------------------------
# projects.js = [save block] + [lights / mute / credits]. The free build keeps only the second half.
projects = rd("projects.js")
if free:
    projects = projects[projects.index("/* ---------- lights"):]      # drop the entire save block
    projects = projects.replace("MP3 saving: <b>lamejs</b> — LGPL. ", "")   # no (absent) MP3 encoder in credits
    export_block = projects                                           # no export.js, no leading newline
    lame = ""                                                         # MP3 encoder not bundled
    t = t.replace('      <button id="saveBtn">💾 Save</button>\n', "")               # remove 💾 Save button
    s = s.replace('<button id="songsBtn" class="pill">📁 My Songs</button>', "")     # remove 📁 My Songs button
else:
    export_block = rd("export.js") + "\n" + projects                  # full save/export, unchanged
    lame = rd("vendor", "lame.min.js")

js = "\n".join([rd("music.js"), rd("viz.js"), rd("sampler.js"),
                rd("app.js").replace("/*EXPORT*/", export_block)])
if os.path.exists(P("trim.json")):
    js = js.replace("const TRIM = {};      /*TRIM*/", "const TRIM = " + rd("trim.json") + ";")
out = (t.replace("<!--STAGE-->", s)
        .replace("/*CAPCORE*/", rd("vendor", "capacitor-core.js").replace("//# sourceMappingURL=capacitor.js.map", ""))
        .replace("/*LAME*/", lame)
        .replace("/*SCRIPT*/", js))
out = out.replace("<!--SAMPLEDATA-->", '<script type="application/json" id="sampleData">' + rd("samples", "samples.json") + "</script>")

def write(folder, files):
    os.makedirs(P(folder), exist_ok=True)
    # newline="\n": keep Unix line endings on Windows too, so builds are byte-identical everywhere
    open(P(folder, "index.html"), "w", encoding="utf-8", newline="\n").write(out)
    for f in files:
        shutil.copyfile(P("web", f), P(folder, f))
    print("built", folder + "/index.html", len(out) // 1024, "KB", "+", ", ".join(files))

WEB = ["manifest.json", "sw.js", "icon.png", "icon-192.png", "icon-512.png"]
base = "www-free" if free else "www"
if "--android" in sys.argv:
    write(base + "-android", ["icon.png"])
else:
    write(base, WEB)
    if "--publish" in sys.argv:
        if free:
            print("skipped --publish: the free edition is published from the Publishing folder, not here")
        else:
            root = os.path.dirname(H)
            for f in ["index.html"] + WEB:
                shutil.copyfile(P("www", f), os.path.join(root, f))
            print("copied www/* to the repo root (GitHub Pages). Review with: git status")
