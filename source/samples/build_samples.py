#!/usr/bin/env python3
"""Robo Groove sample builder.
Sources:  VCSL (CC0, github.com/sgossner/VCSL)  ·  FluidR3_GM (MIT, via gleitz/midi-js-soundfonts)
Output:   samples.json  {name: {"kind":"pitched","notes":[[midi,b64],...]} | {"kind":"hits","hits":{key:b64}}}
Every sample: leading silence trimmed, cut to a max length with a fade, peak-normalised,
mono 32 kHz MP3. Pitched sets are pitch-verified (VCSL octave naming varies)."""
import os, re, json, base64, subprocess, concurrent.futures as cf, urllib.parse, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw"); OUT = os.path.join(HERE, "out")
os.makedirs(RAW, exist_ok=True); os.makedirs(OUT, exist_ok=True)
VCSL_GIT = os.environ.get("VCSL_GIT", os.path.join(HERE, "vcsl"))   # git clone --filter=blob:none --no-checkout https://github.com/sgossner/VCSL.git vcsl
VCSL_RAW = "https://raw.githubusercontent.com/sgossner/VCSL/master/"
FLUID = "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/"
NAMES = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"]
SHARP = {"C":0,"C#":1,"D":2,"D#":3,"E":4,"F":5,"F#":6,"G":7,"G#":8,"A":9,"A#":10,"B":11}

