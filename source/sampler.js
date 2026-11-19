/* =====================================================================
   SAMPLER — real recorded instruments (VCSL CC0 + FluidR3 GM MIT)
   Samples are embedded as base64 MP3 and decoded lazily per instrument,
   so only the instruments a song uses take up memory.
   ===================================================================== */
let SAMP = null;
function sampData(){
  if(SAMP === null){
    const el = document.getElementById("sampleData");
    try{ SAMP = el ? JSON.parse(el.textContent) : {}; }catch(e){ SAMP = {}; }
    if(el) el.textContent = "";
  }
  return SAMP;
}
const SETS = {}, LOADING = {};
function b64ToBuf(b){ const s = atob(b), u = new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i] = s.charCodeAt(i); return u.buffer; }
function decodeOne(ab){ return new Promise((res, rej) => { const p = ctx.decodeAudioData(ab, res, rej); if(p && p.then) p.then(res, rej); }); }
function onsetOf(buf){            // MP3 decoders add a little silence at the start; find the real attack
  const d = buf.getChannelData(0), n = Math.min(d.length, Math.floor(buf.sampleRate*.3));
  let pk = 0; for(let i=0;i<n;i++) pk = Math.max(pk, Math.abs(d[i]));
  const th = pk*.02;
  for(let i=0;i<n;i++) if(Math.abs(d[i]) > th) return Math.max(0, i - buf.sampleRate*.0015)/buf.sampleRate;
  return 0;
}
function loadSet(name){
  if(!name) return Promise.resolve(null);
  if(SETS[name]) return Promise.resolve(SETS[name]);
  if(LOADING[name]) return LOADING[name];
  const src = sampData()[name];
  if(!src || !ctx) return Promise.resolve(null);
  LOADING[name] = (async () => {
    if(src.kind === "pitched"){
      const notes = (await Promise.all(src.notes.map(async ([m, b]) => { try{ const buf = await decodeOne(b64ToBuf(b)); return {m, buf, off:onsetOf(buf)}; }catch(e){ return null; } }))).filter(Boolean);
      if(!notes.length) throw new Error("no playable notes");
      notes.sort((a,b) => a.m - b.m);
      SETS[name] = {kind:"pitched", notes, lo:notes[0].m, hi:notes[notes.length-1].m};
    } else {
      const hits = {};
      await Promise.all(Object.entries(src.hits).map(async ([k, b]) => { try{ const buf = await decodeOne(b64ToBuf(b)); hits[k] = {buf, off:onsetOf(buf)}; }catch(e){} }));
      SETS[name] = {kind:"hits", hits};
    }
    return SETS[name];
  })().catch(e => { console.warn("sample load failed", name, e); delete LOADING[name]; return null; });
  return LOADING[name];
}
function playBuf(b, t, rate, gain, dur, rel, opts){
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = b.buf;
  if(opts && opts.bend){ s.playbackRate.setValueAtTime(rate*Math.pow(2,-2/12), t); s.playbackRate.linearRampToValueAtTime(rate, t + .09); }
  else s.playbackRate.value = rate;
  const natural = (b.buf.duration - b.off)/rate, att = (opts && opts.att) || 0;
  if(att){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + att); } else g.gain.setValueAtTime(gain, t);
  let stopAt = t + natural;
  if(dur < natural){ g.gain.setValueAtTime(gain, t + Math.max(dur, att)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, att) + rel); stopAt = Math.min(stopAt, t + Math.max(dur, att) + rel); }
  s.connect(g); g.connect((opts && opts.dest) || OUT);
  s.start(t, b.off); s.stop(stopAt + .02);
  return s;
}
const playHit = (h, t, rate, gain, dest) => playBuf(h, t, rate, gain, 99, .05, {dest});
function nearest(set, midi){ let best = set.notes[0]; for(const n of set.notes) if(Math.abs(n.m - midi) < Math.abs(best.m - midi)) best = n; return best; }
// per-instrument playing style: g = level, ring = struck instruments ring at least this long, held = cut at note end
const SPAR = {
  piano:{g:.42,ring:.9}, epiano:{g:.45,ring:1}, organ:{g:.28,held:1,att:.01}, strings:{g:.32,held:1,att:.07}, pizz:{g:.5,ring:.25},
  harp:{g:.48,ring:1.1}, glock:{g:.3,ring:.7}, horn:{g:.36,held:1,att:.03}, brass:{g:.36,held:1}, choir:{g:.3,held:1,att:.09},
  clav:{g:.42,ring:.2}, harpsichord:{g:.36,ring:.5}, steeldrums:{g:.42,ring:.5}, marimba:{g:.5,ring:.45}, accordion:{g:.3,held:1,att:.02},
  harmonica:{g:.36,held:1,att:.02}, violin:{g:.36,held:1,att:.04}, vibes:{g:.42,ring:1.1}, tenorsax:{g:.42,held:1,att:.02}, altosax:{g:.4,held:1,att:.02},
  flute:{g:.42,held:1,att:.03}, piccolo:{g:.32,held:1,att:.02}, clarinet:{g:.4,held:1,att:.02}, oboe:{g:.38,held:1,att:.02}, trumpet:{g:.36,held:1,att:.01},
  trombone:{g:.38,held:1,att:.02}, tuba:{g:.5,held:1,att:.02}, bassoon:{g:.45,held:1,att:.02}, panflute:{g:.42,held:1,att:.03},
  recorder:{g:.4,held:1,att:.02}, ocarina:{g:.42,held:1,att:.03},
  bass_finger:{g:.62,held:1}, bass_upright:{g:.62,ring:.3}, bass_slap:{g:.55,held:1}, bass_pick:{g:.58,held:1}, contrabass:{g:.55,held:1,att:.05},
};
// synth timbre name -> sample set (synths not listed stay synthesized: EDM, Space, chiptune, 808…)
const SAMPLED = {
  piano:"piano", honky:"piano", epiano:"epiano", rhodes:"epiano", organ:"organ", organShort:"organ", strings:"strings", pizz:"pizz",
  harp:"harp", celesta:"glock", horn:"horn", brass:"brass", choir:"choir", bell:"vibes", clav:"clav", harpsi:"harpsichord",
  steelpan:"steeldrums", marimba:"marimba", accordion:"accordion", melodica:"accordion", harmonica:"harmonica", fiddle:"violin",
  vibes:"vibes", sax:"tenorsax", flute:"flute", windFlute:"flute", piccolo:"piccolo", clarinet:"clarinet", oboe:"oboe",
  trumpet:"trumpet", trombone:"trombone", tuba:"tuba", bassoon:"bassoon", panflute:"panflute", recorder:"recorder", ocarina:"ocarina",
  windSax:"altosax", bassSine:"bass_finger", bassUpright:"bass_upright", bassSlap:"bass_slap", bassPick:"bass_pick", bassPad:"contrabass",
};
for(const [tim, set] of Object.entries(SAMPLED)) if(TIM[tim]) TIM[tim].smp = set;
function sampleNote(name, midi, t, dur, extra){
  const set = SETS[name];
  if(!set){ loadSet(name); return false; }
  while(midi > set.hi + 5) midi -= 12;
  while(midi < set.lo - 5) midi += 12;
  const P = SPAR[name] || {g:.4}, n = nearest(set, midi), rate = Math.pow(2, (midi - n.m)/12);
  const d = P.held ? dur : Math.max(dur, P.ring || .3);
  const o = Object.assign({att:P.att}, extra || {}), g = P.g * (o.gain || 1);
  playBuf(n, t, rate, g, d, P.held ? .12 : .25, o);
  if(o.chorus) playBuf(n, t + .004, rate*Math.pow(2, 9/1200), g*.7, d, .25, o);   // honky-tonk detune
  return true;
}

