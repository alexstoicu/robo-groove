"use strict";
/* =====================================================================
   TIMING (tempo is adjustable)
   ===================================================================== */
const STEPS = 8, SUB = 4;
const PAT = 64;                       // band loops are 4 bars (64 sixteenths)
const RPAT = STEPS * SUB;             // robot pattern is 2 bars (32 sixteenths)
const LOOKAHEAD = 0.12;
let BPM = 120, SIX = 60/BPM/SUB, STEP_DUR = SIX*SUB;

/* =====================================================================
   GENRES, MOODS, LOOP NAMES
   ===================================================================== */
const GENRES = {
  pop:{label:"Pop",ic:"🎤",bpm:116}, disco:{label:"Disco",ic:"🪩",bpm:120}, edm:{label:"EDM",ic:"🎧",bpm:128},
  lofi:{label:"Lo-fi Chill",ic:"😌",bpm:78}, adventure:{label:"Adventure",ic:"🏰",bpm:100}, rock:{label:"Rock",ic:"🎸",bpm:132},
  metal:{label:"Metal",ic:"🤘",bpm:160}, hiphop:{label:"Hip-Hop",ic:"🧢",bpm:90}, funk:{label:"Funk",ic:"🕺",bpm:104},
  reggae:{label:"Reggae",ic:"🌴",bpm:76}, latin:{label:"Latin",ic:"💃",bpm:110}, country:{label:"Country",ic:"🤠",bpm:120},
  jazz:{label:"Jazz",ic:"🎷",bpm:132}, space:{label:"Space",ic:"🚀",bpm:108},
};
const MOODS = {
  happy:    {label:"Happy",     ic:"☀️", ch:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],   scale:[0,2,4,7,9]},
  adventure:{label:"Adventure", ic:"🗺️", ch:[[9,"m"],[5,"M"],[0,"M"],[7,"M"]],   scale:[9,0,2,4,7]},
  dreamy:   {label:"Dreamy",    ic:"🌙", ch:[[5,"M7"],[4,"m7"],[2,"m7"],[0,"M7"]],scale:[0,2,4,7,9,11]},
  spooky:   {label:"Spooky",    ic:"👻", ch:[[9,"m"],[2,"m"],[4,"M"],[9,"m"]],   scale:[9,11,0,2,4,5,8]},
  brave:    {label:"Brave",     ic:"🦸", ch:[[0,"M"],[10,"M"],[5,"M"],[0,"M"]],  scale:[0,2,4,7,10]},
  calm:     {label:"Calm",      ic:"🌧️", ch:[[2,"m"],[7,"M"],[0,"M"],[9,"m"]],   scale:[0,2,4,7,9]},
  groovy:   {label:"Groovy",    ic:"🕶️", ch:[[9,"m7"],[2,"7"],[9,"m7"],[2,"7"]], scale:[9,0,2,4,7]},
  bluesy:   {label:"Bluesy",    ic:"🎺", ch:[[0,"7"],[5,"7"],[0,"7"],[7,"7"]],   scale:[0,3,4,7,9,10]},
};
const QUAL = {M:[0,4,7], m:[0,3,7], "7":[0,4,7,10], M7:[0,4,7,11], m7:[0,3,7,10]};
const VARS = {
  drums: [["Groove","🥁"],["Groove 2","🎶"],["Busy","⚡"],["Intro","🌅"],["Half-time","🐢"],["Build-up","🚀"],["Breakdown","🫧"],["Fill","💥"]],
  keys:  [["Chords","🎹"],["Stabs","💥"],["Arp","✨"],["Bells","🔔"],["Lead 1","🎶"],["Lead 2","🎵"],["Bass","🐋"],["Pad","☁️"]],
  guitar:[["Strum","🎸"],["Strum 2","🎶"],["Pick","🪕"],["Pick 2","✨"],["Riff","🔥"],["Riff 2","⚡"],["Chug","🚂"],["Solo","🌟"]],
  winds: [["Melody","🎶"],["Melody 2","🎵"],["Long Notes","🌬️"],["Toots","📯"],["Twirl","🌀"],["Echo","🗣️"],["Harmony","👯"],["Low Hoots","🦉"]],
};

/* =====================================================================
   DRUMS — every genre has its own kit and two hand-written grooves.
   Letters: k kick · s snare · r rimshot · c clap · h hat · o open hat · x crash
            y ride · t low tom · m high tom · q conga · n bongo · b cowbell
            w clave/woodblock · z shaker · a tambourine · p brush · u riser
   Marks:   X accent · x hit · g ghost · 3 roll
   ===================================================================== */
const DI = ["k","s","r","c","h","o","x","y","t","m","q","n","b","w","z","a","p","u"];
const DRUMS = {
  pop:      {kit:"pop", A:{k:"X.......x.x.....", s:"....X.......X...", h:"x.x.x.x.x.x.x.x.", c:"....x.......x..."},
                        B:{k:"X..x....x.......", s:"....X.......X..g", h:"xxxxxxxxxxxxxxxx", a:"....x.......x..."}},
  disco:    {kit:"disco", A:{k:"X...X...X...X...", c:"....X.......X...", s:"....x.......x...", h:"x...x...x...x...", o:"..x...x...x...x."},
                          B:{k:"X...X...X...X...", c:"....X.......X...", o:"..X...X...X...X.", h:"xxx.xxx.xxx.xxx.", a:".x.x.x.x.x.x.x.x"}},
  edm:      {kit:"edm", A:{k:"X...X...X...X...", c:"....X.......X...", o:"..x...x...x...x."},
                        B:{k:"X...X...X...X...", c:"....X.......X...", h:"x.xxx.xxx.xxx.xx", s:"....x.......x..x", z:".x.x.x.x.x.x.x.x"}},
  lofi:     {kit:"lofi", swing:[16,.3], A:{k:"X......x..x.....", r:"....X.......X...", h:"x.x.x.x.x.x.x.xg"},
                                     B:{k:"X.....x...X..x..", s:"....X.......X...", h:"x.xgx.xgx.xgx.xg"}},
  adventure:{kit:"cinema", A:{k:"X.......X.......", t:"X..x..x.X..x.x.x", m:"......x.......x."},
                           B:{k:"X.......X.......", s:"X.ggx.ggX.ggx.gg", t:"........X......."}},
  rock:     {kit:"rock", A:{k:"X.....x.X.......", s:"....X.......X...", h:"x.x.x.x.x.x.x.x."},
                         B:{k:"X.x...x.X.x.....", s:"....X.......X...", y:"X.x.x.x.X.x.x.x."}},
  metal:    {kit:"metal", A:{k:"xxxxxxxxxxxxxxxx", s:"....X.......X...", y:"X...x...x...x..."},
                          B:{k:"x.x.x.x.x.x.x.x.", s:".x.x.x.x.x.x.x.x", x:"X.......X......."}},
  hiphop:   {kit:"hiphop", swing:[16,.18], A:{k:"X.....x...X.....", s:"....X.......X...", h:"x.x.x.x.x.x.x.x."},
                                         B:{k:"X......x..X.....", c:"........X.......", h:"x.x.x3x.x.x.3333", o:"..............x."}},
  funk:     {kit:"funk", A:{k:"X.....x...X..x..", s:"....X..g.g..X..g", h:"XxxxXxxxXxxxXxxx"},
                         B:{k:"X..x..x...x..x..", s:"....X.g.gg..X.g.", h:"x.x.x.x.x.x.x.x.", b:"x...x...x...x..."}},
  reggae:   {kit:"reggae", swing:[16,.15], A:{k:"........X.......", r:"........X.......", h:"x.x.x.x.x.x.x.x."},
                                         B:{k:"X...X...X...X...", r:"....x.......x...", h:"..x...x...x...x.", o:"..............x."}},
  latin:    {kit:"latin", A:{k:"X..x....X..x....", w:"X..X..X...X.X...", q:"..g.X.g...g.X.gX", n:"x.x.x.x.x.x.x.x.", z:"xxxxxxxxxxxxxxxx"},
                          B:{k:"X..XX..XX..XX..X", s:"g.ggg.gXg.ggg.gX", a:"xxxxxxxxxxxxxxxx", b:"X...x.x.X...x.x."}},
  country:  {kit:"country", swing:[8,.55], A:{k:"X.......X.......", s:"....X.......X...", p:"x.X.x.X.x.X.x.X."},
                                         B:{k:"X.......X.......", s:"....X.......X...", h:"x.x.x.x.x.x.x.x.", w:"..x...x...x...x."}},
  jazz:     {kit:"jazz", swing:[8,.66], A:{y:"X...x.x.X...x.x.", h:"....x.......x...", k:"g...g...g...g...", s:"....g..g......g."},
                                      B:{p:"X.x.X.x.X.x.X.x.", h:"....x.......x...", k:"g.......g.......", r:"............x..."}},
  space:    {kit:"space", A:{k:"X.......X.......", s:"....X.......X...", h:"xxxxxxxxxxxxxxxx"},
                          B:{k:"X...X...X...X...", c:"....X.......X...", o:"..x...x...x...x.", m:"............x.x.", z:".x.x.x.x.x.x.x.x"}},
};
const KITS = {
  pop:    {k:[160,48,.32,1,.25], s:[200,1500,.18,.35], h:[8000,.04]},
  disco:  {k:[150,45,.28,1,.3],  s:[220,2000,.15,.3],  h:[9000,.03], o:.3},
  edm:    {k:[210,40,.5,1.15,.45], s:[180,1800,.2,.3], h:[9500,.025], duck:true},
  lofi:   {k:[120,45,.25,.8,.1], s:[190,1000,.12,.25], h:[6000,.03,.5], lp:2400, crackle:true},
  cinema: {k:[75,30,.9,1.3,.05], s:[240,2500,.12,.3], t:[110,52,.8,1.2], m:[170,105,.5,.9], room:.45},
  rock:   {k:[140,50,.3,1.05,.35], s:[190,1300,.25,.45], room:.25},
  metal:  {k:[190,62,.12,1,.75], s:[240,2200,.14,.35], h:[9000,.03]},
  hiphop: {k:[100,34,.95,1.15,.12], s:[200,1600,.2,.3], h:[8500,.025]},
  funk:   {k:[150,55,.22,1,.3], s:[230,2200,.12,.25], h:[9000,.03]},
  reggae: {k:[105,48,.4,1.05,.08], h:[7000,.04], room:.2},
  latin:  {k:[90,55,.35,.9,.05]},
  country:{k:[130,50,.25,.95,.15], s:[200,1200,.2,.2]},
  jazz:   {k:[85,50,.25,.6,.03], s:[220,1800,.12,.2], room:.2},
  space:  {k:[170,45,.38,1.05,.3], s:[200,1500,.32,.35], h:[9500,.03], room:.35},
};

