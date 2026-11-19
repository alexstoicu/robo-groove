import asyncio
from playwright.async_api import async_playwright
JS = """async () => {
 const out = {}; const insts=["drums","keys","guitar"];
 async function render(fn){ const oc = new OfflineAudioContext(1,22050*8.6,22050); setupAudio(oc); fn(); visQ=[];
   const d = (await oc.startRendering()).getChannelData(0); let pk=0,ss=0; for(const x of d){pk=Math.max(pk,Math.abs(x)); ss+=x*x;} return [+pk.toFixed(2), +Math.sqrt(ss/d.length).toFixed(3)]; }
 const combos = [["metal",2,"metal",5,"metal",6,"brave"],["edm",0,"edm",0,"edm",2,"happy"],["adventure",5,"adventure",7,"adventure",2,"spooky"],
                 ["hiphop",1,"hiphop",6,"lofi",3,"dreamy"],["latin",1,"latin",0,"latin",0,"groovy"],["jazz",0,"jazz",6,"jazz",0,"bluesy"],["country",0,"country",4,"country",2,"happy"]];
 for(const [dg,dv,kg,kv,gg,gv,mood] of combos) out[dg+"+"+kg+"+"+gg+" "+mood] = await render(()=>{ const s={drums:{g:dg,v:dv}}; const sw=DRUMS[dg].swing;
   for(let p=0;p<64;p++){ OUT=BUS[p%16<8?3:0]; const t=p*SIX+.05+swingOffset(sw,p); playInst("drums",{g:dg,v:dv},p,t,mood); playInst("keys",{g:kg,v:kv},p,t,mood); playInst("guitar",{g:gg,v:gv},p,t,mood); OUT=BUS[0]; } });
 return out;
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/robo-groove/www/index.html")
        for k,v in (await pg.evaluate(JS)).items(): print(f"  {k:40s} peak {v[0]}  rms {v[1]}")
        print("errors", errs); await b.close()
asyncio.run(main())