/* ---------- drums: acoustic kits use real hits, electronic kits stay synthesized ---------- */
const ACOUSTIC = {pop:1, disco:1, rock:1, metal:1, funk:1, reggae:1, latin:1, country:1, jazz:1, lo:1, ac:1, cin:1, mt:1};
function sampleDrum(d, t, v, kitName){
  const K = SETS.kit;
  if(!K){ loadSet("kit"); return false; }
  const H = K.hits, acoustic = kitName !== "edm" && kitName !== "hiphop" && kitName !== "space";
  let key = null, rate = .985 + Math.random()*.03, gain = v;
  if(d === "n"){ const B = SETS.bongos; if(!B){ loadSet("bongos"); return false; } playHit(B.hits[Math.random() < .5 ? "hi" : "lo"], t, rate, v*.8); return true; }
  if(!acoustic){ if(d !== "c") return false; key = Math.random() < .5 ? "c" : "c2"; }
  else switch(d){
    case "k": if(kitName !== "cinema") return false; key = "bd"; gain *= 1.2; break;
    case "s": key = kitName === "cinema" ? "ms" : (v < .4 ? "sg" : "s"); break;
    case "r": key = "r"; break;
    case "h": key = "h"; gain *= .75; break;
    case "o": key = "o"; gain *= .7; break;
    case "x": key = "x"; gain *= .75; break;
    case "y": key = "y"; gain *= .55; break;
    case "t": key = "t"; if(kitName === "cinema"){ rate *= .6; gain *= 1.3; } break;
    case "m": key = "m"; if(kitName === "cinema") rate *= .75; break;
    case "c": key = Math.random() < .5 ? "c" : "c2"; break;
    case "b": key = "b"; gain *= .65; break;
    case "w": key = kitName === "country" ? "wb" : "w"; gain *= .8; break;
    case "z": key = "z"; gain *= .55; break;
    case "a": key = "a"; gain *= .6; break;
    case "q": key = Math.random() < .5 ? "q" : "q2"; break;
    default: return false;
  }
  const h = H[key]; if(!h) return false;
  playHit(h, t, rate, gain*.9);
  return true;
}