/* =====================================================================
   KEYS (fairy) — chords, stabs, two arps, two leads, bass, pad
   rhythms are one bar (16 sixteenths); chords follow the section's mood
   ===================================================================== */
const KEYS = {
  pop:      {chT:"piano",  chA:"x...x...x...x...", chB:"x.......x.x.....", stT:"epiano", arpT:"bell",   arpA:[2,[0,1,2,3,2,1]], arpB:[1,[0,2,1,3,4,3,2,1]], arpTB:"pluck",
             ldT:"squareLead", ldA:"x.x.x...x.xx....", ldTB:"whistle", ldB:"x...x...x.x.x...", bsT:"bassSine", bs:"x.....x.x.......", bst:"root", padT:"pad"},
  disco:    {chT:"strings",chA:"x...............", chB:"..x...x...x...x.", stT:"brass", arpT:"pluck",  arpA:[1,[0,3,0,3,1,4,1,4]], arpB:[1,[0,1,2,3,4,5,4,3]], arpTB:"bell",
             ldT:"sawLead", ldA:"x.xx.x.xx.x.x...", ldTB:"strings", ldB:"x.......x...x...", bsT:"bassSaw", bs:"x.x.x.x.x.x.x.x.", bst:"oct", padT:"strings"},
  edm:      {chT:"supersaw",chA:"x..x..x...x..x..", chB:"..x...x...x...x.", stT:"supersaw", arpT:"pluck", arpA:[1,[0,1,2,3,4,5,4,3]], arpB:[1,[0,2,4,2]], arpTB:"chip",
             ldT:"sawLead", ldA:"x..x..x.x..x..x.", ldTB:"acid", ldB:"x.xx.xx.x.xx.x.x", bsT:"bassSaw", bs:"..x...x...x...x.", bst:"root", padT:"supersawPad"},
  lofi:     {chT:"rhodes", chA:"x.........x.....", chB:"x..x......x.....", stT:"rhodes", arpT:"rhodes", arpA:[2,[0,1,2,3]], arpB:[2,[3,2,1,0]], arpTB:"bell",
             ldT:"sineLead", ldA:"x...x.x....x.x..", ldTB:"vibes", ldB:"..x...x...x.....", bsT:"bassSine", bs:"x.....x..x......", bst:"root", padT:"pad", sev:true, lp:2600},
  adventure:{chT:"strings",chA:"x.......x.......", chB:"x.x.x.x.x.x.x.x.", stT:"pizz", arpT:"harp", arpA:[1,[0,1,2,3,4,5,4,3]], arpB:[2,[0,2,1,3,2,4,3,5]], arpTB:"celesta",
             ldT:"flute", ldA:"x.....x.x...x...", ldTB:"horn", ldB:"x..x..x.x.......", bsT:"bassPad", bs:"x.......x.......", bst:"root", padT:"choir"},
  rock:     {chT:"organ",  chA:"x.......x.......", chB:"x..x..x.x..x..x.", stT:"organ", arpT:"organ", arpA:[2,[0,1,2,1]], arpB:[1,[0,1,2,3,2,1]], arpTB:"synthLead",
             ldT:"synthLead", ldA:"x.x.xx.x..x.x...", ldTB:"squareLead", ldB:"x...x.x.x...x.x.", bsT:"bassPick", bs:"x.x.x.x.x.x.x.x.", bst:"root", padT:"organ"},
  metal:    {chT:"darkpad",chA:"x...............", chB:"x.x.x.x.x.x.x.x.", stT:"sawStab", arpT:"harpsi", arpA:[1,[0,1,2,3,4,3,2,1]], arpB:[1,[0,1,2,1]], arpTB:"sawLead",
             ldT:"sawLead", ldA:"xxx.xxx.x.x.xxxx", ldTB:"harpsi", ldB:"x.x.x.x.xxxxxxxx", bsT:"bassSaw", bs:"xxxxxxxxxxxxxxxx", bst:"root", padT:"choir"},
  hiphop:   {chT:"epiano", chA:"x.......x.....x.", chB:"x..x..x.........", stT:"bell", arpT:"bell", arpA:[2,[0,2,1,3]], arpB:[1,[0,1,2,1]], arpTB:"pluck",
             ldT:"bell", ldA:"x......xx.x.....", ldTB:"whistle", ldB:"x...x...x.x.....", bsT:"bass808", bs:"x......x..x.....", bst:"808", padT:"pad", sev:true},
  funk:     {chT:"clav",   chA:".x.x..x..x.x..x.", chB:"x..x.x..x..x.x..", stT:"brass", arpT:"clav", arpA:[1,[0,1,2,1,3,1,2,1]], arpB:[2,[0,2,1,3]], arpTB:"organ",
             ldT:"squareLead", ldA:"x.xx..x.x.x..x..", ldTB:"brass", ldB:"x...x.x.......x.", bsT:"bassSlap", bs:"x..x.xx...x.xx.x", bst:"oct", padT:"organ", sev:true},
  reggae:   {chT:"organShort",chA:"..x...x...x...x.", chB:"x.xxx.xxx.xxx.xx", stT:"organShort", arpT:"steelpan", arpA:[2,[0,1,2,1]], arpB:[1,[0,2,1,3,2,1]], arpTB:"marimba",
             ldT:"melodica", ldA:"x...x...x.x.x...", ldTB:"steelpan", ldB:"x.x...x.x.x.....", bsT:"bassSine", bs:"x..x....x.x.....", bst:"root", padT:"organ"},
  latin:    {chT:"piano",  chA:"x.xx.x.xx.xx.x.x", chB:"x..x..x...x.x...", stT:"brass", arpT:"marimba", arpA:[1,[0,1,2,3,2,3,1,2]], arpB:[2,[0,2,1,3]], arpTB:"marimba",
             ldT:"flute", ldA:"x..x..x...x.x...", ldTB:"brass", ldB:"x.x.x..x..x.x...", bsT:"bassSine", bs:"...x..x....x..x.", bst:"fifth", padT:"accordion"},
  country:  {chT:"honky",  chA:"x...x...x...x...", chB:"..x...x...x...x.", stT:"honky", arpT:"honky", arpA:[2,[0,1,2,3]], arpB:[1,[0,2,1,3,2,1]], arpTB:"celesta",
             ldT:"harmonica", ldA:"x.x.x.x.x...x...", ldTB:"fiddle", ldB:"x...x.x.x.x.....", bsT:"bassSine", bs:"x.......x.......", bst:"fifth", padT:"accordion"},
  jazz:     {chT:"rhodes", chA:"x.....x.........", chB:"...x.....x......", stT:"piano", arpT:"vibes", arpA:[2,[0,1,2,3]], arpB:[1,[0,2,1,3,2,1]], arpTB:"vibes",
             ldT:"vibes", ldA:"x..x..x.x.......", ldTB:"sax", ldB:"x...x..xx...x...", bsT:"bassUpright", bs:"x...x...x...x...", bst:"walk", padT:"pad", sev:true},
  space:    {chT:"synthPad",chA:"x...............", chB:"x..x..x...x..x..", stT:"supersaw", arpT:"chip", arpA:[1,[0,1,2,3,4,5,4,3]], arpB:[1,[0,2,1,3]], arpTB:"pluck",
             ldT:"chip", ldA:"x.x.x.x.x...x...", ldTB:"sawLead", ldB:"x.......x...x...", bsT:"bassSaw", bs:"x.x.x.x.x.x.x.x.", bst:"oct", padT:"synthPad"},
};

