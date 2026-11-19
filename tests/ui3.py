import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        pg = await b.new_page(viewport={"width":1280,"height":800})
        errs=[]
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: m.type=="error" and errs.append(m.text))
        await pg.goto("file:///home/claude/robo-groove/www/index.html")
        await pg.click("#startBtn"); await pg.wait_for_timeout(200)
        await pg.click('.block:has-text("Spin")'); await pg.click(".sub[data-sub=arm]"); await pg.click('.block:has-text("Heart")')
        # drums: hip-hop groove 2
        await pg.click(".tab[data-tab=drums]"); await pg.click("#genreBtn"); await pg.screenshot(path="b_genre.png")
        await pg.click("#pop button[data-v=hiphop]"); await pg.click('.block:has-text("Groove 2")')
        await pg.click(".tab[data-tab=keys]"); await pg.click("#genreBtn"); await pg.click("#pop button[data-v=lofi]"); await pg.click('.block:has-text("Chords")')
        await pg.click(".tab[data-tab=guitar]"); await pg.click("#genreBtn"); await pg.click("#pop button[data-v=jazz]"); await pg.click('.block:has-text("Solo")')
        await pg.screenshot(path="b_guitar.png")
        # mood
        await pg.click(".chip2.sel [data-act=mood]"); await pg.screenshot(path="b_mood.png"); await pg.click("#pop button[data-v=dreamy]")
        # tempo
        await pg.click("#tempoBtn"); await pg.screenshot(path="b_tempo.png")
        await pg.click("#pop button[data-v='+5']"); await pg.click("#pop button[data-v=match]")
        print("tempo after match:", await pg.evaluate("BPM"), "SIX", await pg.evaluate("SIX.toFixed(4)"))
        # add sections: B 8 bars metal, C 4 bars
        await pg.click("#addSec"); await pg.click("#pop button[data-v='8']")
        await pg.click(".tab[data-tab=drums]"); await pg.click("#genreBtn"); await pg.click("#pop button[data-v=metal]"); await pg.click('.block:has-text("Build-up")')
        await pg.click("#addSec"); await pg.click("#pop button[data-v='4']")
        print("bars:", await pg.evaluate("state.sections.map(s=>s.bars).join(',')"), "total", await pg.evaluate("songBars()"))
        # ruler: tap bar ~6 (inside B), then drag loop bars 9-12
        r = await pg.locator("#ruler").bounding_box(); tot = 16
        x = lambda bar: r["x"] + (bar+0.5)/tot*r["width"]
        await pg.mouse.click(x(5), r["y"]+10)
        print("cursor:", await pg.evaluate("state.cursor"), "cur section:", await pg.evaluate("state.cur"))
        await pg.mouse.move(x(8), r["y"]+10); await pg.mouse.down(); await pg.mouse.move(x(9), r["y"]+10, steps=4); await pg.mouse.move(x(11), r["y"]+10, steps=4); await pg.mouse.up()
        print("loop:", await pg.evaluate("JSON.stringify(state.loop)"), "mode:", await pg.evaluate("state.mode"))
        await pg.evaluate("window.__s=[]; const _f=fireStep; fireStep=function(v){ window.__s.push([v.abs>>4, +(ctx.currentTime-outLatency()-v.t).toFixed(4)]); _f(v)}; 0")
        await pg.evaluate("setTempo(160)")
        await pg.click("#play"); await pg.wait_for_timeout(2500); await pg.screenshot(path="b_play.png")
        await pg.wait_for_timeout(5500)
        s = await pg.evaluate("window.__s"); await pg.click("#play")
        bars = [v[0] for v in s]
        print("bars visited in loop:", sorted(set(bars)), "  max visual lag ms:", round(max(v[1] for v in s)*1000,1))
        # clear loop, test loop-part mode & swing
        await pg.click("#loopPill"); print("loop after clear:", await pg.evaluate("state.loop"))
        # perf: schedule 128 sixteenths
        t = await pg.evaluate("(()=>{ const t0=performance.now(); for(let i=0;i<128;i++) scheduleSixteenth(ctx.currentTime+20+i*SIX); visQ=[]; return performance.now()-t0; })()")
        print("ms per sixteenth:", round(t/128,2))
        await pg.reload(); await pg.click("#startBtn")
        print("after reload:", await pg.evaluate("JSON.stringify({n:state.sections.length,bpm:BPM,mood:state.sections[0].mood,cursor:state.cursor,g:state.sections[1].drums})"))
        await pg.screenshot(path="b_reload.png")
        print("errors", errs)
        await b.close()
asyncio.run(main())
