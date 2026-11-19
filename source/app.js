/* =====================================================================
   APP: state, robot, band, sequencer, UI
   ===================================================================== */
const STORE_KEY = "roboGroove.v4";
const LANES = ["head","arm","leg"], INSTS = ["drums","bongos","keys","guitar","winds"];
const MAX_SECTIONS = 12;
const BAR_OPTIONS = [1,2,3,4,8,12,16,24];
const SEC_COLORS = ["#ffd166","#7df9ff","#ff8fab","#b8f2a0","#cdb4ff","#ffb38a","#9bf6ff","#fdffb6"];
const WHO = {drums:"🧸", bongos:"🐢", keys:"🧚", guitar:"🦄", winds:"🦊"};
const TEMPOS = [[60,"🐌","Snail"],[80,"🐢","Slow"],[100,"🚶","Walk"],[120,"🏃","Run"],[140,"🐇","Fast"],[160,"🚀","Rocket"],[180,"⚡","Zoom"]];
const tempoIcon = b => TEMPOS.reduce((a,t) => Math.abs(t[0]-b) < Math.abs(a[0]-b) ? t : a)[1];

const BLOCKS = {
  spin:{cat:"head",label:"Spin",ic:"🌀"}, bob:{cat:"head",label:"Bob",ic:"🦘"}, tilt:{cat:"head",label:"Tilt",ic:"🙃"},
  blink:{cat:"head",label:"Blink",ic:"😉"}, grow:{cat:"head",label:"Grow",ic:"🎈"}, pulse:{cat:"head",label:"Pulse",ic:"💓"},
  wave:{cat:"arm",label:"Wave",ic:"👋"}, pump:{cat:"arm",label:"Pump",ic:"💪"},
  clap:{cat:"arm",label:"Clap",ic:"👏",wv:"noise"}, heart:{cat:"arm",label:"Heart",ic:"❤️",wv:"triangle"},
  snake:{cat:"arm",label:"Snake",ic:"🐍",wv:"sawtooth"}, square:{cat:"arm",label:"Square",ic:"🟧",wv:"square"},
  circle:{cat:"arm",label:"Circle",ic:"⭕",wv:"sine"},
  jump:{cat:"leg",label:"Jump",ic:"⬆️"}, stomp:{cat:"leg",label:"Stomp",ic:"🦶"}, kick:{cat:"leg",label:"Kick",ic:"🦵"},
  shuffle:{cat:"leg",label:"Shuffle",ic:"↔️"},
};

/* ---------- state ---------- */
const blank = (v=null) => Array(STEPS).fill(v);
function newSection(){
  return {bars:4, mood:"happy", head:blank(), arm:blank(), leg:blank(), rev:blank(false), dly:blank(false),
          drums:{g:"pop",v:0}, keys:{g:"pop",v:0}, guitar:null, winds:null, bongos:null};
}
const state = { skin:"A", tab:"robot", sub:"head", mode:"loop", sections:[newSection()], cur:0,
                browse:{drums:"pop", keys:"pop", guitar:"pop", winds:"pop", bongos:"pop"}, cursor:0, loop:null };
const sec = () => state.sections[state.cur];
const validRef = r => (r && GENRES[r.g] && Number.isInteger(r.v) && r.v >= 0 && r.v < 8) ? {g:r.g, v:r.v} : null;
const OLD_V = {drums:[0,2,4,7], keys:[0,2,4,6], guitar:[0,2,4,6]};          // stop-2 loop numbers → beta numbers
const OLD_BEATS = {basic:{g:"pop",v:0}, funky:{g:"funk",v:0}, bouncy:{g:"disco",v:0}, chill:{g:"lofi",v:0}};
function cleanSection(s, old){
  const n = newSection();
  for(const l of LANES) if(Array.isArray(s[l])) n[l] = Array.from({length:STEPS},(_,i)=> BLOCKS[s[l][i]] && BLOCKS[s[l][i]].cat===l ? s[l][i] : null);
  for(const f of ["rev","dly"]) if(Array.isArray(s[f])) n[f] = Array.from({length:STEPS},(_,i)=>!!s[f][i]);
  if(BAR_OPTIONS.includes(+s.bars)) n.bars = +s.bars; else if(+s.bars > 24) n.bars = 24;
  n.mood = MOODS[s.mood] ? s.mood : (old ? "adventure" : "happy");
  if(typeof s.drums === "string"){ n.drums = OLD_BEATS[s.drums] || null; n.keys = null; }
  else for(const i of INSTS) if(i in s){
    let r = s[i];
    if(old && r && OLD_V[i][r.v] !== undefined) r = {g:r.g, v:OLD_V[i][r.v]};
    n[i] = validRef(r);
  }
  return n;
}
function load(){
  try{
    let d = JSON.parse(localStorage.getItem(STORE_KEY) || "null"), old = false;
    if(!d){ d = JSON.parse(localStorage.getItem("roboGroove.v3") || localStorage.getItem("roboGroove.v2") || "null"); old = !!d; }
    if(d && Array.isArray(d.sections) && d.sections.length){
      state.sections = d.sections.slice(0, MAX_SECTIONS).map(s => cleanSection(s, old));
      state.cur = Math.min(Math.max(0, +d.cur||0), state.sections.length-1);
      if(d.skin==="A"||d.skin==="B") state.skin = d.skin;
      if(d.mode==="song") state.mode = "song";
      if(+d.bpm) setTempo(+d.bpm);
      state.cursor = Math.max(0, +d.cursor||0);
      if(d.loop && d.loop.b > d.loop.a) state.loop = {a:+d.loop.a, b:+d.loop.b};
      clampSongMarks();
    }
  }catch(e){}
}
function save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify({skin:state.skin, mode:state.mode, sections:state.sections, cur:state.cur, bpm:BPM, cursor:state.cursor, loop:state.loop})); }catch(e){} }