/* =====================================================================
   GUITAR (unicorn) — strum chars: D/d down · u up · P/p power · m mute · B bass note · F fifth note
   ===================================================================== */
const GTRS = {
  pop:      {tone:"clean", stA:"D...d.u.u.d.u...", stB:"D.....u.D.....u.", pkA:[2,[0,2,3,4,3,2,1,2]], pkB:[1,[0,3,2,4,3,5,4,2]], rfA:"x.x.x...x.xx....", rfB:"x...x.x.x...x.x.", ch:"m.m.m.m.m.m.m.m.", so:"x..x..x.x.x.x..."},
  disco:    {tone:"bright",short:true, wah:true, stA:"..u...u...u...u.", stB:"mumumumumumumumu", pkA:[1,[3,4,3,4,3,4,3,4]], pkB:[1,[2,3,4,5,4,3,2,3]], rfA:"x.xx.xx.x.xx.x.x", rfB:"x..xx..xx..xx..x", ch:"m.mmm.mmm.mmm.mm", so:"x.x.x.x.x...x..."},
  edm:      {tone:"bright", stA:"D..d..d...d..d..", stB:"..u...u...u...u.", pkA:[1,[0,2,4,5,4,2,0,2]], pkB:[1,[5,4,3,2,1,0,1,2]], rfA:"x..x..x.x..x..x.", rfB:"x.x.x.x.x.x.x.x.", ch:"m..m..m...m..m..", so:"x...x...x.x.x..."},
  lofi:     {tone:"jazz", stA:"D.........u.....", stB:"D...u.....D.u...", pkA:[2,[0,2,3,4,5,4,3,2]], pkB:[2,[4,3,2,1]], rfA:"x...x.x...x.....", rfB:"..x...x...x.x...", ch:"m.......m.......", so:"x.....x...x.x...", lp:2600},
  adventure:{tone:"nylon", stA:"D.......D.......", stB:"D..u..d.u..u..d.", pkA:[1,[0,1,2,3,4,5,4,3]], pkB:[2,[0,2,4,2]], rfA:"x.....x.x...x...", rfB:"x.x.x.x.x.......", ch:"m.m.m.m.m.m.m.m.", so:"x...x.....x.x..."},
  rock:     {tone:"dist", power:true, stA:"P.......P...P...", stB:"P.P.P.P.P.P.P.P.", pkA:[2,[0,1,2,1]], pkB:[1,[0,1,2,3,2,1]], rfA:"x.x.xx.x..x.x.x.", rfB:"x..x..x...x.x.x.", ch:"mmmmmmmmmmmmmmmm", so:"x..x..x.x.xxx..."},
  metal:    {tone:"heavy", power:true, stA:"P...............", stB:"P..P..P.P..P..P.", pkA:[1,[0,1,2,1,0,1,2,1]], pkB:[1,[0,2,1,2]], rfA:"xxx.xxx.xx.xxx.x", rfB:"x.x.x.x.xxxxxxxx", ch:"m.mmm.mmm.mmm.mm", so:"xxxxx.x.xxxxx.x.", lo:40, hi:58},
  hiphop:   {tone:"clean", stA:"D...........u...", stB:"D......D..u.....", pkA:[2,[0,3,2,4]], pkB:[1,[4,3,2,3]], rfA:"x......x..x.....", rfB:"x...x......x....", ch:"m.......m.....m.", so:"x.....x.x......."},
  funk:     {tone:"bright", short:true, wah:true, stA:"u.u.du.u.u.du.u.", stB:"mumu.umumumu.umu", pkA:[1,[3,4,3,4]], pkB:[1,[2,3,4,3]], rfA:"x.xx..x.x.x..x..", rfB:"x..x.xx...x.xx.x", ch:"mumumumumumumumu", so:"x.xx..x.x..x...."},
  reggae:   {tone:"clean", short:true, stA:"..u...u...u...u.", stB:"..uu..uu..uu..uu", pkA:[2,[0,2,1,3]], pkB:[1,[3,4,3,2]], rfA:"x..x..x.x.......", rfB:"x.x...x.x.x.....", ch:"..m...m...m...m.", so:"x...x...x.x....."},
  latin:    {tone:"nylon", stA:"D.du.ud.D.du.ud.", stB:"D..D..D...D.D...", pkA:[1,[0,2,1,3,2,4,3,1]], pkB:[2,[0,3,2,4]], rfA:"x..x..x...x.x...", rfB:"x.xx.x.xx.xx.x.x", ch:"m.mm.m.mm.mm.m.m", so:"x..x..x.x.x....."},
  country:  {tone:"twang", stA:"B.d.F.d.B.d.F.d.", stB:"D.du.du.D.du.du.", pkTone:"banjo", pkA:[1,[0,3,5,0,3,5,0,3]], pkB:[1,[2,4,5,4,2,4,5,4]], rfA:"x.x.x.x.x.x.x...", rfB:"x...x.x.x.x.x...", ch:"m.m.m.m.m.m.m.m.", so:"x.x.x.x.xxx....."},
  jazz:     {tone:"jazz", short:true, stA:"d...d...d...d...", stB:"...d.....d......", pkA:[2,[0,2,3,4]], pkB:[1,[4,3,2,1,2,3]], rfA:"x..x..x.x.......", rfB:"x...x..xx...x...", ch:"d...d...d...d...", so:"x..x..x.x.x.x..."},
  space:    {tone:"bright", stA:"D...............", stB:"d.d.d.d.d.d.d.d.", pkA:[1,[0,2,4,5,4,2]], pkB:[1,[5,3,1,3]], rfA:"x.......x...x...", rfB:"x.x...x.x.x.....", ch:"m.m.m.m.m.m.m.m.", so:"x.......x.x.x..."},
};

/* =====================================================================
   AUDIO GRAPH
   ===================================================================== */
