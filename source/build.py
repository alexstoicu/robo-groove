#!/usr/bin/env python3
"""Assemble the single-file app into www/ (run from this folder).

    python build.py            -> www/index.html + the web files (manifest, service worker, icons)
    python build.py --publish  -> same, then copies www/* to the repo root, which GitHub Pages serves
    python build.py --android  -> www-android/ (index.html + icon.png only, no service worker)
"""
import os, re, shutil, sys
H = os.path.dirname(os.path.abspath(__file__)); P = lambda *a: os.path.join(H, *a)
rd = lambda *a: open(P(*a), encoding="utf-8").read()
t = rd("template.html"); s = rd("stage.html")
t = t.replace("/*STYLE*/", rd("style.css").replace("/*FONTS*/", rd("fonts", "fonts.css")))
title = re.search(r'<svg id="title".*?</svg>', s, re.S).group(0).replace('id="title" class="sign"', 'class="startSign"')
t = t.replace("<!--STARTSIGN-->", title)
js = "\n".join([rd("music.js"), rd("viz.js"), rd("sampler.js"),
                rd("app.js").replace("/*EXPORT*/", rd("export.js") + "\n" + rd("projects.js"))])
if os.path.exists(P("trim.json")):
    js = js.replace("const TRIM = {};      /*TRIM*/", "const TRIM = " + rd("trim.json") + ";")
out = (t.replace("<!--STAGE-->", s)
        .replace("/*CAPCORE*/", rd("vendor", "capacitor-core.js").replace("//# sourceMappingURL=capacitor.js.map", ""))
        .replace("/*LAME*/", rd("vendor", "lame.min.js"))
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
if "--android" in sys.argv:
    write("www-android", ["icon.png"])
else:
    write("www", WEB)
    if "--publish" in sys.argv:
        root = os.path.dirname(H)
        for f in ["index.html"] + WEB:
            shutil.copyfile(P("www", f), os.path.join(root, f))
        print("copied www/* to the repo root (GitHub Pages). Review with: git status")