/* ---------- audio context ---------- */
function initAudio(){
  if(ctx){ if(ctx.state !== "running" && ctx.resume) ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  try{ if(navigator.audioSession) navigator.audioSession.type = "playback"; }catch(_){}   // iPhone/iPad: play even with the silent switch on
  setupAudio(new AC({latencyHint:"interactive"}));
  if(typeof muted !== "undefined" && muted) master.gain.value = 0;
  if(ctx.state !== "running") ctx.resume();
}

/* ---------- robot move sounds ---------- */
const SFX = {
  spin:  t => tone("square",200,900,t,0.34,0.13),
  bob:   t => { tone("sine",660,null,t,0.08,0.45); tone("sine",440,null,t+0.12,0.1,0.45); },
  tilt:  t => tone("triangle",720,240,t,0.3,0.45),
  blink: t => { tone("sine",1760,null,t,0.04,0.3); tone("sine",1760,null,t+0.1,0.04,0.3); },
  grow:  t => { const f = ctx.createBiquadFilter(); f.type="lowpass"; f.Q.value=8;
                f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(3500,t+0.38);
                f.connect(OUT); tone("sawtooth",110,220,t,0.4,0.3,f); },
  pulse: t => { const trem = ctx.createGain(); trem.gain.value = 0.5; trem.connect(OUT);
                const lfo = ctx.createOscillator(), lg = ctx.createGain();
                lfo.frequency.value = 14; lg.gain.value = 0.5; lfo.connect(lg); lg.connect(trem.gain);
                lfo.start(t); lfo.stop(t+0.45); tone("sine",110,null,t,0.4,0.9,trem); },
  wave:  t => { noise(t,0.12,0.45,"bandpass",2200,1); tone("square",1300,300,t,0.12,0.12); },
  pump:  t => { tone("sine",130,34,t,0.42,1.0); noise(t,0.03,0.4,"lowpass",900); },
  clap:  t => { clapSound(t,0.6); clapSound(t+STEP_DUR/2,0.6); },
  heart: t => { tone("triangle",392,null,t,0.12,0.55); tone("triangle",523,null,t+0.16,0.22,0.55); },
  snake: t => { const o = tone("sawtooth",220,null,t,0.42,0.18);
                const lfo = ctx.createOscillator(), lg = ctx.createGain();
                lfo.frequency.value = 9; lg.gain.value = 45; lfo.connect(lg); lg.connect(o.frequency);
                lfo.start(t); lfo.stop(t+0.47); noise(t,0.3,0.06,"highpass",5000); },
  square:t => { [262,330,392,523].forEach((f,i)=>tone("square",f,null,t+i*STEP_DUR/5,0.08,0.13)); },
  circle:t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine";
                o.frequency.setValueAtTime(330,t); o.frequency.linearRampToValueAtTime(880,t+0.22); o.frequency.linearRampToValueAtTime(330,t+0.44);
                env(g,t,0.01,0.45,0.43); o.connect(g); g.connect(OUT); o.start(t); o.stop(t+0.5); },
  jump:  t => { tone("sine",180,900,t,0.22,0.5); tone("triangle",900,300,t+0.22,0.18,0.3); },
  stomp: t => { [0, STEP_DUR/2].forEach(d => { tone("sine",95,40,t+d,0.2,1.0); noise(t+d,0.05,0.3,"lowpass",600); }); },
  kick:  t => noise(t,0.3,0.4,"bandpass",400,2,5000),
  shuffle:t => { [0,1,2,3].forEach(i=>noise(t+i*STEP_DUR/4,0.05,i%2?0.3:0.2,"highpass",3000)); },
};

/* ---------- robot animation ---------- */
const SHAPES = {
  heart:  {d:"M150 262 C 52 196, 92 112, 150 160 C 208 112, 248 196, 150 262 Z", c:"#ff5d73"},
  square: {d:"M92 150 H208 V266 H92 Z", c:"#ff8c42"},
  circle: {d:"M150 146 a62 62 0 1 1 0 124 a62 62 0 1 1 0 -124", c:"#7df9ff"},
  snake:  {d:"M46 208 q26 -44 52 0 t52 0 t52 0 t52 0", c:"#06d6a0"},
};
const NS = "http://www.w3.org/2000/svg";
function installShapes(svg){
  const g = document.createElementNS(NS,"g");
  for(const [k,s] of Object.entries(SHAPES)){
    const p = document.createElementNS(NS,"path");
    p.setAttribute("d", s.d); p.setAttribute("pathLength","1"); p.setAttribute("stroke", s.c);
    p.setAttribute("class","shape shape-"+k); g.appendChild(p);
  }
  svg.querySelector(".mover").appendChild(g);
}
function parts(){
  const r = document.getElementById("robot"+state.skin), q = s => r.querySelector(s);
  return { r, mover:q(".mover"), rig:q(".rig"), head:q(".head"), eyes:q(".eyes"), armL:q(".armL"), armR:q(".armR"),
           legL:q(".legL")||q(".legs"), legR:q(".legR")||q(".legs"), wheel:!q(".legL"),
           lights:r.querySelectorAll(".light"), pls:r.querySelectorAll(".pl"), shape:k => q(".shape-"+k) };
}
const T = s => ({transform:s});
const R = deg => T(`rotate(${deg}deg)`);
const rot = arr => arr.map(R);
const kf = (fn, list) => list.map(([o,v]) => ({transform:fn(v), offset:o}));
const ANIMS = {
  spin:  p => [[p.head, rot([0,360])]],
  bob:   p => [[p.head,[T("translateY(0)"),T("translateY(-30px)"),T("translateY(0)"),T("translateY(-12px)"),T("translateY(0)")]]],
  tilt:  p => [[p.head, rot([0,-24,20,0])]],
  blink: p => [[p.eyes,[T("scaleY(1)"),T("scaleY(.08)"),T("scaleY(1)"),T("scaleY(.08)"),T("scaleY(1)")]]],
  grow:  p => [[p.head, kf(v=>`scale(${v})`, [[0,1],[.35,1.45],[.6,1.45],[1,1]])]],
  pulse: p => [[p.head,[T("scale(1)"),T("scale(1.13)"),T("scale(1)"),T("scale(1.13)"),T("scale(1)")]],
               ...[...p.pls].map(el=>[el,[{opacity:1},{opacity:.15},{opacity:1},{opacity:.15},{opacity:1}]])],
  wave:  p => [[p.armR, rot([0,-150,-112,-155,-112,0])]],
  pump:  p => [[p.armL, rot([0,160,60,160,0])],[p.armR, rot([0,-160,-60,-160,0])]],
  clap:  p => [[p.armL, rot([0,-62,-25,-62,0])],[p.armR, rot([0,62,25,62,0])]],
  heart: p => [[p.armL, rot([0,-58,-58,-58,0])],[p.armR, rot([0,58,58,58,0])]],
  snake: p => [[p.armL, rot([0,-40,25,-40,25,0])],[p.armR, rot([0,-25,40,-25,40,0])]],
  square:p => [[p.armL, kf(v=>`rotate(${v}deg)`, [[0,0],[.2,90],[.35,90],[.5,170],[.65,170],[.8,90],[1,0]]),"linear"],
               [p.armR, kf(v=>`rotate(${v}deg)`, [[0,0],[.2,-90],[.35,-90],[.5,-170],[.65,-170],[.8,-90],[1,0]]),"linear"]],
  circle:p => [[p.armL, rot([0,360]),"linear"],[p.armR, rot([0,-360]),"linear"]],
  jump:  p => [[p.mover,[T("translateY(0)"),T("translateY(-48px)"),T("translateY(0)")],"cubic-bezier(.3,.7,.4,1)"],
               ...(p.wheel ? [] : [[p.legL, rot([0,18,0])],[p.legR, rot([0,-18,0])]])],
  stomp: p => p.wheel
               ? [[p.legL,[T("translateY(0)"),T("translateY(-16px)"),T("translateY(0)"),T("translateY(-16px)"),T("translateY(0)")]]]
               : [[p.legL,[T("translateY(0)"),T("translateY(-22px)"),T("translateY(0)"),T("translateY(0)"),T("translateY(0)")]],
                  [p.legR,[T("translateY(0)"),T("translateY(0)"),T("translateY(0)"),T("translateY(-22px)"),T("translateY(0)")]]],
  kick:  p => [[p.legR, rot(p.wheel ? [0,-25,0] : [0,-65,0])]],
  shuffle:p => [[p.mover,[T("translateX(0)"),T("translateX(-22px)"),T("translateX(22px)"),T("translateX(-22px)"),T("translateX(0)")]],
                ...(p.wheel ? [] : [[p.legL, rot([0,14,-14,14,0])],[p.legR, rot([0,14,-14,14,0])]])],
};
const running = new Map();
function animate(el, frames, dur, easing){
  if(!el) return;
  const prev = running.get(el); if(prev) prev.cancel();
  running.set(el, el.animate(frames, {duration:dur, easing:easing||"ease-in-out"}));
}
function doMove(name){
  const p = parts(), dur = STEP_DUR*1000*0.95;
  ANIMS[name](p).forEach(([el,fr,ease]) => animate(el, fr, dur, ease));
  if(SHAPES[name]) animate(p.shape(name), [{strokeDashoffset:1,opacity:1},{strokeDashoffset:0,opacity:1,offset:.55},{strokeDashoffset:0,opacity:1,offset:.8},{strokeDashoffset:0,opacity:0}], dur*1.5, "ease-out");
  p.lights.forEach(l => animate(l, [{opacity:1},{opacity:.2},{opacity:1}], 250, "linear"));
}