let ctx = null, master = null, noiseBuf = null, BUS = null, DUCK = null, OUT = null, DIST = null, DLY = null, REV = null, ANALYSER = null;
function setupAudio(c){
  ctx = c;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.15;
  master = ctx.createGain(); master.gain.value = 0.5;
  const clip = ctx.createWaveShaper(), cc = new Float32Array(2048);
  for(let i=0;i<2048;i++){ const x = i/1023.5-1; cc[i] = Math.abs(x) < .7 ? x : Math.sign(x)*(.7 + .3*Math.tanh((Math.abs(x)-.7)/.3)); }
  clip.curve = cc; clip.oversample = "2x";
  master.connect(comp); comp.connect(clip); clip.connect(ctx.destination);
  if(typeof OfflineAudioContext === "undefined" || !(c instanceof OfflineAudioContext)){
    ANALYSER = ctx.createAnalyser(); ANALYSER.fftSize = 2048; ANALYSER.smoothingTimeConstant = .78; clip.connect(ANALYSER);
  }
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i] = Math.random()*2-1;
  // natural-sounding room: early reflections + a decaying tail that gets darker over time, different per ear
  const sr = ctx.sampleRate, len = Math.floor(sr*2.2), ir = ctx.createBuffer(2, len, sr);
  for(let ch=0; ch<2; ch++){
    const d = ir.getChannelData(ch); let lp = 0;
    for(let i=0;i<len;i++){
      const tt = i/sr, k = Math.min(.95, .08 + tt*1.6);           // damping grows with time
      lp += (1-k)*((Math.random()*2-1) - lp);
      d[i] = lp*Math.exp(-tt*3.2)*(tt < .012 ? tt/.012 : 1);
    }
    [.011,.017,.023,.031,.043,.057].forEach((s,j) => { const i = Math.floor((s + ch*.0037)*sr); d[i] += (j%2 ? -.5 : .55)*Math.exp(-j*.35); });
  }
  REV = ctx.createConvolver(); REV.buffer = ir;
  const revOut = ctx.createGain(); revOut.gain.value = 0.5; REV.connect(revOut); revOut.connect(master);
  DLY = ctx.createDelay(2); DLY.delayTime.value = SIX*3;
  const fb = ctx.createGain(); fb.gain.value = 0.42;
  const dlp = ctx.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 3200;
  DLY.connect(dlp); dlp.connect(fb); fb.connect(DLY);
  const dOut = ctx.createGain(); dOut.gain.value = 0.5; dlp.connect(dOut); dOut.connect(master);
  const room = ctx.createGain(); room.gain.value = .14; room.connect(REV);            // a touch of room on everything
  BUS = [0,1,2,3].map(f => { const g = ctx.createGain(); g.connect(master); g.connect(room); if(f&1) g.connect(REV); if(f&2) g.connect(DLY); return g; });
  DUCK = BUS.map(b => { const g = ctx.createGain(); g.connect(b); return g; });   // keys + guitar go through these (EDM pump)
  OUT = BUS[0];
  DIST = new Float32Array(1024);
  for(let i=0;i<1024;i++){ const x = i/511.5-1; DIST[i] = Math.tanh(x*3); }
}
function setTempo(b){
  BPM = Math.max(60, Math.min(180, Math.round(b)));
  SIX = 60/BPM/SUB; STEP_DUR = SIX*SUB;
  if(DLY && ctx) DLY.delayTime.setTargetAtTime(SIX*3, ctx.currentTime, .05);
}
const mtof = m => 440*Math.pow(2,(m-69)/12);
function env(g, t, a, peak, dec){
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak,0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
}
function tone(type, f0, f1, t, dur, peak, dest){
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if(f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, 0.004, peak, dur);
  o.connect(g); g.connect(dest || OUT);
  o.start(t); o.stop(t + dur + 0.05);
  return o;
}
function noise(t, dur, peak, ftype, freq, q, f1, att){
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = ftype; f.frequency.setValueAtTime(freq, t); if(q) f.Q.value = q;
  if(f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, att || 0.002, peak, dur);
  s.connect(f); f.connect(g); g.connect(OUT);
  s.start(t, Math.random()*0.5); s.stop(t + (att||0) + dur + 0.05);
}
function clapSound(t, peak){
  [0,0.011,0.022].forEach(d=>noise(t+d,0.02,peak,"bandpass",1300,1.2));
  noise(t+0.03,0.14,peak*0.85,"bandpass",1300,1.2);
}

/* ---------- drum voices ---------- */
function drum(d, t, vel, kitName){
  if(sampleDrum(d, t, vel, kitName)) return;
  const K = KITS[kitName] || KITS.pop, v = vel;
  switch(d){
    case "k": { const [f0,f1,dec,g,click] = K.k || KITS.pop.k;
      tone("sine", f0, f1, t, dec, g*v); if(click) tone("triangle", 1100, 220, t, .02, click*v);
      if(K.duck) for(const n of DUCK){ n.gain.cancelScheduledValues(t); n.gain.setValueAtTime(.25, t); n.gain.linearRampToValueAtTime(1, t + Math.min(.3, STEP_DUR*.8)); }
      break; }
    case "s": { const [tf,nf,nd,body] = K.s || KITS.pop.s;
      noise(t, nd, .5*v, "highpass", nf); tone("triangle", tf, tf*.65, t, .09, body*v); break; }
    case "r": tone("triangle", 1900, 1500, t, .03, .5*v); noise(t, .03, .3*v, "bandpass", 2600, 2); break;
    case "c": clapSound(t, .42*v); break;
    case "h": { const [f,dec,g=1] = K.h || [8000,.04]; noise(t, dec, .2*v*g, "highpass", f); break; }
    case "o": noise(t, K.o || .22, .15*v, "highpass", 7000); break;
    case "x": noise(t, 1.2, .22*v, "highpass", 5000); noise(t, .7, .08*v, "bandpass", 9000, 1); break;
    case "y": noise(t, .55, .09*v, "bandpass", 6500, 2); tone("sine", 3150, null, t, .25, .05*v); tone("sine", 4730, null, t, .15, .03*v); break;
    case "t": { const [f0,f1,dec,g] = K.t || [140,85,.3,.75]; tone("sine", f0, f1, t, dec, g*v); if(K.t) noise(t, .07, .25*v, "lowpass", 500); break; }
    case "m": { const [f0,f1,dec,g] = K.m || [220,150,.25,.65]; tone("sine", f0, f1, t, dec, g*v); break; }
    case "q": tone("sine", 260, 200, t, .22, .7*v); noise(t, .02, .2*v, "bandpass", 1800, 1); break;
    case "n": tone("sine", 460, 400, t, .12, .55*v); break;
    case "b": { const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1600; f.Q.value = 1.5; f.connect(OUT);
      tone("square", 800, null, t, .2, .22*v, f); tone("square", 540, null, t, .2, .22*v, f); break; }
    case "w": tone("sine", 2500, null, t, .04, .45*v); tone("triangle", 1250, null, t, .03, .15*v); break;
    case "z": noise(t, .05, .14*v, "highpass", 6000, 0, 0, .02); break;
    case "a": noise(t, .1, .16*v, "bandpass", 9000, 3); noise(t, .05, .1*v, "highpass", 6000); break;
    case "p": noise(t, .12, .2*v, "bandpass", 3000, .7, 0, .03); break;
    case "u": { // riser: two bars of rising filtered noise
      const dur = SIX*32, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; s.loop = true; f.type = "bandpass"; f.Q.value = 2;
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.22*v, t + dur); g.gain.setValueAtTime(0.0001, t + dur + .01);
      s.connect(f); f.connect(g); g.connect(OUT); s.start(t); s.stop(t + dur + .05); break; }
  }
}