/* ---------- guitar ---------- */
const GTONE = {clean:"gtr_clean", bright:"gtr_clean", nylon:"gtr_nylon", twang:"gtr_steel", jazz:"gtr_jazz", banjo:"banjo", dist:"gtr_over", heavy:"gtr_dist"};
const GLEVEL = {clean:.5, bright:.5, nylon:.6, twang:.5, jazz:.6, banjo:.5, dist:.36, heavy:.34};
function sampleGuitar(e, t, tn, wah){
  const name = GTONE[tn], set = SETS[name];
  if(!set){ loadSet(name); return false; }
  const power = tn === "dist" || tn === "heavy";
  let use = name, dest = OUT;
  if(e.mute && !power){ if(SETS.gtr_muted) use = "gtr_muted"; else loadSet("gtr_muted"); }
  if(e.mute && use === name){ const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = power ? 1400 : 1100; f.connect(dest); dest = f; }
  if(tn === "bright"){ const f = ctx.createBiquadFilter(); f.type = "highshelf"; f.frequency.value = 2500; f.gain.value = 5; f.connect(dest); dest = f; }
  if(wah && !e.mute && e.dir !== "n"){
    const w = ctx.createBiquadFilter(), mk = ctx.createGain(); w.type = "bandpass"; w.Q.value = 1.6; mk.gain.value = 2;
    w.frequency.setValueAtTime(500, t); w.frequency.exponentialRampToValueAtTime(2400, t + .12);
    w.connect(mk); mk.connect(dest); dest = w;
  }
  const dur = e.mute ? .09 : e.dur*SIX, many = e.notes.length > 3;
  const g = (e.vel || 1) * GLEVEL[tn] * (many ? .55 : 1) / (SPAR[use] ? 1 : 1);
  e.notes.forEach((m, i) => {
    const st = t + i*(e.dir === "u" ? .011 : .015);
    const s2 = SETS[use]; let mm = m;
    while(mm > s2.hi + 5) mm -= 12; while(mm < s2.lo - 5) mm += 12;
    const n = nearest(s2, mm);
    playBuf(n, st, Math.pow(2,(mm - n.m)/12), g, Math.max(dur, e.mute ? .09 : .2), e.mute ? .04 : .2, {dest, bend:e.bend});
  });
  return true;
}

/* =====================================================================
   MR. SLOW'S BONGOS — H/h hi open · L/l lo open · m hi muted · w lo muted · r roll
   ===================================================================== */