/* ---------- band animation ---------- */
const $ = s => document.querySelector(s);
let band;
function buildBand(){
  const sp = $("#fairy .sparkles");
  for(let i=0;i<6;i++){
    const c = document.createElementNS(NS,"path");
    c.setAttribute("d","M0 -7 L2 -2 7 0 2 2 0 7 -2 2 -7 0 -2 -2Z"); c.setAttribute("fill","#FFE066"); c.setAttribute("stroke","#231B33"); c.setAttribute("stroke-width","1.2"); c.setAttribute("opacity","0");
    sp.appendChild(c);
  }
  const keyEls = {}; document.querySelectorAll("#fairy .pk").forEach(k => keyEls[+k.dataset.midi] = k);
  band = {
    bear: {head:$("#bear .bHead"), armL:$("#bear .bArmL"), armR:$("#bear .bArmR"), kick:$("#bear .kick"), snare:$("#bear .snare"), hat:$("#bear .hat"), crash:$("#bear .crash"), tom:$("#bear .tom")},
    fairy:{head:$("#fairy .fHead"), hL:$("#fairy .fHandL"), hR:$("#fairy .fHandR"), keys:keyEls, spark:[...sp.children]},
    turtle:{head:$("#turtle .tHead"), aL:$("#turtle .tArmL"), aR:$("#turtle .tArmR"), hi:$("#turtle .bongoHi"), lo:$("#turtle .bongoLo")},
    uni:  {head:$("#unicorn .uHead"), strum:$("#unicorn .uStrum"), guitar:$("#unicorn .guitar"), horn:$("#unicorn .horn")},
    fox:  {head:$("#fox .foxHead"), flute:$("#fox .flute"), holes:[...document.querySelectorAll("#fox .fhole")], hat:$("#fox .foxHat"), notes:[]},
  };
  const fn = $("#fox .foxNotes");
  for(let i=0;i<6;i++){
    const tx = document.createElementNS(NS,"text"); tx.textContent = i%2 ? "♫" : "♪";
    Object.entries({x:0, y:0, "font-size":24, "font-weight":900, fill:["#FFE066","#7DF9FF","#FF8FC7"][i%3], stroke:"#231B33", "stroke-width":1.5, "paint-order":"stroke", opacity:0}).forEach(([k,v])=>tx.setAttribute(k,v));
    fn.appendChild(tx); band.fox.notes.push(tx);
  }
}
const LEFT_HAND = "srctmqnbw", RIGHT_HAND = "hoyzap";
const thump = (el, s=1.08, d=150) => animate(el, [T("scale(1)"), T(`scale(${s})`), T("scale(1)")], d, "ease-out");
function drumHit(d){
  const b = band.bear;
  if(d === "k"){ thump(b.kick); if(typeof viz !== "undefined") viz.kick(); }
  else if(d === "x"){ animate(b.armR, rot([0,-34,0]), 260, "ease-out"); animate(b.crash, [R(0), R(-10), R(4), R(0)], 500); }
  else if(d === "t" || d === "m"){ animate(b.armL, rot([0,26,0]), 150, "ease-out"); thump(b.tom, 1.06, 140); }
  else if(LEFT_HAND.includes(d)){ animate(b.armL, rot([0,18,0]), 150, "ease-out"); animate(b.snare, [T("scaleY(1)"),T("scaleY(.9)"),T("scaleY(1)")], 140); }
  else if(RIGHT_HAND.includes(d)){ animate(b.armR, rot([0,-18,0]), 130, "ease-out"); animate(b.hat, [T("translateY(0)"),T("translateY(4px) rotate(-3deg)"),T("translateY(0)")], 130); }
}
function bongoHit(which){
  const tt = band.turtle, hi = which[0] === "h" || which === "roll";
  animate(hi ? tt.aL : tt.aR, [T("translateY(0)"), T("translateY(7px)"), T("translateY(0)")], 160, "ease-out");
  animate(hi ? tt.hi : tt.lo, [T("scaleY(1)"), T("scaleY(.92)"), T("scaleY(1)")], 150);
}
let sparkI = 0;
function keyFor(midi){ const K = band.fairy.keys; let m = midi; while(m > 83) m -= 12; while(m < 60) m += 12; return K[m] || K[m+1] || K[60]; }
function lightKey(k){ const black = k.classList.contains("bk"); animate(k, [{fill:"#FFE066"},{fill: black ? "#231B33" : "#FFF6E4"}], 320, "ease-out"); }
function keysHit(hand, midi){
  const f = band.fairy, press = [T("translateY(0)"),T("translateY(6px)"),T("translateY(0)")];
  if(hand !== "R") animate(f.hL, press, 180);
  if(hand !== "L") animate(f.hR, press, 180);
  const k = keyFor(midi); lightKey(k);
  const s = f.spark[sparkI++ % f.spark.length], x = +k.getAttribute("x") + 6;
  animate(s, [{transform:`translate(${x}px,200px) scale(.4)`,opacity:1},{transform:`translate(${x+(Math.random()*30-15)}px,150px) scale(1.2) rotate(90deg)`,opacity:0}], 700, "ease-out");
}
function gtrHit(dir){
  const u = band.uni;
  animate(u.strum, rot(dir==="u" ? [0,14,0] : dir==="n" ? [0,-8,0] : [0,-22,0]), dir==="n" ? 120 : 200);
  if(dir !== "n") animate(u.guitar, rot([0,-3,0]), 200);
}
let noteI = 0;
function windHit(midi){
  const f = band.fox;
  animate(f.flute, rot([0,-4,0]), 220);
  animate(f.holes[midi % 6], [{fill:"#FFE066"},{fill:"#5B6B7A"}], 300, "ease-out");
  const n = f.notes[noteI++ % f.notes.length], dx = -20 - Math.random()*30;
  animate(n, [{transform:"translate(30px,125px) scale(.6)",opacity:1},{transform:`translate(${30+dx}px,60px) scale(1.2)`,opacity:0}], 900, "ease-out");
}
let nod = 1, bulbPhase = 0;
function bandBeat(strong, s){
  nod = -nod;
  const d = Math.min(300, STEP_DUR*600);
  animate(band.bear.head, rot([0,6*nod,0]), d);
  animate(band.fairy.head, rot([0,-7*nod,0]), d);
  if(strong) animate(band.turtle.head, rot([0,4*nod,0]), d*1.6);            // Mr. Slow nods… slowly
  animate(band.uni.head, [R(0),T(`rotate(${5*nod}deg) translateY(4px)`),R(0)], d);
  animate(band.fox.head, rot([0,-5*nod,0]), d);
  if(strong && s && s.winds) animate(band.fox.hat, [T("translateY(0)"),T("translateY(-6px) rotate(-6deg)"),T("translateY(0)")], d);
  if(strong && s && s.guitar) animate(band.uni.horn, [{opacity:1},{opacity:.5},{opacity:1}], d);
  bulbPhase = (bulbPhase + 1) % 3; $("#title").dataset.phase = bulbPhase;     // marquee lights chase on the beat
}