/* ---------- melodic voices ---------- */
const TIM = {
  piano:     {w:[["triangle",1,0,1],["sine",2,0,.3]], a:.005, d:.9, gain:.2},
  honky:     {w:[["triangle",1,-14,1],["triangle",1,14,.8],["sine",2,0,.25]], a:.005, d:.7, gain:.15},
  epiano:    {w:[["sine",1,0,1],["sine",4,0,.12]], a:.005, d:1.3, gain:.24},
  rhodes:    {w:[["sine",1,0,1],["sine",4,0,.15],["triangle",1,3,.2]], a:.005, d:1.4, gain:.2, trem:4.5},
  organ:     {w:[["square",1,0,.5],["sine",2,0,.6],["sine",.5,0,.5]], f:["lowpass",2200], a:.01, d:.05, s:.9, r:.05, gain:.1},
  organShort:{w:[["square",1,0,.5],["sine",2,0,.6]], f:["lowpass",2400], a:.005, d:.14, gain:.16},
  strings:   {w:[["sawtooth",1,-7,1],["sawtooth",1,7,1],["sawtooth",2,0,.3]], f:["lowpass",2200], a:.12, d:.2, s:.8, r:.25, gain:.05, vib:5},
  pizz:      {w:[["triangle",1,0,1],["sine",2,0,.2]], a:.002, d:.18, gain:.32},
  harp:      {w:[["triangle",1,0,1],["sine",3,0,.15]], a:.002, d:1.1, gain:.2},
  celesta:   {w:[["sine",2,0,1],["sine",8,0,.15]], a:.002, d:.7, gain:.14},
  horn:      {w:[["sawtooth",1,0,1]], f:["lowpass",1200], fe:[500,1600,.08], a:.04, d:.1, s:.8, r:.1, gain:.1, vib:4},
  brass:     {w:[["sawtooth",1,-6,1],["sawtooth",1,6,1]], f:["lowpass",2500], fe:[600,3000,.05], a:.01, d:.18, gain:.11},
  choir:     {w:[["sine",1,0,1],["triangle",1,8,.5],["sine",2,-6,.25]], a:.3, d:.3, s:.8, r:.5, gain:.1, vib:5},
  pad:       {w:[["sawtooth",1,-8,1],["sawtooth",1,8,1]], f:["lowpass",1100], a:.25, d:.3, s:.7, r:.4, gain:.07},
  darkpad:   {w:[["sawtooth",1,-10,1],["sawtooth",.5,10,1]], f:["lowpass",700], a:.15, d:.3, s:.8, r:.3, gain:.08},
  synthPad:  {w:[["sawtooth",1,-12,1],["sawtooth",1,12,1],["square",.5,0,.3]], f:["lowpass",1400], a:.3, d:.4, s:.7, r:.6, gain:.06, vib:3},
  supersaw:  {w:[["sawtooth",1,-15,1],["sawtooth",1,0,1],["sawtooth",1,15,1]], f:["lowpass",3200], a:.005, d:.28, gain:.07},
  supersawPad:{w:[["sawtooth",1,-15,1],["sawtooth",1,0,1],["sawtooth",1,15,1]], f:["lowpass",2000], a:.2, d:.3, s:.75, r:.4, gain:.05},
  sawStab:   {w:[["sawtooth",1,0,1],["sawtooth",.5,0,.6]], f:["lowpass",1800], fe:[3000,600,.15], a:.003, d:.2, gain:.13},
  pluck:     {w:[["square",1,0,1]], f:["lowpass",2400], fe:[4000,800,.12], a:.003, d:.18, gain:.1},
  bell:      {w:[["sine",1,0,1],["sine",2.76,0,.35],["sine",5.4,0,.12]], a:.003, d:.9, gain:.16},
  clav:      {w:[["square",1,0,1],["sawtooth",2,0,.3]], f:["bandpass",1400,1.5], a:.003, d:.16, gain:.24},
  harpsi:    {w:[["sawtooth",1,0,1],["square",2,0,.3]], f:["highpass",400], a:.002, d:.5, gain:.08},
  whistle:   {w:[["sine",2,0,1]], a:.03, d:.1, s:.8, r:.1, gain:.16, vib:6},
  steelpan:  {w:[["sine",1,0,1],["sine",2,0,.5],["sine",3.9,0,.2]], a:.003, d:.6, gain:.2},
  melodica:  {w:[["square",1,0,1],["sawtooth",1,4,.4]], f:["lowpass",1800], a:.03, d:.1, s:.8, r:.08, gain:.08, vib:5},
  marimba:   {w:[["sine",1,0,1],["sine",4,0,.25]], a:.002, d:.35, gain:.3},
  accordion: {w:[["sawtooth",1,-10,1],["sawtooth",1,10,1],["square",2,0,.3]], f:["lowpass",2400], a:.03, d:.1, s:.85, r:.1, gain:.045, trem:6},
  harmonica: {w:[["square",1,0,.7],["sawtooth",1,0,.5]], f:["bandpass",1400,1.2], a:.04, d:.1, s:.8, r:.1, gain:.2, vib:6},
  fiddle:    {w:[["sawtooth",1,0,1]], f:["lowpass",3000], a:.06, d:.1, s:.8, r:.1, gain:.08, vib:6},
  vibes:     {w:[["sine",1,0,1],["sine",4,0,.1]], a:.002, d:1.2, gain:.22, trem:5},
  sax:       {w:[["sawtooth",1,0,1],["square",1,5,.3]], f:["lowpass",1600], fe:[800,1800,.06], a:.04, d:.1, s:.8, r:.08, gain:.08, vib:5},
  chip:      {w:[["square",1,0,1]], a:.002, d:.08, s:.6, r:.03, gain:.07},
  squareLead:{w:[["square",1,0,1]], f:["lowpass",2600], a:.01, d:.1, s:.6, r:.06, gain:.09},
  sawLead:   {w:[["sawtooth",1,-6,1],["sawtooth",1,6,1]], f:["lowpass",3000], a:.01, d:.1, s:.7, r:.06, gain:.07},
  synthLead: {w:[["sawtooth",1,0,1],["square",1,7,.5]], f:["lowpass",2200], a:.01, d:.1, s:.7, r:.06, gain:.08, vib:5},
  acid:      {w:[["sawtooth",1,0,1]], f:["lowpass",500,14], fe:[3500,400,.18], a:.003, d:.2, s:.4, r:.05, gain:.16},
  sineLead:  {w:[["sine",1,0,1],["triangle",2,0,.15]], a:.02, d:.1, s:.8, r:.1, gain:.24},
  flute:     {w:[["sine",1,0,1],["sine",2,0,.1]], a:.06, d:.1, s:.85, r:.12, gain:.24, vib:5},
  bassSine:  {w:[["sine",1,0,1],["triangle",1,0,.4]], a:.005, d:.25, s:.6, r:.06, gain:.42},
  bassSaw:   {w:[["sawtooth",1,0,1]], f:["lowpass",600,4], a:.005, d:.2, s:.5, r:.05, gain:.24},
  bass808:   {w:[["sine",1,0,1]], a:.005, d:.8, gain:.6},
  bassPad:   {w:[["triangle",1,0,1],["sine",.5,0,.5]], a:.1, d:.3, s:.8, r:.3, gain:.33},
  bassPick:  {w:[["sawtooth",1,0,1],["square",1,0,.3]], f:["lowpass",900], fe:[2500,700,.08], a:.003, d:.2, s:.5, r:.05, gain:.2},
  bassSlap:  {w:[["sawtooth",1,0,1]], f:["lowpass",800,6], fe:[3000,600,.1], a:.002, d:.15, s:.4, r:.05, gain:.22},
  bassUpright:{w:[["sine",1,0,1],["triangle",2,0,.15]], a:.01, d:.5, gain:.5},
  // ---- Mister Sly's winds ----
  piccolo:   {w:[["sine",2,0,1],["sine",4,0,.06]], a:.04, d:.08, s:.85, r:.08, gain:.17, vib:6, breath:.5},
  windFlute: {w:[["sine",1,0,1],["triangle",2,0,.08]], a:.05, d:.1, s:.85, r:.12, gain:.24, vib:5, breath:.6},
  clarinet:  {w:[["square",1,0,1],["sine",3,0,.25]], f:["lowpass",1500], a:.04, d:.1, s:.85, r:.08, gain:.09, vib:4},
  oboe:      {w:[["sawtooth",1,0,1]], f:["bandpass",1300,2], a:.04, d:.1, s:.85, r:.08, gain:.22, vib:5},
  trumpet:   {w:[["sawtooth",1,0,1],["square",1,4,.3]], f:["lowpass",2600], fe:[700,2800,.06], a:.025, d:.1, s:.8, r:.07, gain:.09, vib:5},
  trombone:  {w:[["sawtooth",.5,0,1],["sawtooth",.5,6,.5]], f:["lowpass",1000], fe:[400,1100,.08], a:.05, d:.1, s:.85, r:.1, gain:.13, vib:4},
  tuba:      {w:[["sawtooth",.25,0,1],["sine",.25,0,.8]], f:["lowpass",600], a:.05, d:.1, s:.85, r:.1, gain:.3},
  bassoon:   {w:[["sawtooth",.5,0,1]], f:["bandpass",500,1.5], a:.05, d:.1, s:.85, r:.1, gain:.35, vib:4},
  panflute:  {w:[["sine",1,0,1],["sine",3,0,.05]], a:.03, d:.15, s:.6, r:.15, gain:.24, breath:1},
  recorder:  {w:[["triangle",1,0,1],["sine",2,0,.15]], a:.03, d:.1, s:.85, r:.06, gain:.22, breath:.4},
  ocarina:   {w:[["sine",1,0,1]], a:.04, d:.1, s:.85, r:.1, gain:.26, vib:5.5, breath:.3},
  theremin:  {w:[["sine",1,0,1],["sine",2,0,.15]], a:.12, d:.1, s:.9, r:.25, gain:.22, vib:6.5},
  synthFlute:{w:[["sine",1,0,1],["square",1,0,.12]], f:["lowpass",2400], a:.03, d:.1, s:.8, r:.1, gain:.2, vib:5, breath:.3},
  windSax:   {w:[["sawtooth",1,0,1],["square",1,5,.3]], f:["lowpass",1700], fe:[700,1900,.07], a:.04, d:.1, s:.8, r:.08, gain:.09, vib:5, breath:.2},
};
function voice(p, midi, t, dur){
  if(p.smp && sampleNote(p.smp, midi, t, dur, p === TIM.honky ? {chorus:1} : null)) return;
  const f = mtof(midi), g = ctx.createGain();
  let tail = g;
  if(p.trem){
    const tg = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    tg.gain.value = .75; l.frequency.value = p.trem; lg.gain.value = .25; l.connect(lg); lg.connect(tg.gain);
    l.start(t); l.stop(t + dur + 2); g.connect(tg); tail = tg;
  }
  if(p.f){
    const fl = ctx.createBiquadFilter(); fl.type = p.f[0]; fl.frequency.setValueAtTime(p.f[1], t); if(p.f[2]) fl.Q.value = p.f[2];
    if(p.fe){ fl.frequency.setValueAtTime(p.fe[0], t); fl.frequency.exponentialRampToValueAtTime(p.fe[1], t + p.fe[2]); }
    tail.connect(fl); fl.connect(OUT);
  } else tail.connect(OUT);
  const a = p.a || .005, peak = p.gain || .2, s = p.s || 0;
  let end;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  if(s > 0){
    const hold = Math.max(t + a + 0.01, t + dur), dEnd = Math.min(t + a + (p.d||.1), hold);
    g.gain.exponentialRampToValueAtTime(peak*s, dEnd);
    g.gain.setValueAtTime(peak*s, hold);
    end = hold + (p.r || .08);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
  } else {
    end = t + a + Math.min(p.d || .3, Math.max(dur*1.5, .15));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
  }
  if(p.breath) noise(t, Math.min(.12, dur*.6), peak*p.breath*.6, "bandpass", Math.min(9000, f*2.5), 1.2);
  for(const [type, ratio, det, lvl] of p.w){
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = type; o.frequency.value = f*ratio; if(det) o.detune.value = det;
    og.gain.value = lvl; o.connect(og); og.connect(g);
    if(p.vib){ const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = p.vib; lg.gain.value = f*ratio*0.006; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(end+.05); }
    o.start(t); o.stop(end + .05);
  }
}

