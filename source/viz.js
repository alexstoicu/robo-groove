/* =====================================================================
   VISUALIZER — 20 music-reactive backgrounds behind the band
   Reads the live mix through an AnalyserNode; kicks from the drum track
   give each style a crisp beat. Random mode changes style every ~24 s.
   ===================================================================== */
const VIZ_STYLES = [
  ["Bars","📊"],["Mirror","🪞"],["Scope","〰️"],["Ring","⭕"],["Tunnel","🌀"],["Warp","✨"],["Plasma","🫧"],["Flower","🌸"],
  ["Mountains","⛰️"],["Lava","🌋"],["Kaleido","🔷"],["Lasers","🔦"],["Fireworks","🎆"],["LEDs","🟩"],["Galaxy","🌌"],
  ["Dream","💫"],["Bubbles","🫧"],["Sunburst","☀️"],["Ribbons","🎀"],["Disco","🪩"],
];
const viz = (() => {
  const cv = document.getElementById("viz"), c = cv.getContext("2d", {alpha:false});
  const buf = document.createElement("canvas"), bc = buf.getContext("2d");          // for feedback trails
  const small = document.createElement("canvas"), sc = small.getContext("2d");      // low-res plasma
  small.width = 96; small.height = 54; const img = sc.createImageData(96, 54);
  let W = 0, H = 0, DPR = 1, mode = "random", cur = 0, nextSwitch = 0, fade = 0, beat = 0, lastT = 0, hue = 260;
  let mtick = 0, freq = new Uint8Array(1024), wave = new Uint8Array(2048);
  const peaks = new Float32Array(64), hist = [], parts = [], stars = [], bubbles = [];
  try{ const s = localStorage.getItem("roboGroove.viz"); if(s) mode = s === "random" || s === "off" ? s : +s; }catch(e){}
  if(typeof mode === "number") cur = mode;
  function resize(){
    const r = cv.getBoundingClientRect(); DPR = Math.min(1.5, window.devicePixelRatio || 1);
    W = cv.width = Math.max(2, Math.round(r.width*DPR)); H = cv.height = Math.max(2, Math.round(r.height*DPR));
    buf.width = W; buf.height = H; c.fillStyle = "#140E28"; c.fillRect(0, 0, W, H);
  }
  window.addEventListener("resize", resize);
  // ---------- analysis helpers ----------
  let level = 0, bass = 0, mids = 0, highs = 0;
  function analyse(t){
    if(ANALYSER && ctx && ctx.state === "running"){ ANALYSER.getByteFrequencyData(freq); ANALYSER.getByteTimeDomainData(wave); }
    else { freq.fill(0); wave.fill(128); }
    const avg = (a, b) => { let s = 0; for(let i=a;i<b;i++) s += freq[i]; return s/((b-a)*255); };
    const idle = .08 + .05*Math.sin(t*.0013);                       // gentle motion when nothing is playing
    bass = Math.max(avg(1, 8), idle); mids = Math.max(avg(8, 90), idle*.8); highs = Math.max(avg(90, 400), idle*.5);
    level = (bass + mids + highs)/3;
    beat *= .9;
  }
  function bands(n){
    const out = new Array(n), max = 520;
    for(let i=0;i<n;i++){
      const a = Math.floor(Math.pow(max, i/n)), b = Math.max(a+1, Math.floor(Math.pow(max, (i+1)/n)));
      let s = 0; for(let j=a;j<b;j++) s += freq[j]; out[i] = s/((b-a)*255);
    }
    return out;
  }
  const col = (h, s, l, a=1) => `hsla(${h%360},${s}%,${l}%,${a})`;
  const fadeBg = a => { c.globalCompositeOperation = "source-over"; c.fillStyle = `rgba(20,14,40,${a})`; c.fillRect(0, 0, W, H); };
  const glowDot = (x, y, r, color) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(x-r, y-r, r*2, r*2); };
  // ---------- the 20 styles ----------
  const S = [
    t => { fadeBg(.55); const b = bands(48), w = W/48;               // Bars (with falling peak caps)
      for(let i=0;i<48;i++){ const h = b[i]*H*.85, x = i*w;
        const g = c.createLinearGradient(0, H, 0, H-h); g.addColorStop(0, col(hue+i*4,90,45)); g.addColorStop(1, col(hue+i*4+60,95,70));
        c.fillStyle = g; c.fillRect(x+w*.12, H-h, w*.76, h);
        peaks[i] = Math.max(peaks[i]-H*.006, h); c.fillStyle = "#fff"; c.fillRect(x+w*.12, H-peaks[i]-6*DPR, w*.76, 4*DPR); } },
    t => { fadeBg(.45); const b = bands(40), w = W/40, cy = H*.55;  // Mirror
      c.globalCompositeOperation = "lighter";
      for(let i=0;i<40;i++){ const h = b[i]*H*.45; c.fillStyle = col(hue+i*7,95,55,.85);
        c.fillRect(i*w+w*.1, cy-h, w*.8, h); c.fillStyle = col(hue+i*7,95,55,.35); c.fillRect(i*w+w*.1, cy, w*.8, h*.8); } },
    t => { fadeBg(.3); c.globalCompositeOperation = "lighter";        // Scope
      for(const [lw, a] of [[14*DPR,.12],[6*DPR,.3],[2*DPR,1]]){ c.strokeStyle = col(hue+40,100,65,a); c.lineWidth = lw; c.beginPath();
        for(let i=0;i<wave.length;i+=4){ const x = i/wave.length*W, y = H/2 + (wave[i]-128)/128*H*.42*(1+beat); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } },
    t => { fadeBg(.35); const b = bands(64), cx = W/2, cy = H*.52, r0 = Math.min(W,H)*(.16 + bass*.08 + beat*.04);   // Ring
      c.globalCompositeOperation = "lighter"; c.lineCap = "round";
      for(let i=0;i<64;i++){ const a = i/64*Math.PI*2 + t*.0002, l = r0 + b[i]*H*.36; c.strokeStyle = col(hue+i*5,95,62,.9); c.lineWidth = 5*DPR;
        c.beginPath(); c.moveTo(cx+Math.cos(a)*r0, cy+Math.sin(a)*r0); c.lineTo(cx+Math.cos(a)*l, cy+Math.sin(a)*l); c.stroke(); } },
    t => { fadeBg(.22); c.globalCompositeOperation = "lighter";      // Tunnel
      if(beat > .6 || parts.length < 3 || Math.random() < bass*.15) parts.push({r:4, h:hue+Math.random()*90, w:2+bass*10});
      for(let i=parts.length-1;i>=0;i--){ const p = parts[i]; p.r *= 1.035 + bass*.02; c.strokeStyle = col(p.h,95,60,Math.max(0,1-p.r/(W*.7))); c.lineWidth = p.w*DPR;
        c.beginPath(); c.ellipse(W/2, H*.52, p.r, p.r*.62, 0, 0, Math.PI*2); c.stroke(); if(p.r > W*.75) parts.splice(i,1); } },
    t => { fadeBg(.35); if(!stars.length) for(let i=0;i<260;i++) stars.push({x:Math.random()*2-1, y:Math.random()*2-1, z:Math.random()});  // Warp
      const sp = .004 + bass*.03 + beat*.02; c.globalCompositeOperation = "lighter";
      for(const s of stars){ const pz = s.z; s.z -= sp; if(s.z <= .02){ s.x = Math.random()*2-1; s.y = Math.random()*2-1; s.z = 1; continue; }
        const x1 = W/2 + s.x/pz*W*.3, y1 = H/2 + s.y/pz*H*.5, x2 = W/2 + s.x/s.z*W*.3, y2 = H/2 + s.y/s.z*H*.5;
        c.strokeStyle = col(hue+s.x*80,80,80,Math.min(1,(1-s.z)*1.4)); c.lineWidth = (1-s.z)*3*DPR; c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); } },
    t => { const d = img.data, k = t*.0006*(1+level*2);               // Plasma (low-res, smoothly scaled)
      for(let y=0;y<54;y++) for(let x=0;x<96;x++){
        const v = Math.sin(x*.11 + k) + Math.sin(y*.13 - k*1.3) + Math.sin((x+y)*.07 + k*.7) + Math.sin(Math.hypot(x-48, y-27)*.15 - k*2 - bass*3);
        const i = (y*96+x)*4, h = (hue/360 + v*.12 + level*.3);
        d[i] = 128 + 110*Math.sin(Math.PI*2*h); d[i+1] = 70 + 60*Math.sin(Math.PI*2*(h+.33)); d[i+2] = 150 + 100*Math.sin(Math.PI*2*(h+.66)); d[i+3] = 255; }
      sc.putImageData(img, 0, 0); c.globalCompositeOperation = "source-over"; c.imageSmoothingEnabled = true; c.globalAlpha = .9; c.drawImage(small, 0, 0, W, H); c.globalAlpha = 1;
      fadeBg(.35 - beat*.2); },
    t => { fadeBg(.25); c.globalCompositeOperation = "lighter";      // Flower (polar waveform)
      for(let k=0;k<6;k++){ c.strokeStyle = col(hue+k*40,95,60,.5); c.lineWidth = 2.5*DPR; c.beginPath();
        for(let i=0;i<=256;i++){ const a = i/256*Math.PI*2 + k*Math.PI/3 + t*.0003, w2 = (wave[(i*7)%2048]-128)/128;
          const r = Math.min(W,H)*(.22 + w2*.35 + bass*.1); const x = W/2 + Math.cos(a)*r*1.3, y = H*.52 + Math.sin(a)*r; i ? c.lineTo(x,y) : c.moveTo(x,y); } c.stroke(); } },
    t => { c.globalCompositeOperation = "source-over"; c.fillStyle = "#140E28"; c.fillRect(0,0,W,H);   // Mountains (spectrum history)
      if((mtick = (mtick+1)%3) === 0) hist.unshift(bands(64)); if(hist.length > 22) hist.pop();
      for(let r=hist.length-1;r>=0;r--){ const b = hist[r], y0 = H*.95 - r*H*.04, sx = r*W*.006;
        c.beginPath(); c.moveTo(sx, y0); for(let i=0;i<64;i++) c.lineTo(sx + i/63*(W-2*sx), y0 - b[i]*H*.5*(1-r/30));
        c.lineTo(W-sx, y0); c.closePath(); c.fillStyle = "#140E28"; c.fill(); c.strokeStyle = col(hue+r*8,90,65,1-r/24); c.lineWidth = 2*DPR; c.stroke(); } },
    t => { fadeBg(.5); c.globalCompositeOperation = "lighter"; const b = bands(7);   // Lava blobs
      for(let i=0;i<7;i++){ const x = W*(.5+.4*Math.sin(t*.00031*(i+1)+i)), y = H*(.5+.38*Math.cos(t*.00023*(i+2)+i*2));
        glowDot(x, y, (H*.18 + b[i]*H*.45)*(1+beat*.2), col(hue+i*45,95,55,.55)); } },
    t => { fadeBg(.3); const b = bands(32), n = 8; c.globalCompositeOperation = "lighter";   // Kaleidoscope
      c.save(); c.translate(W/2, H*.52);
      for(let k=0;k<n;k++){ c.rotate(Math.PI*2/n); for(const m of [1,-1]){ c.save(); c.scale(1, m); c.beginPath();
        for(let i=0;i<32;i++){ const r = i/32*Math.min(W,H)*.6, a = b[i]*.6 + t*.0004; c.lineTo(Math.cos(a)*r, Math.sin(a)*r); }
        c.strokeStyle = col(hue+k*45,95,62,.7); c.lineWidth = 3*DPR; c.stroke(); c.restore(); } } c.restore(); },
    t => { fadeBg(.4); const b = bands(12); c.globalCompositeOperation = "lighter";   // Lasers
      for(let i=0;i<12;i++){ const a = -Math.PI/2 + Math.sin(t*.0007 + i*.6)*1.1, len = H*1.4, x0 = W*(i%2 ? .3 : .7), y0 = H*1.02;
        const g = c.createLinearGradient(x0, y0, x0+Math.cos(a)*len, y0+Math.sin(a)*len); g.addColorStop(0, col(hue+i*30,100,65,.15+b[i])); g.addColorStop(1, "rgba(0,0,0,0)");
        c.strokeStyle = g; c.lineWidth = (3 + b[i]*14)*DPR; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0+Math.cos(a)*len, y0+Math.sin(a)*len); c.stroke(); } },
    t => { fadeBg(.18); c.globalCompositeOperation = "lighter";      // Fireworks
      if(beat > .7 || Math.random() < .015 + bass*.04){ const x = W*(.15+Math.random()*.7), y = H*(.15+Math.random()*.45), h = hue + Math.random()*120;
        for(let i=0;i<70;i++){ const a = Math.random()*Math.PI*2, v = (1+Math.random()*3)*DPR; parts.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, life:1, h}); } beat = 0; }
      for(let i=parts.length-1;i>=0;i--){ const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += .03*DPR; p.life -= .012;
        c.fillStyle = col(p.h,100,65,p.life); c.fillRect(p.x, p.y, 3*DPR, 3*DPR); if(p.life <= 0) parts.splice(i,1); } if(parts.length > 1500) parts.splice(0, 500); },
    t => { c.globalCompositeOperation = "source-over"; c.fillStyle = "#140E28"; c.fillRect(0,0,W,H);   // LED matrix
      const cols = 32, rows = 14, b = bands(cols), cw = W/cols, rh = H/rows;
      for(let i=0;i<cols;i++){ const on = Math.round(b[i]*rows*1.15);
        for(let j=0;j<rows;j++){ const lit = j < on, f = j/rows; c.fillStyle = lit ? col(f < .55 ? 120 : f < .8 ? 55 : 0, 95, 55) : "rgba(255,255,255,.05)";
          c.beginPath(); c.arc(i*cw+cw/2, H - j*rh - rh/2, Math.min(cw,rh)*.32, 0, Math.PI*2); c.fill(); } } },
    t => { fadeBg(.25); c.globalCompositeOperation = "lighter"; const b = bands(96);   // Galaxy
      for(let i=0;i<96;i++){ for(const arm of [0, Math.PI]){ const a = i*.17 + arm + t*.00035, r = i/96*Math.min(W,H)*.62;
        glowDot(W/2 + Math.cos(a)*r*1.4, H*.52 + Math.sin(a)*r*.7, (2 + b[i]*14)*DPR, col(hue+i*3,95,70,.9)); } } },
    t => { c.globalCompositeOperation = "source-over";               // Dream (zooming feedback trails)
      bc.clearRect(0,0,W,H); bc.drawImage(cv, 0, 0);
      c.fillStyle = "rgba(20,14,40,.3)"; c.fillRect(0,0,W,H);
      c.save(); c.translate(W/2, H/2); c.rotate(.004 + bass*.01); const z = 1.02 + bass*.03; c.scale(z, z); c.globalAlpha = .78; c.drawImage(buf, -W/2, -H/2); c.restore(); c.globalAlpha = 1;
      c.globalCompositeOperation = "lighter"; c.strokeStyle = col(hue+t*.02,100,65,.9); c.lineWidth = 3*DPR; c.beginPath();
      for(let i=0;i<=200;i++){ const a = i/200*Math.PI*2, r = H*.18 + (wave[i*10]-128)/128*H*.2; const x = W/2+Math.cos(a)*r*1.3, y = H/2+Math.sin(a)*r; i ? c.lineTo(x,y) : c.moveTo(x,y); } c.stroke(); },
    t => { fadeBg(.35); c.globalCompositeOperation = "lighter";      // Bubbles
      if(Math.random() < .08 + bass*.5) bubbles.push({x:Math.random()*W, y:H+20, r:(6+Math.random()*24+bass*30)*DPR, v:(1+Math.random()*2)*DPR, h:hue+Math.random()*80});
      for(let i=bubbles.length-1;i>=0;i--){ const p = bubbles[i]; p.y -= p.v*(1+level*2); p.x += Math.sin(p.y*.02)*DPR;
        c.strokeStyle = col(p.h,90,70,.8); c.lineWidth = 2*DPR; c.beginPath(); c.arc(p.x, p.y, p.r*(1+beat*.15), 0, Math.PI*2); c.stroke();
        c.fillStyle = col(p.h,90,85,.35); c.beginPath(); c.arc(p.x-p.r*.35, p.y-p.r*.35, p.r*.25, 0, Math.PI*2); c.fill(); if(p.y < -60) bubbles.splice(i,1); } },
    t => { fadeBg(.4); const b = bands(36); c.globalCompositeOperation = "lighter";   // Sunburst
      for(let i=0;i<36;i++){ const a = i/36*Math.PI*2 + t*.00025, a2 = a + Math.PI/36, r = Math.max(W,H)*(.25 + b[i]*.6);
        c.fillStyle = col(hue+(i%2)*40,95,60,.18 + b[i]*.5); c.beginPath(); c.moveTo(W/2, H*.55); c.lineTo(W/2+Math.cos(a)*r, H*.55+Math.sin(a)*r); c.lineTo(W/2+Math.cos(a2)*r, H*.55+Math.sin(a2)*r); c.fill(); }
      glowDot(W/2, H*.55, H*(.15+bass*.15+beat*.05), col(hue+30,100,75,.9)); },
    t => { fadeBg(.3); const b = bands(5); c.globalCompositeOperation = "lighter";   // Ribbons
      for(let k=0;k<5;k++){ c.strokeStyle = col(hue+k*50,95,62,.75); c.lineWidth = (4+b[k]*10)*DPR; c.beginPath();
        for(let x=0;x<=W;x+=W/80){ const y = H*(.2+k*.15) + Math.sin(x/W*Math.PI*(2+k) + t*.0015*(k+1))*H*(.06+b[k]*.25); x ? c.lineTo(x,y) : c.moveTo(x,y); } c.stroke(); } },
    t => { fadeBg(.5); c.globalCompositeOperation = "lighter";       // Disco ball spots
      const n = 34, bd = bands(n);
      for(let i=0;i<n;i++){ const a = i*2.399 + t*.00045, r = ((i*53)%100)/100, x = W*(.5 + Math.cos(a)*r*.55), y = H*(.45 + Math.sin(a*1.3)*r*.5);
        glowDot(x, y, (14 + bd[i]*50 + beat*16)*DPR, col(hue+i*25,100,65,.75)); }
      glowDot(W/2, H*.12, H*.12*(1+beat*.3), "rgba(255,255,255,.6)"); },
  ];
  function setMode(m){ mode = m; if(typeof m === "number"){ cur = m; fade = 1; } try{ localStorage.setItem("roboGroove.viz", String(m)); }catch(e){} if(m === "off"){ c.fillStyle = "#140E28"; c.fillRect(0,0,W,H); } }
  function frame(t){
    if(!W) resize();
    if(mode === "off" || document.hidden) return;
    analyse(t);
    hue = (hue + .08 + level*.6) % 360;
    if(mode === "random" && t > nextSwitch){
      if(nextSwitch){ let n; do{ n = Math.floor(Math.random()*S.length); }while(n === cur); cur = n; fade = 1; parts.length = 0; bubbles.length = 0; hist.length = 0; }
      nextSwitch = t + 24000;
    }
    try{ S[cur](t); }catch(e){ console.warn(e); }
    c.globalCompositeOperation = "source-over";
    if(fade > 0){ c.fillStyle = `rgba(20,14,40,${fade})`; c.fillRect(0,0,W,H); fade = Math.max(0, fade - .04); }
    lastT = t;
  }
  return { frame, setMode, get mode(){ return mode; }, get cur(){ return cur; }, kick(){ beat = 1; }, resize };
})();