/* ---------- touch-to-play: tap the instruments themselves ---------- */
const nowT = () => { initAudio(); return ctx.currentTime + .01; };
function withBus(fn){ const keep = OUT; OUT = BUS[0]; try{ fn(); } finally{ OUT = keep; } }
function curRef(inst, fallback){ return sec()[inst] || {g:fallback || "pop", v:0}; }
function chordNow(){ const p = playing && lastStep >= 0 ? Math.floor(lastStep/2) % 4 : (tapChord = (tapChord + 1) % 4); return p; }
let tapChord = -1;
function tapDrum(d){
  const kit = DRUMS[curRef("drums").g].kit;
  withBus(() => drum(d, nowT(), 1, kit)); drumHit(d);
}
function tapBongo(which){ withBus(() => playBongo({b:which, vel:1}, nowT())); bongoHit(which); }
function tapGuitar(){
  const ref = curRef("guitar"), S = GTRS[ref.g], c = chordNow(), mood = sec().mood;
  const notes = S.power ? gtrPower(mood, c) : gtrShape(mood, c);
  withBus(() => playGuitar({notes, dir:"d", dur:8, vel:1}, nowT(), S.tone, false)); gtrHit("d");
}
function tapFlute(){
  const ref = curRef("winds"), W = WINDS[ref.g], M = MOODS[sec().mood], sc = [];
  for(let m=72; m<=88; m++) if(M.scale.includes(m % 12)) sc.push(m);
  const m = sc[Math.floor(Math.random()*sc.length)];
  withBus(() => voice(TIM[W.tA] || TIM.windFlute, m, nowT(), .35)); windHit(m);
}
function tapKey(midi, el){
  withBus(() => voice(TIM.piano, midi, nowT(), .6));
  if(el) lightKey(el); else lightKey(keyFor(midi));
  animate(midi < 72 ? band.fairy.hL : band.fairy.hR, [T("translateY(0)"),T("translateY(6px)"),T("translateY(0)")], 160);
}
const ROBOT_TALK = [
  t => { [880,660,990,550].forEach((f,i) => tone("square", f, null, t+i*.07, .06, .12)); },
  t => { tone("sawtooth", 180, 1400, t, .35, .12); },
  t => { tone("sine", 1200, 300, t, .25, .3); tone("sine", 300, 1200, t+.25, .2, .25); },
  t => { for(let i=0;i<6;i++) tone("square", 400 + Math.random()*1400, null, t+i*.05, .04, .1); },
  t => { const o = tone("triangle", 520, null, t, .45, .3), l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 18; lg.gain.value = 120; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t+.5); },
  t => { tone("sine", 2000, 2000, t, .03, .25); tone("sine", 2600, 2600, t+.09, .03, .25); tone("sine", 1600, 400, t+.18, .2, .25); },
];
function tapAntenna(){
  withBus(() => ROBOT_TALK[Math.floor(Math.random()*ROBOT_TALK.length)](nowT()));
  const p = parts(); p.lights.forEach(l => animate(l, [{opacity:1},{opacity:.3},{opacity:1},{opacity:.3},{opacity:1}], 500, "linear"));
  animate(p.head, rot([0,-6,5,-3,0]), 450);
  p.r.querySelectorAll(".antGlow").forEach(gl => animate(gl, [{opacity:0},{opacity:.9},{opacity:0}], 500));
}
/* mini piano that pops up when the fairy's keys are touched */
function openPiano(){
  let pn = $("#piano");
  if(!pn){
    pn = document.createElement("div"); pn.id = "piano";
    const whites = [], blacks = [];
    for(let m=60; m<=84; m++){ const black = [1,3,6,8,10].includes(m % 12); (black ? blacks : whites).push(m); }
    pn.innerHTML = `<button class="pclose" aria-label="Close piano">✕</button><div class="pkeys">` +
      whites.map((m,i) => `<div class="pw" data-midi="${m}" style="left:${i/whites.length*100}%;width:${100/whites.length}%"><span>${["C","D","E","F","G","A","B"][[0,2,4,5,7,9,11].indexOf(m%12)]}</span></div>`).join("") +
      blacks.map(m => { const wi = whites.indexOf(m-1); return `<div class="pb" data-midi="${m}" style="left:${(wi+1)/whites.length*100 - 100/whites.length*.3}%;width:${100/whites.length*.6}%"></div>`; }).join("") + `</div>`;
    stageEl.appendChild(pn);
    const held = new Map();
    const press = (id, el) => { if(!el || held.get(id) === el) return; held.set(id, el); el.classList.add("down"); tapKey(+el.dataset.midi); setTimeout(() => el.classList.remove("down"), 180); };
    const keyAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest("#piano .pw, #piano .pb"); };
    pn.addEventListener("pointerdown", e => { if(e.target.closest(".pclose")){ pn.classList.remove("open"); return; } e.preventDefault(); try{ pn.setPointerCapture(e.pointerId); }catch(_){} press(e.pointerId, keyAt(e.clientX, e.clientY)); });
    pn.addEventListener("pointermove", e => { if(held.has(e.pointerId)) press(e.pointerId, keyAt(e.clientX, e.clientY)); });
    const up = e => held.delete(e.pointerId);
    pn.addEventListener("pointerup", up); pn.addEventListener("pointercancel", up);
  }
  pn.classList.add("open");
}
function instrumentTap(e){
  const t = e.target;
  const hit = t.closest("[data-hit]");
  if(hit){
    const svg = hit.ownerSVGElement && hit.ownerSVGElement.id;
    if(svg === "bear") tapDrum(hit.dataset.hit);
    else if(svg === "turtle") tapBongo(hit.dataset.hit);
    return true;
  }
  const key = t.closest("#fairy .pk"); if(key){ tapKey(+key.dataset.midi, key); openPiano(); return true; }
  if(t.closest("#unicorn .tapg")){ tapGuitar(); return true; }
  if(t.closest("#fox .tapf")){ tapFlute(); return true; }
  if(t.closest(".robot .antenna")){ tapAntenna(); return true; }
  return false;
}
const stageEl = $("#stage");
let fxLayer;
function showRing(){
  const d = document.createElement("div"); d.className = "ring"; fxLayer.appendChild(d);
  d.animate([{transform:"scale(.2)",opacity:.7},{transform:"scale(2.6)",opacity:0}],{duration:1100,easing:"ease-out"}).onfinish = () => d.remove();
}
function showEcho(){
  const x = 50 + Math.random()*20;
  for(let k=0;k<3;k++) setTimeout(() => {
    const d = document.createElement("div"); d.className = "echo"; d.textContent = "♪";
    d.style.left = (x + k*4) + "%"; d.style.top = "30%"; fxLayer.appendChild(d);
    d.animate([{transform:"translateY(0) scale(1)",opacity:1-k*.3},{transform:"translateY(-60px) scale(.6)",opacity:0}],{duration:800,easing:"ease-out"}).onfinish = () => d.remove();
  }, k*SIX*3*1000);
}
function beatPulse(strong, s){
  const p = parts();
  animate(p.rig, [T("translateY(0) scaleY(1)"), T(`translateY(${strong?7:4}px) scaleY(.98)`), T("translateY(0) scaleY(1)")], 220, "ease-out");
  bandBeat(strong, s);
  if(strong){ stageEl.classList.add("flash"); requestAnimationFrame(()=>requestAnimationFrame(()=>stageEl.classList.remove("flash"))); }
}