/* ---------- guitar: Karplus-Strong plucked strings ---------- */
const TONES = {clean:{b:.55,dec:.996,g:.12}, bright:{b:.8,dec:.995,g:.1}, nylon:{b:.32,dec:.994,g:.16}, twang:{b:.9,dec:.996,g:.1},
               jazz:{b:.22,dec:.995,g:.2}, banjo:{b:.97,dec:.985,g:.12},
               dist:{b:.6,dec:.997,g:.1,dist:5}, heavy:{b:.5,dec:.998,g:.1,dist:12}};
const ksCache = new Map();
function ksBuf(midi, tn){
  const key = midi+":"+tn; let b = ksCache.get(key); if(b) return b;
  const T = TONES[tn], sr = ctx.sampleRate, N = Math.max(2, Math.round(sr/mtof(midi))), len = Math.floor(sr*1.5);
  b = ctx.createBuffer(1, len, sr);
  const d = b.getChannelData(0), ring = new Float32Array(N);
  let y = 0, mx = 1e-6;
  for(let i=0;i<N;i++){ y += T.b*((Math.random()*2-1) - y); ring[i] = y; mx = Math.max(mx, Math.abs(y)); }
  for(let i=0;i<N;i++) ring[i] /= mx;
  let idx = 0;
  for(let i=0;i<len;i++){ const nx = idx+1 === N ? 0 : idx+1, v = ring[idx]; d[i] = v; ring[idx] = T.dec*0.5*(v + ring[nx]); idx = nx; }
  ksCache.set(key, b); return b;
}
function playGuitar(e, t, tn, wah){
  if(sampleGuitar(e, t, tn, wah)) return;
  const T = TONES[tn], g = ctx.createGain();
  let head = g;
  if(T.dist){
    const pre = ctx.createGain(), sh = ctx.createWaveShaper(), lp = ctx.createBiquadFilter(), post = ctx.createGain();
    pre.gain.value = T.dist; sh.curve = DIST; lp.type = "lowpass"; lp.frequency.value = 3200; post.gain.value = .3;
    g.connect(pre); pre.connect(sh); sh.connect(lp); lp.connect(post); head = post;
  }
  if(wah && !e.mute && e.dir !== "n"){
    const w = ctx.createBiquadFilter(), mk = ctx.createGain(); w.type = "bandpass"; w.Q.value = 1.8; mk.gain.value = 2.2;
    w.frequency.setValueAtTime(500, t); w.frequency.exponentialRampToValueAtTime(2400, t + .12);
    head.connect(w); w.connect(mk); head = mk;
  }
  head.connect(OUT);
  const dur = e.mute ? .07 : e.dur*SIX, end = t + dur + (e.mute ? .03 : .15), lvl = e.mute ? .7 : 1;
  g.gain.setValueAtTime(lvl*(e.vel||1), t); g.gain.setValueAtTime(lvl*(e.vel||1), t + dur); g.gain.exponentialRampToValueAtTime(0.0001, end);
  e.notes.forEach((m,i) => {
    const s = ctx.createBufferSource(), sg = ctx.createGain();
    s.buffer = ksBuf(m, tn); sg.gain.value = T.g;
    if(e.bend){ s.playbackRate.setValueAtTime(Math.pow(2,-2/12), t); s.playbackRate.linearRampToValueAtTime(1, t + .09); }
    s.connect(sg); sg.connect(g);
    s.start(t + i*(e.dir==="u" ? .01 : .013)); s.stop(end + .02);
  });
}

/* =====================================================================
   LOOP COMPILER
   ===================================================================== */
