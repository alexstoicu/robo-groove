import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        c = await b.new_context(viewport={"width":1280,"height":800}, accept_downloads=True, has_touch=True); pg = await c.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type in ("error",) and errs.append(m.text[:200]))
        await pg.goto("file:///home/claude/robo-groove/www/index.html"); await pg.wait_for_timeout(400)
        await pg.screenshot(path="v5_start.png")
        await pg.click("#startBtn"); await pg.wait_for_timeout(600)
        # build a song: robot moves + all band
        await pg.evaluate("""(()=>{ const s=sec(); s.head[0]='spin'; s.arm[2]='heart'; s.leg[4]='jump'; s.bongos={g:'pop',v:0}; s.guitar={g:'pop',v:0}; s.winds={g:'pop',v:0}; renderSection(); })()""")
        await pg.click("#play"); await pg.wait_for_timeout(3500)
        await pg.screenshot(path="v5_play.png")
        st = await pg.evaluate("({playing, sets:Object.keys(SETS), viz:viz.mode, cur:viz.cur})"); print("state", st)
        # tap instruments
        for sel in ["#bear .kick","#bear .snare","#bear .crash","#turtle .bongoHi","#unicorn .tapg","#fox .tapf","#robotA .antenna"]:
            bb = await pg.locator(sel).first.bounding_box(); await pg.mouse.click(bb["x"]+bb["width"]/2, bb["y"]+bb["height"]/2); await pg.wait_for_timeout(120)
        print("tab after taps (should still be robot):", await pg.evaluate("state.tab"))
        await pg.click("#play")
        k = await pg.locator('#fairy .pk[data-midi="64"]').bounding_box(); await pg.mouse.click(k["x"]+k["width"]/2, k["y"]+k["height"]-4)
        await pg.wait_for_timeout(400); print("piano open:", await pg.evaluate("!!document.querySelector('#piano.open')"))
        # play piano keys with a slide
        pk = await pg.locator('#piano .pw[data-midi="60"]').bounding_box(); pk2 = await pg.locator('#piano .pw[data-midi="72"]').bounding_box()
        await pg.mouse.move(pk["x"]+10, pk["y"]+pk["height"]*.8); await pg.mouse.down(); await pg.mouse.move(pk2["x"]+10, pk2["y"]+pk2["height"]*.8, steps=12); await pg.mouse.up()
        await pg.screenshot(path="v5_piano.png")
        await pg.click("#piano .pclose")
        # tap on fairy body (not keys) -> keys tab
        f = await pg.locator("#fairy .fHead").bounding_box(); await pg.mouse.click(f["x"]+f["width"]/2, f["y"]+f["height"]/2); await pg.wait_for_timeout(100)
        print("tab after fairy head:", await pg.evaluate("state.tab"))
        await pg.click(".tab[data-tab=bongos]"); await pg.wait_for_timeout(200); await pg.screenshot(path="v5_bongos.png")
        await pg.click("#vizBtn"); await pg.wait_for_timeout(200); await pg.screenshot(path="v5_lights.png"); await pg.click("#pop button[data-v='12']")
        print("viz mode:", await pg.evaluate("viz.mode"))
        await pg.click("#songsBtn"); await pg.fill("#songName", "Test Jam"); await pg.click("#pop button[data-v=save]"); await pg.wait_for_timeout(200)
        await pg.screenshot(path="v5_songs.png"); print("library:", await pg.evaluate("Object.values(readLib()).map(p=>p.name)"))
        await pg.mouse.click(5,5)
        await pg.click("#addSec"); await pg.screenshot(path="v5_bars.png"); await pg.click("#pop button[data-v='3']")
        print("bars:", await pg.evaluate("state.sections.map(s=>s.bars)"))
        # project file round trip
        async with pg.expect_download() as dl:
            await pg.click("#songsBtn"); await pg.click("#pop button[data-v=file]")
        d = await dl.value; await d.save_as("proj.robogroove"); print("project file:", d.suggested_filename)
        await pg.evaluate("loadProject({sections:[newSection()], name:'x'})"); print("after new:", await pg.evaluate("state.sections.length"))
        await pg.set_input_files("#projFile", "proj.robogroove"); await pg.wait_for_timeout(300)
        print("reopened:", await pg.evaluate("[state.sections.length, projectName, state.sections.map(s=>s.bars)]"))
        print("errors", errs)
        await b.close()
asyncio.run(main())