/* =====================================================================
   SEQUENCER — loop one part, or play the song (with start point + loop range)
   ===================================================================== */
let playing = false, timer = null, nextTime = 0, gpos = 0, pendingJump = null;
let lastStep = -1, lastStepT = 0;
const songBars = () => state.sections.reduce((a,s) => a + s.bars, 0);
const secStartBar = idx => { let a = 0; for(let i=0;i<idx;i++) a += state.sections[i].bars; return a; };
function secAtBar(bar){ let a = 0; for(let i=0;i<state.sections.length;i++){ if(bar < a + state.sections[i].bars) return i; a += state.sections[i].bars; } return state.sections.length-1; }
function clampSongMarks(){
  const tot = songBars();
  state.cursor = Math.min(state.cursor, tot-1);
  if(state.loop){ state.loop.b = Math.min(state.loop.b, tot); if(state.loop.a >= state.loop.b) state.loop = null; }
}
function locate(g){
  if(state.mode === "loop") return {idx:state.cur, local:g % (sec().bars*16), abs: secStartBar(state.cur)*16 + g % (sec().bars*16)};
  let a = 0;
  for(let i=0;i<state.sections.length;i++){ const L = state.sections[i].bars*16; if(g < a+L) return {idx:i, local:g-a, abs:g}; a += L; }
  return {idx:0, local:0, abs:0};
}
function wrapSong(){
  const total = songBars()*16;
  if(state.loop){ const A = state.loop.a*16, B = Math.min(state.loop.b*16, total); if(gpos >= B || gpos < A) gpos = A; }
  else if(gpos >= total) gpos = 0;
}
function scheduleAt(idx, local, t){
  const s = state.sections[idx], p = local % PAT, rp = local % RPAT, step = rp >> 2;
  const ts = t + swingOffset(swingOf(s), p);
  OUT = BUS[(s.rev[step]?1:0) | (s.dly[step]?2:0)];
  for(const inst of INSTS) if(s[inst]) playInst(inst, s[inst], p, ts, s.mood);
  if(rp % SUB === 0) for(const l of LANES){ const b = s[l][step]; if(b) SFX[b](t); }
  OUT = BUS[0];
  return {s, rp, step};
}
function scheduleSixteenth(t){
  if(pendingJump !== null && gpos % SUB === 0){ gpos = pendingJump; pendingJump = null; }
  if(state.mode === "song") wrapSong();
  const {idx, local, abs} = locate(gpos), {s, rp, step} = scheduleAt(idx, local, t);
  if(rp % SUB === 0) visQ.push({t, step, idx, local, abs, strong: step%2===0, rev:s.rev[step], dly:s.dly[step]});
  gpos++;
}
function scheduler(){ while(nextTime < ctx.currentTime + LOOKAHEAD){ scheduleSixteenth(nextTime); nextTime += SIX; } }
const outLatency = () => ctx ? (ctx.outputLatency || ctx.baseLatency || 0) : 0;
const playBtn = $("#play"), playhead = $("#playhead");
let starting = false;
async function play(){
  initAudio(); stopPreview();
  if(playing || starting) return;
  const missing = [...setsForSections(state.sections)].filter(n => !SETS[n]);
  if(missing.length){
    starting = true; playBtn.textContent = "🎵 …"; toast("🎵 The band is tuning up…");
    try{ await ensureSamples(missing); } finally{ starting = false; }
    if(playing) return;
  }
  playing = true; visQ = []; pendingJump = null;
  if(state.mode === "song"){
    gpos = state.cursor*16;
    if(state.loop && (state.cursor < state.loop.a || state.cursor >= state.loop.b)) gpos = state.loop.a*16;
  } else gpos = 0;
  nextTime = ctx.currentTime + 0.08;
  scheduler(); timer = setInterval(scheduler, 25);
  playBtn.textContent = "■ Stop"; playBtn.classList.add("on");
  $("#rhead").style.display = "block";
}
function stop(){
  playing = false; clearInterval(timer); timer = null; visQ = []; lastStep = -1;
  playBtn.textContent = "▶ Play"; playBtn.classList.remove("on");
  playhead.classList.remove("on"); setActive(-1);
  $("#rhead").style.display = "none";
  document.querySelectorAll(".chip2 .prog").forEach(p => p.style.width = 0);
}
playBtn.addEventListener("pointerup", () => playing ? stop() : play());

let activeStep = -1;
function setActive(i){
  if(activeStep >= 0) LANES.forEach(l => slots[l][activeStep].classList.remove("active"));
  activeStep = i;
  if(i >= 0) LANES.forEach(l => slots[l][i].classList.add("active"));
}
function fireStep(v){
  if(state.mode === "song" && v.idx !== state.cur && v.idx < state.sections.length){ state.cur = v.idx; renderSection(); }
  const s = state.sections[v.idx];
  setActive(v.step); lastStep = v.step; lastStepT = v.t; playhead.classList.add("on");
  beatPulse(v.strong, s);
  if(s) for(const l of LANES){ const b = s[l][v.step]; if(b) doMove(b); }
  if(v.rev) showRing();
  if(v.dly) showEcho();
  const chip = document.querySelector(`.chip2[data-i="${v.idx}"] .prog`);
  if(chip && s) chip.style.width = ((v.local+4)/(s.bars*16))*100 + "%";
  $("#rhead").style.left = ((v.abs+2)/(songBars()*16))*100 + "%";
}
const laneEl = l => document.querySelector(`.lane[data-lane=${l}]`);
let slotW = 0, gapW = 0;
function measure(){
  const lane = laneEl("head"), s0 = slots.head[0];
  if(s0){ slotW = s0.offsetWidth; gapW = (lane.clientWidth - slotW*STEPS)/(STEPS-1); }
}
function frame(ts){
  viz.frame(ts || performance.now());
  if(ctx){
    const now = ctx.currentTime - outLatency();
    for(let i=0; i<visQ.length; ){
      const v = visQ[i];
      if(v.t > now){ i++; continue; }
      visQ.splice(i,1);
      if(v.drum) drumHit(v.drum);
      else if(v.keys) keysHit(v.keys, v.midi);
      else if(v.gtr) gtrHit(v.gtr);
      else if(v.wind) windHit(v.wind);
      else if(playing) fireStep(v);
    }
    if(playing && lastStep >= 0){
      const f = Math.min(1, Math.max(0, (now - lastStepT)/STEP_DUR));
      playhead.style.transform = `translate3d(${lastStep*(slotW+gapW) + f*slotW}px,0,0)`;
    }
  }
  requestAnimationFrame(frame);
}

