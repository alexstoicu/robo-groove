import asyncio
from playwright.async_api import async_playwright
INIT = """window.androidBridge = {postMessage(){}};
window.Capacitor = {Plugins:{
  Filesystem:{writeFile: async (o) => { window.__w = {path:o.path, dir:o.directory, bytes:Math.round(o.data.length*3/4)}; return {uri:'file:///storage/emulated/0/Documents/'+o.path}; }},
  Share:{share: async (o) => { window.__s = o; return {}; }}}};"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        pg = await b.new_page(viewport={"width":1280,"height":800})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type in ("error","warning") and errs.append(m.text))
        await pg.add_init_script(INIT)
        await pg.goto("file:///home/claude/robo-groove/www/index.html")
        print("native?", await pg.evaluate("isNative()"), "platform", await pg.evaluate("Capacitor.getPlatform && Capacitor.getPlatform()"))
        await pg.click("#startBtn"); await pg.wait_for_timeout(200)
        await pg.click("#saveBtn"); await pg.click("#pop button[data-v=go]")
        await pg.wait_for_selector("#busyBtns button:has-text('Share')", timeout=60000)
        print("written:", await pg.evaluate("JSON.stringify(window.__w)"))
        print("message:", await pg.inner_text("#busyTxt"))
        await pg.click("#busyBtns button:has-text('Share')"); await pg.wait_for_timeout(300)
        print("share called with:", await pg.evaluate("JSON.stringify(window.__s)"))
        await pg.screenshot(path="native_done.png")
        print("errors/warnings", errs)
        await b.close()
asyncio.run(main())
