import asyncio, json, sys
from playwright.async_api import async_playwright
INST = sys.argv[1]
JS = """async (inst) => {
 const out = {};
 for(const g of Object.keys(GENRES)) for(let v=0; v<8; v++){
   const oc = new OfflineAudioContext(2, 22050*8.6, 22050);
   setupAudio(oc);
   await ensureSamples(setsFor(inst, {g,v}, "happy"));
   const sw = DRUMS[g].swing;
   for(let p=0;p<64;p++) playInst(inst,{g,v},p, p*SIX + 0.05 + swingOffset(sw,p), "happy");
   visQ = [];
   const b = await oc.startRendering(); const d = b.getChannelData(0), e = b.getChannelData(1);
   let pk=0, ss=0; for(let i=0;i<d.length;i++){ const x=(d[i]+e[i])/2; pk=Math.max(pk,Math.abs(d[i]),Math.abs(e[i])); ss+=x*x; }
   out[g+"/"+inst+"/"+v] = {pk:+pk.toFixed(2), rms:+Math.sqrt(ss/d.length).toFixed(4)};
 }
 return {out, loaded:Object.keys(SETS)};
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type in ("error","warning") and errs.append(m.text[:150]))
        await pg.goto("file:///home/claude/robo-groove/www/index.html")
        r = await pg.evaluate(JS, INST)
        json.dump(r["out"], open(f"lv4_{INST}.json","w"))
        print(INST, len(r["out"]), "sets loaded:", len(r["loaded"]), "errors", errs[:5])
        await b.close()
asyncio.run(main())
