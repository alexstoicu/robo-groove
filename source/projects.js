/* =====================================================================
   MY SONGS — save projects inside the app, or as .robogroove files
   ===================================================================== */
const LIB_KEY = "roboGroove.library";
let projectName = "";
try{ projectName = localStorage.getItem("roboGroove.projectName") || ""; }catch(e){}
function readLib(){ try{ return JSON.parse(localStorage.getItem(LIB_KEY) || "{}"); }catch(e){ return {}; } }
function writeLib(lib){ try{ localStorage.setItem(LIB_KEY, JSON.stringify(lib)); return true; }catch(e){ toast("😕 Not enough room to save — try deleting an old song"); return false; } }
function projectData(){
  return {app:"RoboGroove", version:5, name:projectName || "My Song", bpm:BPM, skin:state.skin, mode:state.mode,
          sections:state.sections, cur:state.cur, cursor:state.cursor, loop:state.loop};
}
function loadProject(d){
  if(!d || !Array.isArray(d.sections) || !d.sections.length) throw new Error("not a Robo Groove song");
  if(playing) stop();
  stopPreview();
  state.sections = d.sections.slice(0, MAX_SECTIONS).map(s => cleanSection(s, false));
  state.cur = Math.min(Math.max(0, +d.cur || 0), state.sections.length-1);
  state.mode = d.mode === "song" ? "song" : "loop";
  if(d.skin === "A" || d.skin === "B") state.skin = d.skin;
  state.cursor = Math.max(0, +d.cursor || 0);
  state.loop = d.loop && d.loop.b > d.loop.a ? {a:+d.loop.a, b:+d.loop.b} : null;
  if(+d.bpm) setTempo(+d.bpm);
  projectName = String(d.name || "My Song").slice(0, 40);
  try{ localStorage.setItem("roboGroove.projectName", projectName); }catch(e){}
  clampSongMarks(); save(); renderSkins(); renderTempo(); renderSection();
  ensureSamples(setsForSections(state.sections));
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const safeName = s => (s || "My Song").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "My-Song";
function songsHtml(){
  const lib = readLib(), items = Object.entries(lib).sort((a,b) => b[1].saved - a[1].saved);
  const list = items.length ? items.map(([id, p]) => `<div class="songrow"><button data-v="open:${id}" class="songname">🎵 ${esc(p.name)}<small>${new Date(p.saved).toLocaleDateString()} · ${p.data.sections.length} part${p.data.sections.length>1?"s":""}</small></button><button data-v="del:${id}" class="songdel" aria-label="Delete">🗑</button></div>`).join("")
                            : `<p class="empty">No saved songs yet. Make something cool and tap Save!</p>`;
  return `<h4>📁 My Songs</h4>
    <div class="namebar"><input id="songName" maxlength="40" placeholder="Name your song" value="${esc(projectName)}"><button data-v="save" class="go">💾 Save</button></div>
    <div class="prow" style="margin:.4rem 0 .6rem"><button data-v="new">✨ New song</button><button data-v="file">📤 Save to file</button><button data-v="openfile">📂 Open file</button></div>
    <div class="songlist">${list}</div>`;
}
let delArmed = null;
function openSongs(){
  openPop($("#songsBtn"), songsHtml(), v => {}, v => {
    const nameEl = $("#songName"), nm = nameEl ? nameEl.value.trim() : "";
    if(v === "save"){
      projectName = nm || projectName || `Song ${Object.keys(readLib()).length + 1}`;
      try{ localStorage.setItem("roboGroove.projectName", projectName); }catch(e){}
      const lib = readLib(), existing = Object.entries(lib).find(([, p]) => p.name === projectName);
      const id = existing ? existing[0] : "s" + Date.now().toString(36);
      lib[id] = {name:projectName, saved:Date.now(), data:projectData()};
      if(writeLib(lib)){ toast(`💾 Saved "${projectName}"`); openSongs(); }
      return true;
    }
    if(v === "new"){ closePop(); loadProject({sections:[newSection()], name:"", bpm:120}); projectName = ""; toast("✨ Fresh new song!"); return true; }
    if(v === "file"){ if(nm) projectName = nm; closePop(); saveProjectFile(); return true; }
    if(v === "openfile"){ closePop(); $("#projFile").click(); return true; }
    const [act, id] = v.split(":");
    const lib = readLib();
    if(act === "open" && lib[id]){ closePop(); try{ loadProject(lib[id].data); toast(`🎵 Opened "${lib[id].name}"`); }catch(e){ toast("😕 That song couldn't be opened"); } return true; }
    if(act === "del" && lib[id]){
      if(delArmed !== id){ delArmed = id; toast("Tap 🗑 again to delete"); setTimeout(() => { if(delArmed === id) delArmed = null; }, 2500); return true; }
      delete lib[id]; writeLib(lib); delArmed = null; openSongs(); return true;
    }
    return true;
  });
  setTimeout(() => { const i = $("#songName"); if(i) i.addEventListener("keydown", e => e.stopPropagation()); }, 0);
}
async function saveProjectFile(){
  const name = safeName(projectName) + ".robogroove";
  const blob = new Blob([JSON.stringify(projectData(), null, 1)], {type:"application/json"});
  if(isNative()){
    try{
      const FS = capPlugin("Filesystem"), SH = capPlugin("Share"), data = await blobToB64(blob);
      let uri, where = "Documents › RoboGroove › Songs";
      try{ uri = (await FS.writeFile({path:"RoboGroove/Songs/" + name, data, directory:"DOCUMENTS", recursive:true})).uri; }
      catch(e){ uri = (await FS.writeFile({path:name, data, directory:"CACHE"})).uri; where = null; }
      busyShow("📁", where ? `Song file saved in ${where} as "${name}".` : `Song file "${name}" is ready.`, null,
        [["📤 Share", () => SH.share({title:name, files:[uri]}).catch(()=>{}), !where], ["✔ Done", busyHide, !!where]]);
    }catch(e){ toast("😕 Couldn't save the song file"); }
    return;
  }
  const file = new File([blob], name, {type:"application/json"});
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if(iOS && navigator.canShare && navigator.canShare({files:[file]})){
    busyShow("📁", `Your song file "${name}" is ready. Tap "Save to Files".`, null,
      [["📤 Save to Files", () => navigator.share({files:[file], title:name}).catch(()=>{}), true], ["✖ Close", busyHide]]);
  } else {
    const a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 30000); toast(`📁 Downloaded "${name}"`);
  }
}
(function(){
  const inp = document.createElement("input"); inp.type = "file"; inp.id = "projFile"; inp.accept = ".robogroove,.json,application/json"; inp.className = "hidden";
  document.body.appendChild(inp);
  inp.addEventListener("change", async () => {
    const f = inp.files && inp.files[0]; inp.value = "";
    if(!f) return;
    try{ loadProject(JSON.parse(await f.text())); toast(`📂 Opened "${projectName}"`); }
    catch(e){ toast("😕 That file isn't a Robo Groove song"); }
  });
})();
$("#songsBtn").addEventListener("pointerup", () => openSongs());