const VEL = {X:1, x:.75, g:.3, "3":.7};
function drumPattern(g, v){
  const D = DRUMS[g], A = {}, B = {}, r = {};
  DI.forEach(i => { A[i] = (D.A[i]||"").padEnd(16,"."); B[i] = (D.B[i]||"").padEnd(16,"."); });
  const set = (s, i, ch="x") => s.slice(0,i) + ch + s.slice(i+1);
  const has = (o, i) => /[^.]/.test(o[i]);
  const blank = () => { const o = {}; DI.forEach(i => o[i] = ".".repeat(16)); return o; };
  const rep = (o, n=4) => { const q = {}; DI.forEach(i => q[i] = o[i].repeat(n)); return q; };
  const back = has(A,"s") ? "s" : has(A,"c") ? "c" : has(A,"r") ? "r" : has(B,"s") ? "s" : "c";
  const hatKey = has(A,"h") ? "h" : has(A,"y") ? "y" : has(A,"p") ? "p" : has(A,"z") ? "z" : "h";
  const eighths = s => s.split("").map((c,i) => i%2 ? "." : c).join("");
  const PERC = ["h","y","p","z","w","q","n","b","a","o"];
  switch(v){
    case 0: return rep(A);
    case 1: return rep(B);
    case 2: { // Busy
      const b = {...A};
      b[hatKey] = g === "jazz" ? "X.xxX.xxX.xxX.xx" : "XxxxXxxxXxxxXxxx";
      b.k = set(b.k, 14);
      b[back] = set(set(b[back], 7, "g"), 9, "g");
      const q = rep(b); q[back] = q[back].slice(0,60) + "XxXX"; return q;
    }
    case 3: { // Intro: light pulse
      const b = blank(); b.k = "X.......X.......";
      PERC.forEach(i => { if(has(A,i)) b[i] = eighths(A[i]); });
      if(!PERC.some(i => has(A,i))) b.h = "x.x.x.x.x.x.x.x.";
      const q = rep(b); q[back] = ".".repeat(60) + "x.x."; return q;
    }
    case 4: { // Half-time
      const b = blank(); b.k = "X.........x.....";
      b[back] = "........X.......";
      PERC.forEach(i => { if(has(A,i)) b[i] = eighths(A[i]); });
      return rep(b);
    }
    case 5: { // Build-up
      const q = {}; DI.forEach(i => q[i] = ".".repeat(64));
      q.k = "x...x...x...x...".repeat(3) + "x.x.x.x.x.x.x.x.";
      q[back] = ".".repeat(16) + "x.x.x.x.x.x.x.x." + "xxxxxxxxxxxxxxxx" + "XXXXXXXXXXXXXXXX";
      q[hatKey] = eighths("x".repeat(16)).repeat(2) + ".".repeat(32);
      q.u = ".".repeat(32) + "x" + ".".repeat(31);
      q.x = "X" + ".".repeat(63);
      return q;
    }
    case 6: { // Breakdown: no kick or snare
      const b = blank();
      PERC.forEach(i => { b[i] = has(A,i) ? A[i] : B[i]; });
      ["t","m"].forEach(i => b[i] = A[i]);
      if(g === "metal") b.y = "X...x...x...x...";
      if(!PERC.some(i => has(b,i))) b.h = "x.x.x.x.x.x.x.x.";
      b.c = "....g.......x...";
      b.m = has(b,"m") ? b.m : "..............xx";
      return rep(b);
    }
    case 7: { // Fill at the end of bar 4
      const q = rep(A);
      DI.forEach(i => { if(i !== "k") q[i] = q[i].slice(0,56) + "........"; });
      q.x = set(q.x, 0, "X");
      q.s = q.s.slice(0,56) + "X.x.x...";
      q.m = q.m.slice(0,56) + "...x.x..";
      q.t = q.t.slice(0,56) + ".....xXx";
      return q;
    }
  }
}
function rng(seedStr){
  let h = 2166136261; for(const ch of seedStr){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t>>>15, t|1); t ^= t + Math.imul(t ^ t>>>7, t|61); return ((t ^ t>>>14)>>>0)/4294967296; };
}
const chordPcs = (mood, c) => { const [root, q] = MOODS[mood].ch[c]; return QUAL[q].map(i => (root+i) % 12); };
function chordNotes(mood, c, sev){
  const [root, q] = MOODS[mood].ch[c];
  let iv = QUAL[q]; if(sev && iv.length === 3) iv = q === "m" ? QUAL.m7 : QUAL.M7;
  let r = 48 + root; if(r < 53) r += 12;
  return iv.map(i => r + i);
}
const bassRoot = (mood, c) => { let r = 36 + MOODS[mood].ch[c][0]; if(r > 44) r -= 12; return r; };
function gtrShape(mood, c){
  const [root, q] = MOODS[mood].ch[c], iv = QUAL[q], r = 40 + ((root - 4 + 12) % 12);
  const n = [r, r+7, r+12, r+12+iv[1], r+19];
  n.push(iv.includes(10) ? r+22 : iv.includes(11) ? r+23 : r+24);
  return n;
}
const gtrPower = (mood, c) => { const r = 40 + ((MOODS[mood].ch[c][0] - 4 + 12) % 12); return [r, r+7, r+12]; };
function melody(seed, rhythm, lo, hi, mood){
  const M = MOODS[mood], rnd = rng(seed + ":" + mood), scale = [], out = Array(PAT).fill(null);
  for(let m=lo; m<=hi; m++) if(M.scale.includes(m % 12)) scale.push(m);
  let idx = scale.length >> 1;
  for(let i=0;i<PAT;i++){
    if(rhythm[i%16] !== "x") continue;
    if(i % 4 === 0 || rnd() < .25){
      const pcs = chordPcs(mood, i >> 4); let best = idx, bd = 99;
      scale.forEach((m,j) => { if(pcs.includes(m%12) && Math.abs(j-idx) < bd){ bd = Math.abs(j-idx); best = j; } });
      idx = best;
    } else idx = Math.min(scale.length-1, Math.max(0, idx + [-2,-1,-1,1,1,2][Math.floor(rnd()*6)]));
    out[i] = scale[idx];
  }
  return out;
}
const gapN = (pat, j, len=16) => { let n = 1; while(j+n < len && pat[j+n] === ".") n++; return n; };
const melEvents = (mel, push) => { for(let i=0;i<PAT;i++) if(mel[i]){ let n = 1; while(i+n<PAT && n<6 && !mel[i+n]) n++; push(i, mel[i], n); } };
function compileKeys(ref, mood, ev){
  const S = KEYS[ref.g], v = ref.v;
  if(v === 0 || v === 1){
    const pat = v === 0 ? S.chA : S.chB, tim = v === 0 ? S.chT : S.stT;
    for(let c=0;c<4;c++) for(let j=0;j<16;j++) if(pat[j]==="x") ev[c*16+j].push({tim, notes:chordNotes(mood,c,S.sev), dur:gapN(pat,j), hand:"B"});
  } else if(v === 2 || v === 3){
    const [rate, seq] = v === 2 ? S.arpA : S.arpB, tim = v === 2 ? S.arpT : S.arpTB, up = v === 3 ? 12 : 0;
    for(let c=0;c<4;c++){
      const base = chordNotes(mood, c, S.sev), tones = [...base, ...base.map(m=>m+12)].map(m=>m+up);
      for(let j=0,n=0;j<16;j+=rate,n++) ev[c*16+j].push({tim, notes:[tones[Math.min(seq[n % seq.length], tones.length-1)]], dur:rate, hand:"R"});
    }
  } else if(v === 4 || v === 5){
    const mel = v === 4 ? melody(ref.g+"A", S.ldA, 64, 84, mood) : melody(ref.g+"B", S.ldB, 60, 79, mood);
    const tim = v === 4 ? S.ldT : S.ldTB;
    melEvents(mel, (i, m, n) => ev[i].push({tim, notes:[m], dur:n, hand:"R"}));
  } else if(v === 6){
    for(let c=0;c<4;c++){
      const r = bassRoot(mood, c), iv = QUAL[MOODS[mood].ch[c][1]], next = bassRoot(mood, (c+1)%4);
      for(let j=0,n=0;j<16;j++) if(S.bs[j]==="x"){
        let m = r;
        if(S.bst === "oct" && n%2) m += 12;
        if(S.bst === "fifth" && n%2) m += 7;
        if(S.bst === "walk") m = [r, r+iv[1], r+7, next + (next > r ? -1 : 1)][n % 4];
        ev[c*16+j].push({tim:S.bsT, notes:[m], dur:S.bst === "808" ? Math.max(4, gapN(S.bs,j)) : gapN(S.bs,j), hand:"L"}); n++;
      }
    }
  } else {
    for(let c=0;c<4;c++) ev[c*16].push({tim:S.padT, notes:chordNotes(mood,c,true), dur:16, hand:"B"});
  }
}
function compileGtr(ref, mood, ev){
  const S = GTRS[ref.g], v = ref.v;
  const hit = (c, ch, dur) => {
    const shp = gtrShape(mood, c), pw = gtrPower(mood, c);
    switch(ch){
      case "D": return {notes:shp, dir:"d", dur, vel:1};
      case "d": return {notes:shp, dir:"d", dur, vel:.75};
      case "u": return {notes:shp.slice(-4).reverse(), dir:"u", dur, vel:.7};
      case "P": return {notes:pw, dir:"d", dur, vel:1};
      case "p": return {notes:pw, dir:"d", dur, vel:.8};
      case "m": return {notes:S.power ? pw : shp, dir:"d", dur:1, mute:true};
      case "B": return {notes:[shp[0]], dir:"n", dur, vel:1};
      case "F": return {notes:[shp[1]], dir:"n", dur, vel:1};
    }
  };
  if(v === 0 || v === 1 || v === 6){
    const pat = v === 0 ? S.stA : v === 1 ? S.stB : S.ch;
    for(let c=0;c<4;c++) for(let j=0;j<16;j++){
      const ch = pat[j]; if(ch === ".") continue;
      if(v === 6 && ch === "u"){ ev[c*16+j].push({notes:gtrShape(mood,c).slice(-4).reverse(), dir:"u", dur:1, mute:true}); continue; }
      const long = "PpBF".includes(ch);
      const e = hit(c, ch, (S.short && !long) ? 1 : gapN(pat,j));
      if(v === 6 && S.short && ch === "d") e.dur = 1;
      ev[c*16+j].push(e);
    }
  } else if(v === 2 || v === 3){
    const [rate, seq] = v === 2 ? S.pkA : S.pkB;
    for(let c=0;c<4;c++){
      const tones = gtrShape(mood, c).map(m => v === 3 ? m+12 : m);
      for(let j=0,n=0;j<16;j+=rate,n++) ev[c*16+j].push({notes:[tones[Math.min(seq[n % seq.length], tones.length-1)]], dir:"n", dur:rate*2, pick:true});
    }
  } else if(v === 4 || v === 5){
    const lo = S.lo || (S.power ? 40 : 50), hi = S.hi || (S.power ? 60 : 70);
    const mel = melody(ref.g + (v === 4 ? "R1" : "R2"), v === 4 ? S.rfA : S.rfB, lo, hi, mood);
    melEvents(mel, (i, m, n) => ev[i].push({notes:[m], dir:"n", dur:n}));
  } else {
    const mel = melody(ref.g+"solo", S.so, 64, 86, mood), rnd = rng(ref.g+"bend");
    melEvents(mel, (i, m, n) => ev[i].push({notes:[m], dir:"n", dur:n, bend: i%8===0 && rnd() < .6}));
  }
}
/* =====================================================================
   WINDS (Mister Sly the fox) — flute, sax, horns, pan flute, harmonica…
   ===================================================================== */