/* ---------- previews (when stopped) ---------- */
let pvBus = null, pvToken = 0;
let toastTimer = null;
function toast(msg){
  let el = document.getElementById("toast");
  if(!el){ el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}
function stopPreview(){
  if(!pvBus) return;
  const b = pvBus; pvBus = null;
  b.gain.setTargetAtTime(0, ctx.currentTime, .02); setTimeout(() => b.disconnect(), 400);
  visQ = visQ.filter(v => !v.pv);
}
function previewLoop(inst, ref){
  initAudio(); stopPreview();
  const need = [...setsFor(inst, ref, sec().mood)].filter(n => !SETS[n]);
  if(need.length){ const tok = ++pvToken; ensureSamples(need).then(() => { if(tok === pvToken && !playing) previewLoop(inst, ref); }); return; }
  pvBus = ctx.createGain(); pvBus.connect(master);
  const keep = OUT, t0 = ctx.currentTime + .05, before = visQ.length, mood = sec().mood;
  const from = (inst === "drums" && (ref.v === 5 || ref.v === 7)) ? 32 : 0, sw = DRUMS[ref.g].swing;
  OUT = pvBus;
  for(let p=0;p<32;p++) playInst(inst, ref, from+p, t0 + p*SIX + swingOffset(sw, p), mood);
  OUT = keep;
  for(let i=before;i<visQ.length;i++) visQ[i].pv = true;
}
function preview(id){
  initAudio();
  SFX[id](ctx.currentTime + 0.01);
  doMove(id);
}

/* =====================================================================
   UI
   ===================================================================== */
const ghost = $("#ghost");
const slots = {head:[], arm:[], leg:[]};
const genreBtn = $("#genreBtn");
function mkBlock(cls, ic, label, extra){
  const el = document.createElement("div");
  el.className = "block " + cls;
  el.innerHTML = `<div class="ic">${ic}</div><span>${label}</span>` + (extra ? `<div class="wv">${extra}</div>` : "");
  return el;
}
function renderPalette(){
  const box = $("#blocks"); box.innerHTML = "";
  const tab = state.tab, isInst = INSTS.includes(tab);
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("sel", t.dataset.tab === tab));
  $("#subtabs").classList.toggle("hidden", tab !== "robot");
  $("#skins").classList.toggle("hidden", tab !== "robot");
  genreBtn.classList.toggle("hidden", !isInst);
  box.classList.toggle("loops", isInst);
  document.querySelectorAll(".char").forEach(c => c.classList.toggle("selected", c.dataset.tab === tab));
  document.querySelectorAll(".sub").forEach(t => t.classList.toggle("sel", t.dataset.sub === state.sub));
  if(tab === "robot"){
    for(const [id,def] of Object.entries(BLOCKS)){
      if(def.cat !== state.sub) continue;
      const el = mkBlock(def.cat, def.ic, def.label, def.wv);
      draggable(el, () => ({id, lane:def.cat, from:-1}), () => {
        preview(id);
        const arr = sec()[def.cat], empty = arr.indexOf(null);
        if(empty >= 0){ arr[empty] = id; save(); renderSlots(); }
      });
      box.appendChild(el);
    }
    return;
  }
  const g = state.browse[tab], cur = sec()[tab];
  genreBtn.innerHTML = `${GENRES[g].ic} ${GENRES[g].label} ▾`;
  VARS[tab].forEach(([name, ic], v) => {
    const el = mkBlock(tab + (cur && cur.g === g && cur.v === v ? " sel" : ""), ic, name, GENRES[g].ic);
    el.addEventListener("pointerup", () => {
      sec()[tab] = {g, v}; save(); renderPalette(); renderChips();
      if(!playing) previewLoop(tab, {g, v});
    });
    box.appendChild(el);
  });
  const off = mkBlock("off" + (!cur ? " sel" : ""), "🔇", "Off");
  off.addEventListener("pointerup", () => { sec()[tab] = null; save(); stopPreview(); renderPalette(); renderChips(); });
  box.appendChild(off);
}
function setTab(tab){
  state.tab = tab;
  if(INSTS.includes(tab) && sec()[tab]) state.browse[tab] = sec()[tab].g;
  renderPalette();
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("pointerup", () => setTab(t.dataset.tab)));
document.querySelectorAll(".sub").forEach(t => t.addEventListener("pointerup", () => { state.sub = t.dataset.sub; renderPalette(); }));
document.querySelectorAll(".char").forEach(c => {
  c.addEventListener("pointerdown", e => { c._inst = instrumentTap(e); });
  c.addEventListener("pointerup", () => { if(!c._inst) setTab(c.dataset.tab); c._inst = false; });
});
genreBtn.addEventListener("pointerup", () => {
  const tab = state.tab;
  openPop(genreBtn, `<h4>${WHO[tab]} Pick a style</h4><div class="pgrid" style="grid-template-columns:repeat(5,1fr)">` +
    Object.entries(GENRES).map(([k,g]) => `<button data-v="${k}" class="${k===state.browse[tab]?"sel":""}"><span class="ic">${g.ic}</span><span>${g.label}</span></button>`).join("") + `</div>`,
    v => { state.browse[tab] = v; renderPalette(); });
});

/* ---------- popover ---------- */
const popBg = $("#popbg"), pop = $("#pop");
function openPop(anchor, html, onPick, keepOpen){
  pop.innerHTML = html; popBg.classList.remove("hidden"); pop.classList.remove("hidden");
  const r = anchor.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
  const x = Math.min(Math.max(8, r.left + r.width/2 - pw/2), innerWidth - pw - 8);
  let y = r.top - ph - 8; if(y < 8) y = Math.min(r.bottom + 8, innerHeight - ph - 8);
  pop.style.left = x + "px"; pop.style.top = y + "px";
  pop.onpointerup = e => { const b = e.target.closest("[data-v]"); if(b){ if(!keepOpen || !keepOpen(b.dataset.v)) closePop(); onPick(b.dataset.v); } };
}
function closePop(){ popBg.classList.add("hidden"); pop.classList.add("hidden"); }
popBg.addEventListener("pointerdown", closePop);

/* ---------- tempo ---------- */
const tempoBtn = $("#tempoBtn");
function renderTempo(){ tempoBtn.textContent = `${tempoIcon(BPM)} ${BPM} BPM ▾`; }
function tempoHtml(){
  const dg = sec().drums && sec().drums.g, match = dg ? `<div class="prow"><button data-v="match">🎯 Match ${GENRES[dg].ic} ${GENRES[dg].label} speed (${GENRES[dg].bpm})</button></div>` : "";
  return `<h4>How fast?</h4><div class="pgrid" style="grid-template-columns:repeat(7,1fr)">` +
    TEMPOS.map(([b,ic,name]) => `<button data-v="${b}" class="${b===BPM?"sel":""}" style="flex-direction:column;gap:0"><span class="ic">${ic}</span>${name}<small>${b}</small></button>`).join("") +
    `</div><div class="prow"><button data-v="-5">➖</button><div class="big">${BPM}</div><button data-v="+5">➕</button></div>` + match;
}
tempoBtn.addEventListener("pointerup", () => openTempo());
function openTempo(){
  openPop(tempoBtn, tempoHtml(), v => {
    if(v === "-5" || v === "+5") setTempo(BPM + (+v));
    else if(v === "match") setTempo(GENRES[sec().drums.g].bpm);
    else setTempo(+v);
    save(); renderTempo();
    if(!pop.classList.contains("hidden")) openTempo();
  }, v => v === "-5" || v === "+5");
}