/* ---------- lights (visualizer) menu ---------- */
function vizHtml(){
  const m = viz.mode;
  return `<h4>🌈 Lights</h4><div class="prow" style="margin:0 0 .5rem">
      <button data-v="random" class="${m === "random" ? "sel" : ""}">🎲 Surprise me</button><button data-v="off" class="${m === "off" ? "sel" : ""}">⏸ Lights off</button></div>
    <div class="pgrid" style="grid-template-columns:repeat(5,1fr)">` +
    VIZ_STYLES.map(([n, ic], i) => `<button data-v="${i}" class="${m === i ? "sel" : ""}"><span class="ic">${ic}</span>${n}</button>`).join("") + `</div>
    <p class="hint">Pick one to keep it on, or Surprise me to switch every little while.</p>`;
}
$("#vizBtn").addEventListener("pointerup", () => openPop($("#vizBtn"), vizHtml(), v => { viz.setMode(v === "random" || v === "off" ? v : +v); renderVizBtn(); }));
function renderVizBtn(){ const m = viz.mode; $("#vizBtn").textContent = m === "off" ? "🌈 Off" : m === "random" ? "🌈 Lights" : `${VIZ_STYLES[m][1]} ${VIZ_STYLES[m][0]}`; }

/* ---------- mute ---------- */
let muted = false;
try{ muted = localStorage.getItem("roboGroove.mute") === "1"; }catch(e){}
function applyMute(){ if(master && ctx && !(ctx instanceof OfflineAudioContext)) master.gain.setTargetAtTime(muted ? 0 : .5, ctx.currentTime, .02); $("#muteBtn").textContent = muted ? "🔇" : "🔊"; }
$("#muteBtn").addEventListener("pointerup", () => { muted = !muted; try{ localStorage.setItem("roboGroove.mute", muted ? "1" : "0"); }catch(e){} initAudio(); applyMute(); });

/* ---------- credits ---------- */
$("#creditsBtn") && $("#creditsBtn").addEventListener("pointerup", () => openPop($("#creditsBtn"), `<h4>🎼 Credits</h4><div class="credits">
  <p><b>Robo Groove</b> by NerdHomies.</p>
  <p>Instrument recordings: <b>Versilian Community Sample Library (VCSL)</b> by Versilian Studios — CC0 public domain.</p>
  <p>More instruments: <b>FluidR3 GM</b> SoundFont by Frank Wen — MIT License (via midi-js-soundfonts).</p>
  <p>MP3 saving: <b>lamejs</b> — LGPL. Fonts: <b>Fredoka</b> &amp; <b>Figtree</b> — SIL Open Font License.</p></div>`, () => {}));