const BONGOS = {
  pop:{A:"H..h..L.H..h..L.", B:"h.hL.h.Lh.hL.hLL"},       disco:{A:"..H...H...H...H.", B:"mhmHmhmHmhmHmhmH"},
  edm:{A:"H..H..L.H..H..L.", B:"..h.h.L...h.h.LL"},       lofi:{A:"H.....l...h.....", B:"h..l..h...L..h.."},
  adventure:{A:"L...L...L..hL.h.", B:"LhhLhhLhLhhLhhLh"},     rock:{A:"H.h.L.h.H.h.L.h.", B:"HhLhHhLhHhLhHhLh"},
  metal:{A:"HLHLHLHLHLHLHLHL", B:"H.H.LLLLH.H.LLLL"},       hiphop:{A:"H......h..L.....", B:"h.h...L.h.h...L."},
  funk:{A:"m.Hm.mLm.mHm.mL.", B:"H.mHm.L.mHm.Lm.m"},       reggae:{A:"....H.......H.l.", B:"..h...h...h..hL."},
  latin:{A:"mhmHmhmLmhmHmhmL", B:"H.hLh.hLH.hLh.LL"},       country:{A:"H.h.L.h.H.h.L.h.", B:"h..h..L.h..h..L."},
  jazz:{A:"H..h..L.....h...", B:"..h..h..L..h...."},       space:{A:"H...h...L...h...", B:"h.h.h.h.L.L.L.L."},
};
VARS.bongos = [["Groove","🪘"],["Groove 2","🎶"],["Busy","⚡"],["Martillo","🔨"],["Sparse","🌙"],["Answer","🗣️"],["Rolls","🌀"],["Fill","💥"]];
const BCHAR = {H:["hi",1], h:["hi",.7], L:["lo",1], l:["lo",.7], m:["him",.6], w:["lom",.6], r:["roll",.8]};
function compileBongos(ref, ev){
  const S = BONGOS[ref.g], v = ref.v, bars = [];
  const beats = s => s.split("").map((c,i) => i%4 ? "." : (c === "." ? "h" : c)).join("");
  switch(v){
    case 0: bars.push(S.A,S.A,S.A,S.A); break;
    case 1: bars.push(S.B,S.B,S.B,S.B); break;
    case 2: { const b = S.A.split("").map((c,i) => c !== "." ? c : (i%2 ? "m" : "h")).join(""); bars.push(b,b,b,b); break; }
    case 3: bars.push("mhmHmhmLmhmHmhmL","mhmHmhmLmhmHmhmL","mhmHmhmLmhmHmhmL","mhmHmhmLmhmHmLLL"); break;
    case 4: { const b = beats(S.A); bars.push(b,b,b,b); break; }
    case 5: { const a = S.A.slice(0,8)+"........", b = "........"+S.B.slice(8); bars.push(a,b,a,b); break; }
    case 6: bars.push(S.A,S.A,S.A, S.A.slice(0,8)+"r...r..."); break;
    case 7: bars.push(S.A,S.A,S.A, S.A.slice(0,8)+"HhHhLLLL"); break;
  }
  bars.join("").split("").forEach((c, i) => { if(BCHAR[c]) ev[i].push({b:BCHAR[c][0], vel:BCHAR[c][1]}); });
}
function playBongo(e, t){
  const B = SETS.bongos;
  if(B && B.hits[e.b]){ const k = e.b === "hi" && Math.random() < .4 ? "hi2" : e.b === "lo" && Math.random() < .4 ? "lo2" : e.b; playHit(B.hits[k] || B.hits[e.b], t, .985 + Math.random()*.03, e.vel*.85); return; }
  loadSet("bongos");
  const hi = e.b[0] === "h" || e.b === "roll";
  tone("sine", hi ? 470 : 330, hi ? 420 : 290, t, e.b.length > 2 ? .06 : .14, .5*e.vel);
}

/* ---------- which sample sets a loop needs (so they're ready before it plays) ---------- */
function setsFor(inst, ref, mood){
  const need = new Set();
  if(!ref) return need;
  if(inst === "drums"){ need.add("kit"); if(drumPattern(ref.g, ref.v).n.includes("x")) need.add("bongos"); }
  else if(inst === "bongos") need.add("bongos");
  else if(inst === "guitar"){ const S = GTRS[ref.g]; need.add(GTONE[S.tone]); if(S.pkTone) need.add(GTONE[S.pkTone]); if(!/dist|heavy/.test(S.tone)) need.add("gtr_muted"); }
  else for(const list of compile(inst, ref, mood || "happy")) for(const e of list){ const s = e.tim && TIM[e.tim] && TIM[e.tim].smp; if(s) need.add(s); }
  return need;
}
function setsForSections(sections){
  const need = new Set(["kit"]);
  for(const s of sections) for(const inst of INSTS) if(s[inst]) setsFor(inst, s[inst], s.mood).forEach(n => need.add(n));
  return need;
}
function ensureSamples(names){ return Promise.all([...names].map(loadSet)); }
