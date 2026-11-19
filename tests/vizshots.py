import asyncio, time
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        pg = await b.new_page(viewport={"width":1280,"height":800})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type=="warning" and "viz" in m.text and errs.append(m.text))
        await pg.goto("file:///home/claude/robo-groove/www/index.html"); await pg.click("#startBtn")
        await pg.evaluate("(()=>{ const s=sec(); s.drums={g:'edm',v:0}; s.keys={g:'edm',v:2}; s.bongos={g:'pop',v:2}; s.winds={g:'pop',v:0}; renderSection(); })()")
        await pg.click("#play"); await pg.wait_for_timeout(1500)
        fps=[]
        for i in range(20):
            await pg.evaluate(f"viz.setMode({i})"); await pg.wait_for_timeout(1700)
            f = await pg.evaluate("new Promise(r=>{let n=0;const t0=performance.now();function f(){n++; if(performance.now()-t0<1000) requestAnimationFrame(f); else r(n);} requestAnimationFrame(f);})")
            fps.append(f)
            await pg.locator("#stage").screenshot(path=f"viz_{i:02d}.png")
        print("fps per style:", fps); print("errors", errs)
        await b.close()
asyncio.run(main())