/* ---------- sections / song ---------- */
const letter = i => String.fromCharCode(65 + i);
function renderChips(){
  $("#chips").innerHTML = state.sections.map((s,i) => `
    <div class="chip2${i===state.cur?" sel":""}" data-i="${i}" style="--c:${SEC_COLORS[i%SEC_COLORS.length]}">
      <b>${letter(i)}</b><span class="bars" data-act="bars">${s.bars} bars${i===state.cur?" ▾":""}</span>
      <span class="mood" data-act="mood">${MOODS[s.mood].ic}${i===state.cur?" "+MOODS[s.mood].label+" ▾":""}</span>
      <span class="bandic">${INSTS.map(k => s[k] ? WHO[k] : "").join("")}</span>
      ${i===state.cur ? `<span class="ctl"><button data-act="left">◀</button><button data-act="right">▶</button><button data-act="copy">⧉</button>${state.sections.length>1?`<button data-act="del">✕</button>`:""}</span>` : ""}
      <div class="prog"></div>
    </div>`).join("");
  document.querySelectorAll("#mode button").forEach(b => b.classList.toggle("sel", b.dataset.m === state.mode));
  $("#addSec").style.visibility = state.sections.length >= MAX_SECTIONS ? "hidden" : "visible";
  renderRuler();
}
function renderRuler(){
  clampSongMarks();
  const tot = songBars();
  let a = 0;
  $("#rsegs").innerHTML = state.sections.map((s,i) => {
    const left = a/tot*100, w = s.bars/tot*100; a += s.bars;
    const tick = `calc(100% / ${s.bars})`;
    return `<div class="rseg${i===state.cur?" sel":""}" style="left:${left}%;width:${w}%;background:${SEC_COLORS[i%SEC_COLORS.length]} repeating-linear-gradient(90deg,transparent 0 calc(${tick} - 1px),#1b164044 calc(${tick} - 1px) ${tick})">${letter(i)}</div>`;
  }).join("");
  $("#cursor").style.left = (state.cursor/tot*100) + "%";
  const lr = $("#loopRange"), pill = $("#loopPill");
  if(state.loop){
    lr.style.display = "block"; lr.style.left = (state.loop.a/tot*100) + "%"; lr.style.width = ((state.loop.b-state.loop.a)/tot*100) + "%";
    pill.classList.add("on"); pill.textContent = `🔁 bars ${state.loop.a+1}–${state.loop.b}  ✕`;
  } else {
    lr.style.display = "none"; pill.classList.remove("on"); pill.textContent = `📍 bar ${state.cursor+1} · drag to loop`;
  }
}
function setCursor(bar, jump){
  state.cursor = bar;
  const i = secAtBar(bar);
  if(i !== state.cur){ state.cur = i; renderSection(); } else renderRuler();
  if(jump && playing){
    if(state.mode === "loop"){ state.mode = "song"; renderChips(); }
    pendingJump = bar*16;
  }
  save();
}
(function rulerInput(){
  const el = $("#ruler");
  let down = null;
  const barAt = x => { const r = el.getBoundingClientRect(); return Math.max(0, Math.min(songBars()-1, Math.floor((x - r.left)/r.width*songBars()))); };
  el.addEventListener("pointerdown", e => { down = {x:e.clientX, bar:barAt(e.clientX), drag:false}; try{ el.setPointerCapture(e.pointerId); }catch(_){} });
  el.addEventListener("pointermove", e => {
    if(!down) return;
    if(!down.drag && Math.abs(e.clientX - down.x) > 10) down.drag = true;
    if(down.drag){ const b = barAt(e.clientX); state.loop = {a:Math.min(down.bar,b), b:Math.max(down.bar,b)+1}; renderRuler(); }
  });
  const end = e => {
    if(!down) return;
    const d = down; down = null;
    if(d.drag){
      const b = barAt(e.clientX); state.loop = {a:Math.min(d.bar,b), b:Math.max(d.bar,b)+1};
      if(state.mode !== "song"){ state.mode = "song"; renderChips(); }
      setCursor(state.loop.a, true);
    } else {
      if(state.loop && (d.bar < state.loop.a || d.bar >= state.loop.b)) state.loop = null;
      setCursor(d.bar, true);
    }
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", () => { down = null; renderRuler(); });
  $("#loopPill").addEventListener("pointerup", () => { if(state.loop){ state.loop = null; save(); renderRuler(); } });
})();
function selectSection(i){
  if(i === state.cur) return;
  state.cur = i; state.cursor = secStartBar(i);
  if(playing && state.mode === "song") pendingJump = state.cursor*16;
  save(); renderSection();
  const c = document.querySelector(`.chip2[data-i="${i}"]`); if(c) c.scrollIntoView({block:"nearest", inline:"nearest"});
}
function renderSection(){ renderSlots(); renderFx(); renderChips(); renderPalette(); }
const cloneSec = s => JSON.parse(JSON.stringify(s));
function barsPicker(anchor, title, current, onPick){
  openPop(anchor, `<h4>${title}</h4><div class="pgrid" style="grid-template-columns:repeat(8,1fr)">` +
    BAR_OPTIONS.map(b => `<button data-v="${b}" class="${b===current?"sel":""}" style="flex-direction:column;gap:0"><span class="ic">${b}</span>${b === 1 ? "bar" : "bars"}</button>`).join("") + `</div>`,
    v => onPick(+v));
}
function moodPicker(anchor, i){
  openPop(anchor, `<h4>🎼 How should part ${letter(i)} feel?</h4><div class="pgrid" style="grid-template-columns:repeat(4,1fr)">` +
    Object.entries(MOODS).map(([k,m]) => `<button data-v="${k}" class="${k===state.sections[i].mood?"sel":""}"><span class="ic">${m.ic}</span>${m.label}</button>`).join("") + `</div>`,
    v => { state.sections[i].mood = v; save(); renderChips(); if(!playing && sec().keys) previewLoop("keys", sec().keys); });
}
let chipDown = null;
$("#chips").addEventListener("pointerdown", e => { chipDown = {x:e.clientX, y:e.clientY}; });
$("#chips").addEventListener("pointerup", e => {
  if(!chipDown || Math.hypot(e.clientX-chipDown.x, e.clientY-chipDown.y) > 12) return;
  const c = e.target.closest(".chip2"); if(!c) return;
  const i = +c.dataset.i, actEl = e.target.closest("[data-act]"), act = actEl && actEl.dataset.act;
  if(i !== state.cur || !act){ selectSection(i); return; }
  const S = state.sections;
  if(act === "left" && i > 0){ [S[i-1], S[i]] = [S[i], S[i-1]]; state.cur = i-1; }
  else if(act === "right" && i < S.length-1){ [S[i+1], S[i]] = [S[i], S[i+1]]; state.cur = i+1; }
  else if(act === "copy" && S.length < MAX_SECTIONS){ S.splice(i+1, 0, cloneSec(S[i])); state.cur = i+1; }
  else if(act === "del" && S.length > 1){ S.splice(i, 1); state.cur = Math.min(i, S.length-1); }
  else if(act === "bars"){ barsPicker(actEl, `How long is part ${letter(i)}?`, S[i].bars, b => { S[i].bars = b; save(); renderChips(); }); return; }
  else if(act === "mood"){ moodPicker(actEl, i); return; }
  state.cursor = secStartBar(state.cur);
  save(); renderSection();
});
$("#addSec").addEventListener("pointerup", e => {
  barsPicker(e.currentTarget, "New section — how many bars?", 4, b => {
    if(state.sections.length >= MAX_SECTIONS) return;
    const n = cloneSec(sec()); n.bars = b;
    state.sections.splice(state.cur+1, 0, n); state.cur++; state.cursor = secStartBar(state.cur);
    save(); renderSection();
  });
});
document.querySelectorAll("#mode button").forEach(b => b.addEventListener("pointerup", () => {
  if(state.mode === b.dataset.m) return;
  state.mode = b.dataset.m;
  if(playing){ if(state.mode === "song") pendingJump = secStartBar(state.cur)*16; else gpos = 0; }
  save(); renderChips();
}));

/* ---------- robot lanes & effects ---------- */
function buildSlots(){
  const nums = $("#nums");
  for(let i=0;i<STEPS;i++){ const n = document.createElement("div"); n.textContent = i+1; if(i%4===0) n.className = "down"; nums.appendChild(n); }
  for(const l of LANES){
    const lane = laneEl(l);
    for(let i=0;i<STEPS;i++){
      const s = document.createElement("div");
      s.className = "slot"; s.dataset.i = i; s.dataset.lane = l;
      lane.appendChild(s); slots[l].push(s);
      draggable(s, () => sec()[l][i] ? {id:sec()[l][i], lane:l, from:i} : null, e => {
        if(e && e.target.closest(".x")){ sec()[l][i] = null; save(); renderSlots(); return; }
        if(sec()[l][i]) preview(sec()[l][i]);
        else { state.tab = "robot"; state.sub = l; renderPalette(); }
      });
    }
  }
  const fx = $("#fxrow");
  for(let i=0;i<STEPS;i++){
    const c = document.createElement("div"); c.className = "fxcell";
    c.innerHTML = `<button class="fx rev" data-i="${i}" aria-label="Reverb">🌊</button><button class="fx dly" data-i="${i}" aria-label="Echo">⛰️</button>`;
    fx.appendChild(c);
  }
  fx.addEventListener("pointerup", e => {
    const b = e.target.closest(".fx"); if(!b) return;
    const k = b.classList.contains("rev") ? "rev" : "dly", i = +b.dataset.i;
    sec()[k][i] = !sec()[k][i]; save(); renderFx();
    if(sec()[k][i]){ initAudio(); const keep = OUT; OUT = BUS[k==="rev"?1:2]; tone("triangle",660,null,ctx.currentTime+.01,.1,.35); OUT = keep; k==="rev" ? showRing() : showEcho(); }
  });
}
function renderFx(){
  document.querySelectorAll("#fxrow .fx").forEach(b => {
    const k = b.classList.contains("rev") ? "rev" : "dly";
    b.classList.toggle("on", !!sec()[k][+b.dataset.i]);
  });
}
function renderSlots(){
  for(const l of LANES) slots[l].forEach((s,i) => {
    const id = sec()[l][i], wasActive = s.classList.contains("active");
    s.className = "slot" + (id ? " filled " + l : "") + (wasActive ? " active" : "");
    s.innerHTML = id ? `<div class="chip"><span class="ic">${BLOCKS[id].ic}</span>${BLOCKS[id].label}</div><button class="x" aria-label="Remove">✕</button>` : "";
  });
}
function renderSkins(){
  document.querySelectorAll("#skins button").forEach(b => b.classList.toggle("sel", b.dataset.skin === state.skin));
  $("#robotA").classList.toggle("on", state.skin === "A");
  $("#robotB").classList.toggle("on", state.skin === "B");
}
document.querySelectorAll("#skins button").forEach(b => b.addEventListener("pointerup", () => { state.skin = b.dataset.skin; save(); renderSkins(); }));
$("#clear").addEventListener("pointerup", () => { LANES.forEach(l => sec()[l].fill(null)); sec().rev.fill(false); sec().dly.fill(false); save(); renderSlots(); renderFx(); });

/* ---------- pointer drag (multi-touch safe) ---------- */
function slotAt(x, y){ const el = document.elementFromPoint(x, y); return el ? el.closest(".slot") : null; }
const COLORS = {head:"--head", arm:"--arm", leg:"--leg"};
function draggable(el, getPayload, onTap){
  el.addEventListener("pointerdown", e => {
    if(e.button > 0) return;
    if(e.target.closest(".x")){ const up = ev => { el.removeEventListener("pointerup", up); onTap(ev); }; el.addEventListener("pointerup", up); return; }
    const payload = getPayload(), id = e.pointerId, sx = e.clientX, sy = e.clientY;
    let dragging = false, hover = null;
    try{ el.setPointerCapture(id); }catch(_){}
    const move = ev => {
      if(ev.pointerId !== id || !payload) return;
      if(!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10){
        dragging = true;
        const def = BLOCKS[payload.id];
        ghost.innerHTML = `<div class="ic">${def.ic}</div>${def.label}`;
        ghost.style.background = getComputedStyle(document.documentElement).getPropertyValue(COLORS[def.cat]);
        ghost.style.color = def.cat === "leg" ? "#103" : "#fff";
        ghost.style.display = "flex";
      }
      if(dragging){
        ghost.style.transform = `translate3d(${ev.clientX - ghost.offsetWidth/2}px,${ev.clientY - ghost.offsetHeight/2}px,0) rotate(-4deg)`;
        let s = slotAt(ev.clientX, ev.clientY);
        if(s) s = slots[payload.lane][+s.dataset.i];
        if(s !== hover){ hover && hover.classList.remove("hover"); hover = s; hover && hover.classList.add("hover"); }
      }
    };
    const end = (ev, cancelled) => {
      if(ev.pointerId !== id) return;
      el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", upH); el.removeEventListener("pointercancel", cancelH);
      hover && hover.classList.remove("hover");
      if(dragging){
        ghost.style.display = "none";
        if(!cancelled){
          const s = slotAt(ev.clientX, ev.clientY), arr = sec()[payload.lane];
          if(s){
            const to = +s.dataset.i;
            if(payload.from >= 0){ const tmp = arr[to]; arr[to] = payload.id; arr[payload.from] = tmp; }
            else { arr[to] = payload.id; preview(payload.id); }
          } else if(payload.from >= 0) arr[payload.from] = null;
          save(); renderSlots();
        }
      } else if(!cancelled) onTap(ev);
    };
    const upH = ev => end(ev, false), cancelH = ev => end(ev, true);
    el.addEventListener("pointermove", move); el.addEventListener("pointerup", upH); el.addEventListener("pointercancel", cancelH);
  });
}

/*EXPORT*/
/* ---------- lifecycle ---------- */
$("#startBtn").addEventListener("pointerdown", () => {
  initAudio();
  $("#start").classList.add("hidden");
  SFX.bob(ctx.currentTime + 0.02); doMove("bob");
  measure();
  ensureSamples(setsForSections(state.sections));        // warm up the instruments this song uses
});
document.addEventListener("pointerdown", () => { if(ctx && ctx.state !== "running") ctx.resume(); }, true);
document.addEventListener("visibilitychange", () => { if(document.hidden){ if(playing) stop(); if(ctx) ctx.suspend(); } });
window.addEventListener("resize", () => { measure(); renderRuler(); });
document.addEventListener("contextmenu", e => e.preventDefault());

load();
fxLayer = document.createElement("div"); fxLayer.id = "fxlayer"; stageEl.prepend(fxLayer);
installShapes($("#robotA")); installShapes($("#robotB")); buildBand();
buildSlots(); renderSkins(); renderTempo(); renderSection(); measure(); renderVizBtn(); applyMute();
requestAnimationFrame(frame);