def sh(cmd): return subprocess.run(cmd, capture_output=True, check=False)
def fetch(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 100: return dest
    for _ in range(5):
        r = sh(["curl","-sSfL","-m","120","-o",dest+".part",url])
        if r.returncode == 0 and os.path.getsize(dest+".part") > 100:
            os.replace(dest+".part", dest); return dest
    raise RuntimeError("download failed: " + url)

def decode(path, sr=32000):
    r = sh(["ffmpeg","-v","error","-i",path,"-ac","1","-ar",str(sr),"-f","f32le","-"])
    return np.frombuffer(r.stdout, dtype=np.float32)

def detect_midi(x, sr=32000):
    """median YIN-ish autocorrelation pitch over the sustained part"""
    x = x[int(.05*sr):int(.6*sr)]
    if len(x) < 2048: return None
    ests = []
    for s in range(0, len(x)-2048, 1024):
        f = x[s:s+2048] * np.hanning(2048)
        if np.sqrt(np.mean(f**2)) < 1e-3: continue
        ac = np.fft.irfft(np.abs(np.fft.rfft(f, 4096))**2)[:2048]
        ac /= ac[0] + 1e-12
        lo, hi = int(sr/2000), int(sr/40)
        lag = lo + int(np.argmax(ac[lo:hi]))
        # prefer the first strong peak (avoid octave-down errors)
        for cand in range(lo, hi):
            if ac[cand] > .85*ac[lag] and ac[cand] >= ac[cand-1] and ac[cand] >= ac[cand+1]: lag = cand; break
        ests.append(69 + 12*np.log2(sr/lag/440))
    return float(np.median(ests)) if ests else None

def process(src, dst, maxlen, br="48k", fade=.15):
    if os.path.exists(dst): return dst
    af = (f"silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.002,"
          f"atrim=0:{maxlen},afade=t=out:st={max(0,maxlen-fade)}:d={fade},dynaudnorm=f=500:g=31:p=0.89:m=1,volume=1.0")
    # peak-normalise in two steps: measure, then apply
    r = sh(["ffmpeg","-v","error","-i",src,"-ac","1","-af",af.replace("dynaudnorm=f=500:g=31:p=0.89:m=1,",""),"-ar","32000","-f","f32le","-"])
    x = np.frombuffer(r.stdout, dtype=np.float32)
    gain = 0.89/max(1e-4, float(np.max(np.abs(x)))) if len(x) else 1
    af2 = af.replace("dynaudnorm=f=500:g=31:p=0.89:m=1,","").replace("volume=1.0", f"volume={gain:.3f}")
    r = sh(["ffmpeg","-v","error","-y","-i",src,"-ac","1","-af",af2,"-ar","32000","-c:a","libmp3lame","-b:a",br,dst])
    if r.returncode: raise RuntimeError(r.stderr.decode()[:300])
    return dst

def b64(path): return base64.b64encode(open(path,"rb").read()).decode()

# ---------------------------------------------------------------- FluidR3 pitched sets
FLUID_SETS = {  # name: (gleitz instrument, lo, hi, step, maxlen)
  "gtr_nylon":("acoustic_guitar_nylon",40,88,4,2.2), "gtr_steel":("acoustic_guitar_steel",40,88,4,2.2),
  "gtr_clean":("electric_guitar_clean",40,88,4,2.2), "gtr_jazz":("electric_guitar_jazz",40,84,4,2.2),
  "gtr_muted":("electric_guitar_muted",40,76,4,.6),  "gtr_over":("overdriven_guitar",40,88,4,2.0),
  "gtr_dist":("distortion_guitar",40,88,4,2.0),      "banjo":("banjo",48,88,4,1.4),
  "bass_finger":("electric_bass_finger",28,60,4,1.8),"bass_pick":("electric_bass_pick",28,60,4,1.6),
  "bass_slap":("slap_bass_1",28,60,4,1.2),           "bass_upright":("acoustic_bass",28,60,4,1.8),
  "contrabass":("contrabass",28,60,5,2.5),
  "flute":("flute",60,96,5,2.5), "piccolo":("piccolo",72,100,5,2.2), "clarinet":("clarinet",50,90,5,2.5),
  "oboe":("oboe",58,92,5,2.5), "bassoon":("bassoon",34,72,5,2.5), "trumpet":("trumpet",54,86,5,2.2),
  "trombone":("trombone",40,72,5,2.2), "tuba":("tuba",28,60,5,2.2), "altosax":("alto_sax",49,84,5,2.5),
  "panflute":("pan_flute",60,96,5,2.2), "recorder":("recorder",60,92,5,2.2), "ocarina":("ocarina",60,92,5,2.2),
  "strings":("string_ensemble_1",40,88,5,2.5), "pizz":("pizzicato_strings",40,88,4,1.0),
  "brass":("brass_section",48,84,4,1.6), "choir":("choir_aahs",48,80,5,2.5), "accordion":("accordion",48,84,5,2.5),
  "steeldrums":("steel_drums",56,88,4,1.5), "clav":("clavinet",40,84,4,1.0), 
  "organ":("rock_organ",40,88,5,2.5), "violin":("violin",55,96,5,2.5), "horn":("french_horn",41,77,5,2.5),
  "harpsichord":("harpsichord",40,88,4,1.5),
}
def fluid_jobs():
    jobs = []
    for name,(inst,lo,hi,step,ml) in FLUID_SETS.items():
        for m in range(lo, hi+1, step):
            note = f"{NAMES[m%12]}{m//12-1}"
            jobs.append((name, m, FLUID+urllib.parse.quote(f"{inst}-mp3/{note}.mp3"), ml))
    return jobs

# ---------------------------------------------------------------- VCSL sets
def vcsl_list(d):
    r = sh(["git","-C",VCSL_GIT,"ls-tree","-r","--name-only","HEAD",d])
    return [l for l in r.stdout.decode().splitlines() if l.endswith(".wav")]
def note_of(fn):
    m = re.search(r"_([A-G]#?)(-?\d)(?=[_.])", os.path.basename(fn))
    return None if not m else (int(m.group(2))+1)*12 + SHARP[m.group(1)]
VCSL_PITCHED = {  # name: (dir, include-regex, maxlen, step)
  "piano":   ("Chordophones/Zithers/Grand Piano, Kawai", r"GPiano_sus_.*_v3_rr1", 2.4, 4),
  "epiano":  ("Electrophones/TX81Z/FM Piano", r"FMPiano_.*_vl2", 2.0, 4),
  "vibes":   ("Idiophones/Struck Idiophones/Vibraphone", r"Vibes_hard_.*_v2_rr1", 2.4, 3),
  "marimba": ("Idiophones/Struck Idiophones/Marimba", r"Outrigger_.*_med_01", 1.2, 3),
  "glock":   ("Idiophones/Struck Idiophones/Glockenspiel", r"glock_medium_.*_01", 1.6, 3),
  "harp":    ("Chordophones/Composite Chordophones/Concert Harp", r"KSHarp_.*_(f1|mf1)", 2.0, 4),
  "harmonica":("Aerophones/Free Aerophones/Harmonica-Hohner-Special20-C", r"Special20_Normal_[A-G]", 2.2, 2),
  "tenorsax":("Aerophones/Reed Aerophones/Tenor Saxophone", r"NV_Main_.*_vl2_rr1", 2.5, 3),
  "timpani": ("Membranophones/Struck Membranophones/Timpani 1", r"Timpani\d_Hit_v3_rr1", 2.5, 1),
}
VCSL_HITS = {  # name: {key: (dir, exact-file-substring, maxlen)}
  "kit": {
    "s":  ("Membranophones/Struck Membranophones/Snare Drum, Modern 1", "Snare2_HitSN_v6_rr1", .6),
    "sg": ("Membranophones/Struck Membranophones/Snare Drum, Modern 1", "Snare2_HitSN_v3_rr1", .4),
    "r":  ("Membranophones/Struck Membranophones/Snare Drum, Rope Tension", "RopeSnare_sidestick_Main_vl2_rr1", .3),
    "h":  ("Idiophones/Struck Idiophones/Hi-Hat Cymbal", "HiHat_HitC_v3_rr1", .35),
    "o":  ("Idiophones/Struck Idiophones/Hi-Hat Cymbal", "HiHat_HitLoose_rr1", 1.0),
    "x":  ("Idiophones/Struck Idiophones/Suspended Cymbal 1", "susCymb1_hit_f1", 2.4),
    "y":  ("Idiophones/Struck Idiophones/Suspended Cymbal 1", "susCymb1_hit_bell_mf1", 1.4),
    "m":  ("Membranophones/Struck Membranophones/Tom 1", "TomH_HitM_v3_rr1", .8),
    "t":  ("Membranophones/Struck Membranophones/Tom 2", "TomL_HitM_v3_rr1", 1.0),
    "c":  ("Idiophones/Struck Idiophones/Claps", "Clap_rr1", .5),
    "c2": ("Idiophones/Struck Idiophones/Claps", "Clap_rr2", .5),
    "b":  ("Idiophones/Struck Idiophones/Cowbells", "Cowbell1_Normal_v3_rr1", .6),
    "w":  ("Idiophones/Struck Idiophones/Claves", "Claves1_Hit_v2_rr1", .3),
    "wb": ("Idiophones/Struck Idiophones/Woodblock", "wood_click_f_rr2", .3),
    "z":  ("Idiophones/Struck Idiophones/Shaker, Small", "Mid_ShakerDouble_Down_rr1", .35),
    "a":  ("Idiophones/Struck Idiophones/Tambourine 1", "Tamb1_Hit_v1_rr1", .6),
    "q":  ("Membranophones/Struck Membranophones/Conga", "Conga_HitN_v3_rr1", .7),
    "q2": ("Membranophones/Struck Membranophones/Conga", "Tumba_HitN_v4_rr1", .8),
    "bd": ("Membranophones/Struck Membranophones/Bass Drum 1", "BDrumNew_hit_v5_rr1", 1.8),
    "ms": ("Membranophones/Struck Membranophones/Snare Drum, Rope Tension", "RopeSnare_hi_sn_Main_vl3_rr1", .6),
  },
  "bongos": {
    "hi": ("Membranophones/Struck Membranophones/Bongos", "BongoH_Hit1_v2_rr1", .6),
    "hi2":("Membranophones/Struck Membranophones/Bongos", "BongoH_Hit1_v3_rr2", .6),
    "lo": ("Membranophones/Struck Membranophones/Bongos", "BongoL_Hit1_v2_rr1", .7),
    "lo2":("Membranophones/Struck Membranophones/Bongos", "BongoL_Hit1_v3_rr2", .7),
    "him":("Membranophones/Struck Membranophones/Bongos", "BongoH_HitMuted1_v2_rr1", .3),
    "lom":("Membranophones/Struck Membranophones/Bongos", "BongoL_HitMuted2_v2_rr1", .3),
    "roll":("Membranophones/Struck Membranophones/Bongos", "BongoH_Roll_v2_rr1", 1.2),
  },
}

def run():
    result = {}
    # ---- FluidR3
    jobs = fluid_jobs()
    def do_fluid(j):
        name, m, url, ml = j
        raw = os.path.join(RAW, f"fl_{name}_{m}.mp3"); out = os.path.join(OUT, f"fl_{name}_{m}.mp3")
        try: fetch(url, raw)
        except Exception as e: return (name, m, None, str(e))
        process(raw, out, ml); return (name, m, out, None)
    with cf.ThreadPoolExecutor(12) as ex:
        for name, m, out, err in ex.map(do_fluid, jobs):
            if err: print("  skip", name, m, err[:80]); continue
            result.setdefault(name, {"kind":"pitched","notes":[]})["notes"].append([m, out])
    print("fluid sets:", len(result))
    # ---- VCSL pitched (pitch-verified)
    for name,(d,rx,ml,step) in VCSL_PITCHED.items():
        files = [f for f in vcsl_list(d) if re.search(rx, f)]
        cand = []
        def dl(f):
            raw = os.path.join(RAW, "vc_" + re.sub(r"[^A-Za-z0-9_.#-]","_",os.path.basename(f)))
            fetch(VCSL_RAW + urllib.parse.quote(f), raw); return f, raw
        with cf.ThreadPoolExecutor(8) as ex: got = list(ex.map(dl, files))
        for f, raw in got:
            det = detect_midi(decode(raw))
            if det is None: continue
            named = note_of(f)
            m = round(det)
            if named is not None:          # trust the name's pitch class, fix the octave from detection
                m = named + 12*round((det - named)/12)
            cand.append((m, raw, det))
        cand = [c for c in cand if 33 <= c[0] <= 100]; cand.sort()
        keep, last = [], -99
        for m, raw, det in cand:
            if m - last >= step: keep.append((m, raw)); last = m
        notes = []
        for m, raw in keep:
            out = os.path.join(OUT, f"vc_{name}_{m}.mp3"); process(raw, out, ml, "64k" if name in ("piano","epiano") else "48k")
            notes.append([m, out])
        result[name] = {"kind":"pitched","notes":notes}
        print(f"vcsl {name}: {len(files)} files -> {len(notes)} notes {notes[0][0] if notes else '-'}..{notes[-1][0] if notes else '-'}")
    # ---- VCSL hits
    for name, hits in VCSL_HITS.items():
        res = {}
        for key,(d,sub,ml) in hits.items():
            f = [x for x in vcsl_list(d) if sub in os.path.basename(x)]
            if not f: print("  missing", key, sub); continue
            raw = os.path.join(RAW, "vc_" + re.sub(r"[^A-Za-z0-9_.#-]","_",os.path.basename(f[0])))
            fetch(VCSL_RAW + urllib.parse.quote(f[0]), raw)
            out = os.path.join(OUT, f"hit_{name}_{key}.mp3"); process(raw, out, ml, "56k", fade=min(.15, ml/3))
            res[key] = out
        result[name] = {"kind":"hits","hits":res}
        print(f"hits {name}: {len(res)}")
    # ---- embed
    emb = {}
    for name, v in result.items():
        if v["kind"] == "pitched":
            v["notes"].sort()
            emb[name] = {"kind":"pitched","notes":[[m, b64(p)] for m,p in v["notes"]]}
        else:
            emb[name] = {"kind":"hits","hits":{k: b64(p) for k,p in v["hits"].items()}}
    json.dump(emb, open(os.path.join(HERE,"samples.json"),"w"), separators=(",",":"))
    tot = sum(os.path.getsize(os.path.join(OUT,f)) for f in os.listdir(OUT))
    print(f"TOTAL compressed {tot/1e6:.2f} MB, json {os.path.getsize(os.path.join(HERE,'samples.json'))/1e6:.2f} MB")

if __name__ == "__main__": run()
