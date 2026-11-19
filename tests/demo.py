import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        c = await b.new_context(viewport={"width":1280,"height":800}, accept_downloads=True); pg = await c.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/robo-groove/www/index.html"); await pg.click("#startBtn")
        await pg.evaluate("""(()=>{ const mk=(g,mood,bars,v)=>({...newSection(), bars, mood, drums:{g,v:v[0]}, bongos:{g,v:v[1]}, keys:{g,v:v[2]}, guitar:{g,v:v[3]}, winds:{g,v:v[4]}});
          state.sections=[mk('pop','happy',4,[0,0,0,0,0]), mk('latin','groovy',4,[1,3,0,2,4]), mk('jazz','bluesy',4,[0,0,6,0,0]),
                          mk('country','happy',4,[0,4,0,0,0]), mk('rock','brave',4,[0,0,0,0,5]), mk('adventure','spooky',4,[0,6,2,2,0])];
          state.cur=0; state.mode='song'; state.cursor=0; state.loop=null; setTempo(112); renderSection(); })()""")
        await pg.click("#saveBtn"); await pg.click("#pop button[data-v='f:mp3']")
        async with pg.expect_download(timeout=300000) as dl: await pg.click("#pop button[data-v=go]")
        d = await dl.value; await d.save_as("/mnt/user-data/outputs/RoboGroove-sound-demo.mp3")
        print("demo saved; errors", errs); await b.close()
asyncio.run(main())