const WINDS = {
  pop:      {tA:"windFlute", tB:"clarinet", low:"tuba",     mA:"x.x.x...x.x.x...", mB:"x...x.x.x...x...", tt:"x...x...x...x..."},
  disco:    {tA:"piccolo",   tB:"trumpet",  low:"tuba",     mA:"x.xx.x.xx.x.x.x.", mB:"x.......x.x.x...", tt:"..x...x...x...x."},
  edm:      {tA:"synthFlute",tB:"panflute", low:"trombone", mA:"x..x..x.x..x..x.", mB:"x.x.x.x.x...x...", tt:"x..x..x...x..x.."},
  lofi:     {tA:"windSax",   tB:"windFlute",low:"bassoon",  mA:"x...x.x....x.x..", mB:"..x...x...x.....", tt:"x.........x....."},
  adventure:{tA:"windFlute", tB:"oboe",     low:"bassoon",  mA:"x.....x.x...x...", mB:"x..x..x.x.......", tt:"x.x.x...x.x.x..."},
  rock:     {tA:"windSax",   tB:"trumpet",  low:"trombone", mA:"x.x.xx.x..x.x...", mB:"x...x.x.x...x.x.", tt:"x..x..x.x..x..x."},
  metal:    {tA:"oboe",      tB:"trombone", low:"trombone", mA:"xxx.xxx.x.x.xxxx", mB:"x.x.x.x.xxxxxxxx", tt:"x.x.x.x.x.x.x.x."},
  hiphop:   {tA:"windFlute", tB:"windSax",  low:"tuba",     mA:"x......xx.x.....", mB:"x...x...x.x.....", tt:"x.......x.....x."},
  funk:     {tA:"windSax",   tB:"trumpet",  low:"trombone", mA:"x.xx..x.x.x..x..", mB:"x...x.x.......x.", tt:".x.x..x..x.x..x."},
  reggae:   {tA:"melodica",  tB:"trombone", low:"tuba",     mA:"x...x...x.x.x...", mB:"x.x...x.x.x.....", tt:"..x...x...x...x."},
  latin:    {tA:"windFlute", tB:"trumpet",  low:"tuba",     mA:"x..x..x...x.x...", mB:"x.x.x..x..x.x...", tt:"x..x..x...x.x..."},
  country:  {tA:"harmonica", tB:"recorder", low:"tuba",     mA:"x.x.x.x.x...x...", mB:"x...x.x.x.x.....", tt:"x...x...x...x..."},
  jazz:     {tA:"windSax",   tB:"clarinet", low:"bassoon",  mA:"x..x..x.x.......", mB:"x...x..xx...x...", tt:"x.....x.....x..."},
  space:    {tA:"theremin",  tB:"ocarina",  low:"trombone", mA:"x.......x...x...", mB:"x.x.x.x.x...x...", tt:"x...x.x...x...x."},
};
function compileWinds(ref, mood, ev){
  const S = WINDS[ref.g], v = ref.v, M = MOODS[mood];
  const push = (i, m, n, tim, vel) => ev[i].push({tim, notes:[m], dur:n, vel});
  const scaleIn = (lo, hi) => { const s = []; for(let m=lo; m<=hi; m++) if(M.scale.includes(m%12)) s.push(m); return s; };
  if(v === 0 || v === 1){
    melEvents(melody(ref.g+(v ? "W2" : "W1"), v ? S.mB : S.mA, v ? 62 : 67, v ? 81 : 88, mood), (i,m,n) => push(i, m, n, v ? S.tB : S.tA));
  } else if(v === 2){
    for(let c=0;c<4;c++){ const ch = chordNotes(mood, c, false); push(c*16, ch[2]+12, 8, S.tA); push(c*16+8, ch[1]+12, 8, S.tA); }
  } else if(v === 3){
    for(let c=0;c<4;c++){ const ch = chordNotes(mood, c, false).map(m => m+12);
      for(let j=0,n=0;j<16;j++) if(S.tt[j]==="x"){ push(c*16+j, ch[n++ % ch.length], 1, S.tB); } }
  } else if(v === 4){
    const sc = scaleIn(64, 92);
    for(let c=0;c<4;c++){
      const root = chordNotes(mood, c, false)[0] + 12; let k = sc.findIndex(m => m >= root); if(k < 0) k = 0;
      [0,1,2,3].forEach(j => push(c*16+j, sc[Math.min(k+j, sc.length-1)], 1, S.tA));
      [8,9,10,11].forEach((j,n) => push(c*16+j, sc[Math.min(k+2-n+2, sc.length-1)], 1, S.tA));
      push(c*16+12, sc[Math.min(k+4, sc.length-1)], 4, S.tA);
    }
  } else if(v === 5){
    const mel = melody(ref.g+"echo", "x.x.x.x.x.x.x.x.", 65, 86, mood);
    melEvents(mel.map((m,i) => { const bar = i>>4, j = i%16; return (bar%2===0 && j<8) || (bar%2===1 && j>=8 && j<14) ? m : null; }),
              (i,m,n) => push(i, m, Math.min(n,3), (i>>4)%2 ? S.tB : S.tA));
  } else if(v === 6){
    const sc = scaleIn(55, 90), mel = melody(ref.g+"W1", S.mA, 67, 88, mood);
    melEvents(mel, (i,m,n) => { push(i, m, n, S.tA); const k = sc.indexOf(m); if(k >= 2) push(i, sc[k-2], n, S.tB, .8); });
  } else {
    for(let c=0;c<4;c++){ const r = bassRoot(mood, c) + 12;
      [[0,r,6],[8,r+7,4],[12,r,4]].forEach(([j,m,n]) => push(c*16+j, m, n, S.low)); }
  }
}
const compiled = new Map();
function compile(inst, ref, mood){
  const key = inst+":"+ref.g+":"+ref.v+(inst === "drums" || inst === "bongos" ? "" : ":"+mood);
  let ev = compiled.get(key); if(ev) return ev;
  ev = Array.from({length:PAT}, () => []);
  if(inst === "drums"){
    const p = drumPattern(ref.g, ref.v);
    for(let i=0;i<PAT;i++) for(const d of DI){ const ch = p[d][i]; if(ch && ch !== ".") ev[i].push({d, vel:VEL[ch] || .75, roll:ch === "3"}); }
  } else if(inst === "keys") compileKeys(ref, mood, ev);
  else if(inst === "winds") compileWinds(ref, mood, ev);
  else if(inst === "bongos") compileBongos(ref, ev);
  else compileGtr(ref, mood, ev);
  compiled.set(key, ev); return ev;
}

/* =====================================================================
   PLAYBACK OF ONE INSTRUMENT AT ONE SIXTEENTH
   ===================================================================== */
const TRIM = {};      /*TRIM*/
const PAN = {drums:-.12, keys:-.42, bongos:-.25, guitar:.32, winds:.52};      // matches where each player stands
let visQ = [];
function playInst(inst, ref, p, t, mood){
  const list = compile(inst, ref, mood)[p];
  if(!list.length) return;
  const bus = OUT, busIdx = BUS.indexOf(bus);
  const trim = ctx.createGain(); trim.gain.value = TRIM[ref.g+"/"+inst+"/"+ref.v] || 1;
  let dest = inst === "drums" || busIdx < 0 ? bus : DUCK[busIdx];
  const kit = KITS[DRUMS[ref.g].kit], lp = inst === "drums" ? kit.lp : (KEYS[ref.g].lp && inst === "keys") || (GTRS[ref.g].lp && inst === "guitar") || (ref.g === "lofi" && inst === "winds") ? 2600 : 0;
  if(lp){ const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; f.connect(dest); dest = f; }
  if(ctx.createStereoPanner){ const pn = ctx.createStereoPanner(); pn.pan.value = PAN[inst] || 0; pn.connect(dest); dest = pn; }
  trim.connect(dest);
  if(inst !== "drums") t += (Math.random() - .5)*.01;                 // tiny human timing wobble
  if(inst === "drums" && kit.room && REV){ const send = ctx.createGain(); send.gain.value = kit.room; trim.connect(send); send.connect(REV); }
  OUT = trim;
  for(const e of list){
    if(inst === "drums"){
      drum(e.d, t, e.vel, DRUMS[ref.g].kit);
      if(e.roll) drum(e.d, t + SIX/2, e.vel*.8, DRUMS[ref.g].kit);
      visQ.push({t, drum:e.d});
    } else if(inst === "keys"){
      const TM = TIM[e.tim]; e.notes.forEach((m,i) => voice(TM, m, t + i*.004, e.dur*SIX*.95));
      visQ.push({t, keys:e.hand, midi:e.notes[0]});
    } else if(inst === "bongos"){
      playBongo(e, t);
      visQ.push({t, bongo:e.b});
    } else if(inst === "winds"){
      const TM = TIM[e.tim], bk = OUT;
      if(e.vel){ const g2 = ctx.createGain(); g2.gain.value = e.vel; g2.connect(OUT); OUT = g2; }
      voice(TM, e.notes[0], t, e.dur*SIX*.92);
      OUT = bk;
      visQ.push({t, wind:e.notes[0]});
    } else {
      const S = GTRS[ref.g];
      playGuitar(e, t, e.pick && S.pkTone ? S.pkTone : S.tone, S.wah);
      visQ.push({t, gtr:e.dir});
    }
  }
  if(inst === "drums" && kit.crackle && Math.random() < .35) noise(t + Math.random()*SIX, .004, .12, "highpass", 2500);
  OUT = bus;
}
function swingOf(s){
  const g = (s.drums && s.drums.g) || (s.keys && s.keys.g) || (s.guitar && s.guitar.g) || (s.winds && s.winds.g) || (s.bongos && s.bongos.g);
  return g && DRUMS[g].swing;
}
function swingOffset(sw, p){
  if(!sw) return 0;
  const [type, amt] = sw;
  if(type === 16) return p % 2 === 1 ? amt*SIX : 0;
  return p % 4 === 2 ? amt*SIX : 0;
}
