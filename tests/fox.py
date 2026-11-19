import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        pg = await b.new_page(viewport={"width":1280,"height":800})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type=="error" and errs.append(m.text))
        await pg.goto("file:///home/claude/robo-groove/www/index.html")
        await pg.click("#startBtn"); await pg.wait_for_timeout(200)
        await pg.click(".tab[data-tab=winds]"); await pg.click("#genreBtn"); await pg.click("#pop button[data-v=jazz]")
        await pg.click('.block:has-text("Harmony")'); await pg.wait_for_timeout(300)
        await pg.click("#fox"); 
        await pg.click("#play"); await pg.wait_for_timeout(1700)
        await pg.screenshot(path="fox.png"); await pg.click("#play")
        print("winds ref:", await pg.evaluate("JSON.stringify(sec().winds)"), "errors", errs)
        await b.close()
asyncio.run(main())
