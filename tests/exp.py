import asyncio, time
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        ctxb = await b.new_context(viewport={"width":1280,"height":800}, accept_downloads=True)
        pg = await ctxb.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type=="error" and errs.append(m.text))
        await pg.goto("file:///home/claude/robo-groove/www/index.html")
        await pg.click("#startBtn"); await pg.wait_for_timeout(200)
        # song: A 4 bars (pop all + robot moves), B 4 bars metal + winds funk
        await pg.evaluate("""(()=>{ const A=state.sections[0]; A.guitar={g:'pop',v:0}; A.winds={g:'pop',v:0}; A.head[0]='spin'; A.arm[2]='clap'; A.rev[0]=true; A.dly[4]=true;
           const B=JSON.parse(JSON.stringify(A)); B.drums={g:'metal',v:0}; B.guitar={g:'metal',v:4}; B.winds={g:'funk',v:3}; B.mood='brave'; state.sections.push(B); renderSection(); })()""")
        for fmt in ["mp3","wav"]:
            await pg.click("#saveBtn"); await pg.wait_for_timeout(150)
            if fmt=="wav": await pg.click("#pop button[data-v='f:wav']")
            else: await pg.click("#pop button[data-v='f:mp3']")
            if fmt=="mp3": await pg.screenshot(path="exp_pop.png")
            t0=time.time()
            async with pg.expect_download(timeout=120000) as dl:
                await pg.click("#pop button[data-v=go]")
            d = await dl.value; path=f"song.{fmt}"; await d.save_as(path)
            print(fmt, "saved", d.suggested_filename, "in", round(time.time()-t0,1), "s")
            await pg.wait_for_timeout(300); await pg.screenshot(path=f"exp_done_{fmt}.png")
            await pg.click("#busyBtns button:has-text('Done')")
        print("errors", errs)
        await b.close()
asyncio.run(main())
