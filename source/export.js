/* =====================================================================
   SONG EXPORT — renders the song offline (faster than real time),
   then saves it as WAV or MP3
   ===================================================================== */
const exportOpts = {what:"song", fmt:"mp3"};
const MAX_EXPORT_SEC = 600;
const fmtTime = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,"0")}`;
const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const capCache = {};
function capPlugin(name){
  if(capCache[name]) return capCache[name];
  const C = window.Capacitor || {};
  if(C.Plugins && C.Plugins[name]) return capCache[name] = C.Plugins[name];
  const reg = (window.capacitorExports && window.capacitorExports.registerPlugin) || C.registerPlugin;
  return capCache[name] = reg(name);
}

function exportRange(what){
  if(what === "part") return {bars:sec().bars, label:`Part ${letter(state.cur)}`};
  if(what === "loop" && state.loop) return {bars:Math.min(state.loop.b, songBars()) - state.loop.a, label:`Bars ${state.loop.a+1}-${state.loop.b}`};
  return {bars:songBars(), label:"Song"};
}
function exportHtml(){
  const L = state.loop;
  const opt = (k, v, ic, label, sub) => `<button data-v="${k}:${v}" class="${exportOpts[k==="w"?"what":"fmt"]===v?"sel":""}" style="flex-direction:column;gap:0"><span class="ic">${ic}</span>${label}<small>${sub}</small></button>`;
  const len = what => fmtTime(exportRange(what).bars*16*SIX);
  return `<h4>💾 Save your song</h4>
    <div class="pgrid" style="grid-template-columns:repeat(${L?3:2},1fr)">
      ${opt("w","song","🎵","Whole song",`${songBars()} bars · ${len("song")}`)}
      ${L ? opt("w","loop","🔁","Loop bars",`${L.a+1}–${L.b} · ${len("loop")}`) : ""}
      ${opt("w","part","🅰️",`Part ${letter(state.cur)} only`,`${sec().bars} bars · ${len("part")}`)}
    </div>
    <div class="pgrid" style="grid-template-columns:1fr 1fr;margin-top:.5rem">
      ${opt("f","mp3","🎧","MP3","small · plays anywhere")}
      ${opt("f","wav","💿","WAV","best sound · bigger file")}
    </div>
    <div class="prow"><button data-v="go" style="background:#2ec26e;padding:.6rem 2.2rem">⬇️ Save it!</button></div>`;
}
function openExport(){
  if(exportOpts.what === "loop" && !state.loop) exportOpts.what = "song";
  openPop($("#saveBtn"), exportHtml(), v => {
    if(v === "go"){ doExport(); return; }
    const [k, val] = v.split(":"); exportOpts[k==="w" ? "what" : "fmt"] = val; openExport();
  }, v => v !== "go");
}
$("#saveBtn").addEventListener("pointerup", () => { initAudio(); openExport(); });

/* ---------- offline render ---------- */
const grabAudio = () => ({ctx, master, noiseBuf, BUS, DUCK, OUT, DIST, DLY, REV});
function putAudio(o){ ({ctx, master, noiseBuf, BUS, DUCK, OUT, DIST, DLY, REV} = o); }
function locateSong(g){ let a = 0; for(let i=0;i<state.sections.length;i++){ const L = state.sections[i].bars*16; if(g < a+L) return {idx:i, local:g-a}; a += L; } return {idx:0, local:0}; }
function renderSong(what, onProg){
  let start, end, loc;
  if(what === "part"){ const idx = state.cur; start = 0; end = sec().bars*16; loc = g => ({idx, local:g}); }
  else if(what === "loop" && state.loop){ start = state.loop.a*16; end = Math.min(state.loop.b, songBars())*16; loc = locateSong; }
  else { start = 0; end = songBars()*16; loc = locateSong; }
  const sr = 44100, dur = (end-start)*SIX + 2.5;
  const oc = new OfflineAudioContext(2, Math.ceil(sr*dur), sr);
  const live = grabAudio();
  setupAudio(oc); setTempo(BPM);
  const off = grabAudio();
  putAudio(live);
  let g = start;
  const fill = until => {
    const q = visQ; visQ = []; putAudio(off);
    try{ while(g < end && (g-start)*SIX + .05 < until){ const {idx, local} = loc(g); scheduleAt(idx, local, (g-start)*SIX + .05); g++; } }
    finally{ putAudio(live); visQ = q; }
  };
  fill(2);
  const hook = k => {
    if(k >= dur) return;
    oc.suspend(k).then(() => { fill(k + 2); onProg(k/dur); hook(k+1); oc.resume(); });
  };
  hook(1);
  return oc.startRendering();
}

/* ---------- encoders ---------- */
function tidy(buf){
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  let end = L.length - 1; while(end > 0 && Math.abs(L[end]) < 2e-4 && Math.abs(R[end]) < 2e-4) end--;
  end = Math.min(L.length, end + Math.round(buf.sampleRate*.2));
  let pk = 0; for(let i=0;i<end;i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  const gain = pk > 0 ? Math.min(2, .89/pk) : 1, fade = Math.round(buf.sampleRate*.08);
  const out = [new Float32Array(end), new Float32Array(end)];
  for(let i=0;i<end;i++){ const f = i > end-fade ? (end-i)/fade : 1; out[0][i] = L[i]*gain*f; out[1][i] = R[i]*gain*f; }
  return out;
}
function toWav(ch, sr){
  const n = ch[0].length, dv = new DataView(new ArrayBuffer(44 + n*4));
  const str = (o, s) => { for(let i=0;i<s.length;i++) dv.setUint8(o+i, s.charCodeAt(i)); };
  str(0,"RIFF"); dv.setUint32(4, 36 + n*4, true); str(8,"WAVE"); str(12,"fmt ");
  dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,2,true); dv.setUint32(24,sr,true);
  dv.setUint32(28,sr*4,true); dv.setUint16(32,4,true); dv.setUint16(34,16,true); str(36,"data"); dv.setUint32(40,n*4,true);
  let o = 44;
  for(let i=0;i<n;i++) for(let c=0;c<2;c++){ const v = Math.max(-1, Math.min(1, ch[c][i])); dv.setInt16(o, v < 0 ? v*32768 : v*32767, true); o += 2; }
  return new Blob([dv], {type:"audio/wav"});
}
async function toMp3(ch, sr, onProg){
  const toI16 = f => { const a = new Int16Array(f.length); for(let i=0;i<f.length;i++){ const v = Math.max(-1, Math.min(1, f[i])); a[i] = v < 0 ? v*32768 : v*32767; } return a; };
  const L = toI16(ch[0]), R = toI16(ch[1]), enc = new lamejs.Mp3Encoder(2, sr, 160), parts = [], BLK = 1152;
  for(let i=0, k=0; i<L.length; i+=BLK, k++){
    const d = enc.encodeBuffer(L.subarray(i, i+BLK), R.subarray(i, i+BLK)); if(d.length) parts.push(d);
    if(k % 150 === 0){ onProg(i/L.length); await new Promise(r => setTimeout(r, 0)); }
  }
  parts.push(enc.flush());
  return new Blob(parts, {type:"audio/mpeg"});
}

/* ---------- busy / done screen ---------- */
const busy = $("#busy");
function busyShow(ic, txt, pct, buttons){
  busy.classList.remove("hidden");
  $("#busyIc").textContent = ic; $("#busyTxt").textContent = txt;
  $("#bar").style.visibility = pct === null ? "hidden" : "visible";
  if(pct !== null) $("#barFill").style.width = Math.round(pct*100) + "%";
  const b = $("#busyBtns"); b.innerHTML = "";
  (buttons || []).forEach(([label, fn, main]) => { const el = document.createElement("button"); el.textContent = label; if(main) el.className = "main"; el.addEventListener("pointerup", fn); b.appendChild(el); });
}
let listenSrc = null;
function stopListen(){ if(listenSrc){ try{ listenSrc.stop(); }catch(_){} listenSrc = null; } }
function busyHide(){ stopListen(); busy.classList.add("hidden"); }
const blobToB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); });

async function doExport(){
  if(playing) stop();
  stopPreview();
  const what = exportOpts.what, fmt = exportOpts.fmt, R = exportRange(what), secs = R.bars*16*SIX;
  if(secs > MAX_EXPORT_SEC){ busyShow("⏳", `That's ${fmtTime(secs)} long — songs up to 10 minutes can be saved. Try a loop range or one part.`, null, [["OK", busyHide, true]]); return; }
  try{
    busyShow("🎙️", "The band is recording your song…", 0);
    await ensureSamples(setsForSections(state.sections));
    const rendered = await renderSong(what, p => $("#barFill").style.width = Math.round(p*80) + "%");
    $("#barFill").style.width = "80%";
    const ch = tidy(rendered);
    let blob;
    if(fmt === "wav"){ $("#busyTxt").textContent = "Packing it up…"; await new Promise(r => setTimeout(r, 30)); blob = toWav(ch, rendered.sampleRate); }
    else { $("#busyTxt").textContent = "Squishing it into an MP3…"; blob = await toMp3(ch, rendered.sampleRate, p => $("#barFill").style.width = Math.round(80 + p*20) + "%"); }
    const d = new Date(), pad = n => String(n).padStart(2,"0");
    const name = `RoboGroove-${R.label.replace(/\s+/g,"")}-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.${fmt}`;
    await deliver(blob, name, rendered);
  }catch(e){
    console.error(e);
    busyShow("😕", "Oops, the song couldn't be saved. Please try again.", null, [["OK", busyHide, true]]);
  }
}
async function deliver(blob, name, rendered){
  const listen = () => {
    if(listenSrc){ stopListen(); return; }
    initAudio(); listenSrc = ctx.createBufferSource(); listenSrc.buffer = rendered; listenSrc.connect(ctx.destination);
    listenSrc.onended = () => { listenSrc = null; }; listenSrc.start();
  };
  const sizeTxt = `${(blob.size/1048576).toFixed(1)} MB`;
  if(isNative()){
    const FS = capPlugin("Filesystem"), SH = capPlugin("Share");
    $("#busyTxt").textContent = "Saving to your tablet…";
    const data = await blobToB64(blob);
    let uri, where;
    try{ uri = (await FS.writeFile({path:"RoboGroove/" + name, data, directory:"DOCUMENTS", recursive:true})).uri; where = "Documents › RoboGroove"; }
    catch(e){ uri = (await FS.writeFile({path:name, data, directory:"CACHE"})).uri; where = null; }
    const share = () => SH.share({title:name, dialogTitle:"Send your song", files:[uri]}).catch(() => SH.share({title:name, url:uri}).catch(()=>{}));
    busyShow("🎉", where ? `Saved! Find "${name}" in ${where} (${sizeTxt}).` : `Your song "${name}" is ready (${sizeTxt}). Tap Share to save or send it.`, null,
      [["▶ Listen", listen], ["📤 Share", share, !where], ["✔ Done", busyHide, !!where]]);
    return;
  }
  const file = new File([blob], name, {type:blob.type});
  const download = () => { const a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); };
  const canShare = navigator.canShare && navigator.canShare({files:[file]});
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if(canShare && iOS){
    const share = () => navigator.share({files:[file], title:name}).catch(()=>{});
    busyShow("🎉", `Your song is ready (${sizeTxt})! Tap "Save to Files" and pick a folder, or send it.`, null,
      [["▶ Listen", listen], ["📤 Save to Files", share, true], ["✖ Close", busyHide]]);
  } else {
    download();
    busyShow("🎉", `Downloaded "${name}" (${sizeTxt}).`, null,
      [["▶ Listen", listen], ["⬇️ Download again", download], ...(canShare ? [["📤 Share", () => navigator.share({files:[file], title:name}).catch(()=>{})]] : []), ["✔ Done", busyHide, true]]);
  }
}
