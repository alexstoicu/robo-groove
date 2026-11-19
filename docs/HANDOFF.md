# Robo Groove: Project Handoff

> **Update 18 Nov 2026: this GitHub repo is now the master copy.** Paths in this document refer to the old
> handoff folder. In the repo: app source is in `source/`, the Android project in `android/`, tests in `tests/`,
> and the published web app at the root. Offline support (service worker + manifest, §7) **is built**, since 25 Oct 2026.
> The Android APK is now release-signed (see the GitHub Releases page). See `CHANGELOG.md` for what changed.

**Status:** v1.1, feature-complete beta. Last build **16 Oct 2026**; handoff written **13 Nov 2026**.
**Owner:** Alex (NerdHomies). Built with Claude (Cowork), 16–24 Oct 2026.
**What it is:** a kids' music toy for ages 4–12. Kids build songs with a cartoon band and make a robot dance exactly on the beat. It started from a simple wish: a robot-dance music activity for kids that really follows the beat. It has since grown into its own app with its own characters and name.

This document is the starting point for anyone continuing the project. Ideas that were discussed but not built are in **`IDEAS-AND-BACKLOG.md`**.

---

## 1. Where everything is

| What | Where |
|---|---|
| The app (one self-contained HTML file, ~8 MB) | `robo-groove.html` (this folder) · `builds/ios/index.html` (same file) |
| Android app (debug-signed APK, v1.1, versionCode 2) | `builds/RoboGroove-v1.1.apk` |
| iPad Home Screen icon (180×180) | `builds/ios/icon.png` |
| Sound demo (6 sections, recorded by the app's own export) | `builds/RoboGroove-sound-demo.mp3` |
| All source code and build inputs | `source/` |
| Android (Capacitor 8) project, minus build output | `tools/android-capacitor-project.zip` |
| Automated test scripts (Playwright, Python) | `tools/test-scripts.zip` |
| Cover art for the website's Apps card (640×360) | `robo-groove-cover.svg` |
| Prompt for adding the app to Alex's website (Claude Code) | `robo-groove-claude-code-prompt.md` |
| NerdHomies style guide (the art direction used) | FTP server: `/Games/Config/nerdhomies-game-style-guide.md` |
| Published copy on the FTP server | FTP: `/NerdHomies/robo-groove.html` (uploaded 18 Oct 2026) |
| iPad install | Alex's GitHub Pages repo `robo-groove` (holds `index.html` + `icon.png`), added to the iPad Home Screen from Safari |

> The `icon.png` already in this folder from before (7.5 KB) is not the one generated for the build (1.7 KB, in `builds/ios/`). Check which one is wanted before reusing it.

---

## 2. Features (v1.1)

**The band.** The order on stage, left to right, is: Teddy bear (drums) · Fairy (keys & synth) · **Mr. Slow** the turtle (bongos) · **Robot** (dancer, centre) · Unicorn (guitar) · **Mister Sly** the fox (flute and winds). There are two robot skins: A (boxy) and B (round, on a wheel).

**Robot dance moves.** These go on three lanes (Head, Arms, Legs) × 8 beats. Each move has its own sound.

- **Head:** Spin, Bob, Tilt, Blink, Grow, Pulse.
- **Arms:** Wave, Pump, plus five "shape" moves. Each shape is drawn in light, and its sound uses the matching waveform:
  - Clap (noise)
  - Heart (triangle)
  - Snake (sawtooth)
  - Square (square)
  - Circle (sine)
- **Legs:** Jump, Stomp, Kick, Shuffle. On Robot B these move the wheel.
- **Adding moves:** drag a move to a slot, or tap it to fill the next empty slot. Drag a placed move out to remove it, or tap ✕. Drag between slots to swap.

**Band loops.** There are 14 genres × 8 loops for each of the 5 band members, which makes 560 loops.

- **Genres:** Pop, Disco, EDM, Lo-fi Chill, Adventure, Rock, Metal, Hip-Hop, Funk, Reggae, Latin, Country, Jazz, Space.
- **Loops for each band member:**
  - **Drums:** Groove, Groove 2, Busy, Intro, Half-time, Build-up, Breakdown, Fill
  - **Bongos:** Groove, Groove 2, Busy, Martillo, Sparse, Answer, Rolls, Fill
  - **Keys:** Chords, Stabs, Arp, Bells, Lead 1, Lead 2, Bass, Pad
  - **Guitar:** Strum, Strum 2, Pick, Pick 2, Riff, Riff 2, Chug, Solo
  - **Winds:** Melody, Melody 2, Long Notes, Toots, Twirl, Echo, Harmony, Low Hoots
- **Distinct kits:** each genre has its own drum kit and grooves, written by hand.
- **Swing** on Lo-fi, Hip-Hop, Reggae, Country and Jazz.
- **EDM "pump":** the music ducks under each kick.

**Song structure.**

- **Sections:** up to 12 sections, each 1, 2, 3, 4, 8, 12, 16 or 24 bars long. 32 bars was removed on request.
- **A section** holds the robot pattern (8 beats, repeating), one loop choice per band member, a **mood** and the effect ticks. A long section repeats its pattern.
- **Moods** set the chords for the whole band, one chord per bar over 4 bars: Happy, Adventure, Dreamy, Spooky, Brave, Calm, Groovy, Bluesy. Because everyone shares the same chords, every genre combination stays in tune.
- **Modes:** 🔁 **Loop part** repeats the selected section. 🎵 **Song** plays all sections in order.
- **Song ruler:** tap to choose where playback starts. Drag to loop a range of bars.
- **Tempo:** 60–180 BPM, with 7 presets (🐌…⚡), ±5 steps, and "Match the genre's speed".
- **Effects:** a reverb 🌊 tick and an echo ⛰️ tick under each beat.

**Touch-to-play.** Only the instrument itself responds; tapping anywhere else on a character opens that character's tab.

- Each piece of the bear's kit makes its own sound: kick, snare, hi-hat, crash and tom.
- Mr. Slow's bongos play when tapped.
- The unicorn's guitar strums the current chord.
- The fox's flute plays a random short note from the scale.
- The robot's antenna makes random robot noises.
- The fairy's keys play their real pitch **and open a two-octave mini piano**, which supports multi-touch and sliding (glissando).

**Visuals.**

- **Light shows:** 20 music-reactive backgrounds behind the band. The 🌈 Lights button offers random (changes about every 24 s), repeat one, or off.
- **Title sign:** a light-bulb marquee with a bow-tie bottom edge (DOOM-logo style). Its bulbs chase on the beat.

**Saving.**

- **📁 My Songs:** named songs saved inside the app.
- **Project files:** save and open `.robogroove` files.
- **💾 Save** exports MP3 (160 kbps) or WAV (16-bit) of the whole song, the loop range, or one part. Up to 10 minutes; rendering runs faster than real time.
- **Where exports go:**
  - Android: Documents › RoboGroove, plus a Share button
  - iPad: the share sheet ("Save to Files")
  - Desktop: downloads

**Other:** mute button, credits screen, "tap to start" screen (required to unlock audio), and a "turn sideways" prompt in portrait.

---

## 3. How it's built (architecture)

### 3.1 One file
The app ships as **one HTML file** with no network requests and no dependencies at runtime. `source/build.py` assembles it from:

```
template.html   (page skeleton with placeholders)
  /*STYLE*/       <- style.css  (+ fonts/fonts.css, Fredoka & Figtree embedded as base64 woff2)
  <!--STAGE-->    <- stage.html (all character SVGs; generated by art/rg_art.py)
  <!--STARTSIGN--><- the title sign SVG, copied onto the start screen
  /*CAPCORE*/     <- vendor/capacitor-core.js (Capacitor bridge, inert in browsers)
  /*LAME*/        <- vendor/lame.min.js (MP3 encoder, lamejs 1.2.1)
  /*SCRIPT*/      <- music.js + viz.js + sampler.js + app.js(+ export.js + projects.js at /*EXPORT*/)
                     with trim.json injected at "const TRIM = {};      /*TRIM*/"
  <!--SAMPLEDATA--> <- samples/samples.json as <script type="application/json" id="sampleData">
```

Run `python build.py` in `source/`, which writes `source/www/index.html`. The current sources rebuild **byte-identical** to the shipped `robo-groove.html`; this was verified on 13 Nov 2026.

### 3.2 Source files

| File | Lines | Role |
|---|---|---|
| `music.js` | ~700 | Timing constants, genres and moods, drum, keys, guitar and winds data, audio graph, synth voices, Karplus-Strong guitar fallback, loop compiler, `playInst()` |
| `sampler.js` | ~210 | Sample loader and decoder, sampled notes, drums and guitar, Mr. Slow's bongo data and compiler, `setsFor()` / `ensureSamples()` |
| `viz.js` | ~160 | The 20 visualizer styles (canvas 2D) |
| `app.js` | ~840 | State, saving and loading, robot SFX and animation, band animation, touch-to-play, mini piano, sequencer, UI (tabs, palette, sections, ruler, tempo, popovers, drag and drop) |
| `export.js` | ~180 | Offline rendering, WAV and MP3 encoding, saving (native, iOS share, download) |
| `projects.js` | ~125 | My Songs library, `.robogroove` files, lights menu, mute, credits |
| `style.css`, `template.html` | | Layout and NerdHomies styling |
| `art/rg_art.py` | ~310 | **The art script.** It generates `stage.html`, `art/sheet.html` (contact sheet) and standalone SVGs. |
| `samples/build_samples.py` | ~210 | Downloads, pitch-checks, trims, normalizes and compresses the sample library into `samples.json` |
| `trim.json` | | Per-loop loudness corrections (560 entries), measured offline |

### 3.3 Timing and sequencer
- **Clock:** sounds are scheduled on the Web Audio clock. A 25 ms `setInterval` looks 120 ms ahead; this is the "two clocks" pattern. This is what fixed the original "doesn't follow the beat" complaint.
- **Grid:** the grid unit is the 16th note. Band loops are **64 sixteenths (4 bars)**, and the robot pattern is **32 sixteenths (8 beats)**. `gpos` counts sixteenths.
  - In Song mode, `locate()` maps `gpos` to (section, position in section).
  - Jumps (ruler taps, section taps) wait for the next beat (`pendingJump`).
- **Visuals:** every audio event also goes into `visQ` with its scheduled time. The `requestAnimationFrame` loop fires each animation when `ctx.currentTime - outputLatency` reaches that time. Measured sync was about 9–20 ms in Chrome, about one frame.
- **Tempo:** a global `BPM` / `SIX` (seconds per 16th), changeable live. The delay time follows the tempo.

### 3.4 Audio graph
```
note/hit -> per-event trim (TRIM[genre/inst/loop]) -> [lowpass for lo-fi] -> stereo pan (by stage position)
        -> DUCK[fx] (everything except drums; the EDM kick ducks it) -> BUS[fx] -> master -> compressor -> soft clipper -> speakers
BUS[0..3] = dry / +reverb / +echo / both;   every bus also sends 14% to the reverb ("room")
reverb: generated stereo impulse (2.2 s, early reflections, darkening tail)
echo: dotted-8th delay, 42% feedback, 3.2 kHz damping
AnalyserNode (fft 2048) taps the final output for the visualizer
```
- **Pan positions:** drums −0.12, keys −0.42, bongos −0.25, guitar +0.32, winds +0.52, robot centre.
- **Human feel:** melodic parts get about ±5 ms of random timing, and chord notes are spread 4 ms apart.

### 3.5 Instruments: hybrid of samples and synths

**Samples.** 46 sets, about 375 recordings, 5.6 MB of MP3 (mono, 32 kHz, 48–64 kbps), embedded as base64. The page decodes them **lazily, one instrument at a time**, only when a song uses that instrument. This keeps tablet memory down.

- MP3 decoders add a little silence at the start. Each sample's real start is found by `onsetOf()`.
- Notes between samples use the nearest sample, pitch-shifted (about ±2 semitones).
- `SPAR` sets each instrument's level and whether it rings out (struck) or stops at the note's end (held).
- `SAMPLED` maps synth timbre names to sample sets. Any timbre not mapped stays a synth: EDM, Space, chiptune, 808, pads, acid.

**Drums.**

- **Acoustic kits** use VCSL hits: snare, rim, hats, crash, ride bell, toms, claps, cowbell, claves, woodblock, shaker, tambourine, congas, concert bass drum and march snare. **The kick is always synthesized**; VCSL has no drum-kit kick.
- **Electronic kits** (EDM, Hip-Hop, Space) are synthesized, except for sampled claps.

**Guitar** uses FluidR3 guitars: nylon, steel, clean, jazz, muted, overdriven, distortion, banjo. It has wah for Funk and Disco, and pitch bends on the solo.

**While a sample set is loading**, the old synth or Karplus-Strong sound plays as a fallback. Play, preview and export all wait for `ensureSamples()` first, so in practice the fallback is rarely heard.

**Sample sources:**

| Source | License | Used for |
|---|---|---|
| **VCSL** (Versilian Community Sample Library, github.com/sgossner/VCSL) | CC0 | Grand piano, FM electric piano, vibes, marimba, glockenspiel, harp, harmonica, tenor sax, all acoustic drums and percussion, **bongos** |
| **FluidR3 GM** (via gleitz/midi-js-soundfonts) | MIT | Guitars, banjo, basses, flute, piccolo, clarinet, oboe, bassoon, trumpet, trombone, tuba, alto sax, pan flute, recorder, ocarina, strings, pizzicato, brass section, choir, accordion, steel drums, clavinet, organ, violin, French horn, harpsichord |

The sample pipeline (`build_samples.py`) works like this:

1. Download the recordings.
2. Detect each recording's real pitch. VCSL octave naming isn't consistent, so the octave comes from detection and the pitch class from the file name.
3. Trim leading silence, cut to a maximum length with a fade, and normalize the peak to −1 dBFS.
4. Encode to MP3 and embed in `samples.json`.

Check results: 337 of 377 matched exactly. The 40 flagged were detector limits (very low basses; organ and choir octaves). One empty contrabass sample was dropped, and timpani was dropped (pitch unreliable).

### 3.6 Loudness balancing
- **How:** every one of the 560 loops was rendered offline with Chrome's OfflineAudioContext and its RMS measured.
- **Targets:** drums 0.07, others 0.05.
- **Result:** `trim.json` holds a gain for each loop, clamped to 0.25–3.
- **Check:** full-band mixes peak at 0.6–0.9 with effects on; the compressor and soft clipper protect against overs.
- **Re-measure after any change** to sounds or patterns. The method is in §5.

### 3.7 Export
- **Rendering:** `OfflineAudioContext` at 44.1 kHz stereo. It schedules 1-second chunks inside `suspend()` callbacks to keep memory low, and swaps the audio globals with `grabAudio()` / `putAudio()`.
- **Tidy:** trims the silent tail, normalizes to 0.89 peak, and adds a short fade.
- **Formats:** WAV (16-bit PCM) or MP3 (lamejs, 160 kbps, encoded in chunks with progress).
- **Delivery:**
  - Android: Capacitor Filesystem writes to `Documents/RoboGroove/`, then Share.
  - iPad: Web Share with files.
  - Desktop: download.
- **Limit:** 10 minutes maximum.

### 3.8 Saved data
- **localStorage keys:**

  | Key | Holds |
  |---|---|
  | `roboGroove.v4` | Current working state |
  | `roboGroove.library` | My Songs |
  | `roboGroove.projectName` | Name of the open song |
  | `roboGroove.viz` | Lights setting |
  | `roboGroove.mute` | Mute setting |

- **Older keys:** `v3`, `v2` and `v1` are migrated automatically. Old loop numbers are remapped, and old drum names become genres.
- **Project file** (`.robogroove`, JSON):
  ```json
  {"app":"RoboGroove","version":5,"name":"…","bpm":120,"skin":"A","mode":"song|loop",
   "sections":[{"bars":4,"mood":"happy","head":[8],"arm":[8],"leg":[8],"rev":[8 bools],"dly":[8 bools],
                "drums":{"g":"pop","v":0},"bongos":null,"keys":{"g":"pop","v":0},"guitar":null,"winds":null}],
   "cur":0,"cursor":0,"loop":{"a":0,"b":4}}
  ```
  `g` = genre id and `v` = loop number 0–7. Moves are ids from `BLOCKS` in app.js. `cleanSection()` validates everything on load.
- **Storage is per website address.** Moving the app to a different domain starts with an empty song list.

### 3.9 Visualizer
- **Drawing:** a canvas behind the characters, using `AnalyserNode` frequency and waveform data. Kicks from the drum track (`viz.kick()`) give a sharp beat.
- **Performance:** the pixel ratio is capped at 1.5. There are no blur filters (per the style guide); glows use radial gradients and additive blending. All 20 styles measured about 60 fps in desktop Chrome. **Not yet measured on the tablet.**
- **Styles:** Bars, Mirror, Scope, Ring, Tunnel, Warp, Plasma, Flower, Mountains, Lava, Kaleido, Lasers, Fireworks, LEDs, Galaxy, Dream, Bubbles, Sunburst, Ribbons, Disco.

### 3.10 Art pipeline (NerdHomies style guide)
- **Script:** `art/rg_art.py` writes every character as inline SVG with named groups, which the code animates by class. It also writes a contact sheet; **screenshot and check it after every art change.**
- **Style applied:**
  - ink color `#231B33`, round joins
  - a soft shine on each shape, plus extra soft shading for depth (Alex asked for "as 3D as possible")
  - radial ground shadows and pink cheeks
  - Fredoka for headings, Figtree for body text
  - cream ink-bordered cards, pill buttons and "ledge" buttons
- **Classes and attributes the code relies on (don't rename):**
  - **Robot:** `mover`, `rig`, `head`, `eyes`, `armL/armR`, `legL/legR` (Robot A) or `legs` (Robot B), `light`, `pl`, `antenna`, `antGlow`
  - **Bear:** `bHead`, `bArmL/R`, `kick/snare/hat/crash/tom` with `data-hit`
  - **Fairy:** `fHead`, `fHandL/R`, `wings`, `fairyFloat`, keys `.pk` with `data-midi` (C4–B5), `sparkles`
  - **Turtle:** `tHead`, `tArmL/R`, `bongoHi/bongoLo` with `data-hit="hi|lo"`, `shell`
  - **Unicorn:** `uHead`, `uStrum`, `guitar` with `.tapg`, `horn`, `tail`
  - **Fox:** `foxHead`, `foxHat`, `flute` with `.tapf`, `fhole`, `foxNotes`, `foxTail`
  - **Title sign:** `#title` with `.bulb.b0/b1/b2`; `data-phase` drives the chase
- **Robot shape-move paths** (heart, square, circle, snake) are added by `installShapes()` in app.js.

---

## 4. Platforms

### Android (Capacitor 8)
- **Packages:** `@capacitor/core|cli|android` 8.5.3, `@capacitor/filesystem` 8.1.5, `@capacitor/share` 8.0.3. App id `com.nerdhomies.robogroove`; name "Robo Groove"; v1.1 (versionCode 2).
- **SDK and tools:** compile/target SDK 36, minSdk 24, **JDK 21**, Android Gradle Plugin 8.13.
- **Customizations made in the Android project** (all in the zip):
  - `AndroidManifest.xml`: `screenOrientation="sensorLandscape"`, `resizeableActivity=false`, `requestLegacyExternalStorage`, storage permissions for old Android versions (≤29 and ≤32)
  - `MainActivity.java`: immersive full screen (system bars hidden; swipe to show them) and keep-screen-on
  - generated launcher icons (adaptive), purple splash screens, and theme colors
- **Build:**
  ```
  unzip tools/android-capacitor-project.zip -d robo-groove-android && cd robo-groove-android
  npm install
  copy the built index.html (+ icon.png) into www/
  npx cap sync android
  cd android && ./gradlew assembleDebug        # -> app/build/outputs/apk/debug/app-debug.apk
  ```
- **The APK is debug-signed.** It's fine for installing yourself; Play Protect shows an "unknown developer" warning, and the answer is "Install anyway". **Publishing to the Play Store needs a release keystore and an AAB.**
- **Build-environment note:** during development, Maven Central downloads failed at random in the cloud build environment. That was worked around with a local retrying mirror, kept as `tools/maven-retry-mirror.py`. The zipped project has **standard** `google()` / `mavenCentral()` repositories, so a normal machine needs no workaround.
- **Android save path:** the Filesystem and Share plugins are reached through `window.capacitorExports.registerPlugin`, because `capacitor-core.js` is bundled into the HTML. This path was tested with a simulated bridge, **not yet on a real device**.

### iPad / iPhone (Home Screen web app)
- **Hosting:** the same `index.html` plus `icon.png` on GitHub Pages (Alex's `robo-groove` repo). In Safari: Share → Add to Home Screen; it opens full screen.
- **iPad-specific code:**
  - meta tags for Home Screen mode, and an `apple-touch-icon`
  - `navigator.audioSession.type = "playback"`, so sound plays with the silent switch on (iPadOS 17+)
  - song saving through the share sheet
- **Updating:** upload the new `index.html` to the repo, then fully close and reopen the Home Screen app.
- **A native iOS build is not done.** It needs a Mac with Xcode; a paid Apple Developer account is needed for TestFlight or the App Store. See the backlog.

### Desktop and web
- Open `robo-groove.html` in Chrome, Edge or Firefox. A prompt for adding it to Alex's GitHub Pages site (Apps section) is in `robo-groove-claude-code-prompt.md`; it covers hosting at `apps/robo-groove/`, the card, and keeping formatters away from the file.

---

## 5. How to change things

- **Code or UI:** edit the files in `source/` → `python build.py` → test `www/index.html`.
- **Art:**
  1. Edit `art/rg_art.py` → `python art/rg_art.py`. This rewrites `stage.html`, `art/sheet.html` and `art/svg/`.
  2. **Screenshot the contact sheet and look at it.**
  3. Rebuild.
- **Samples:**
  1. `git clone --filter=blob:none --no-checkout https://github.com/sgossner/VCSL.git source/samples/vcsl` (or set `VCSL_GIT`).
  2. Edit the instrument lists in `build_samples.py` → `python build_samples.py`. Needs `ffmpeg`, `curl` and `numpy`; downloads go to `samples/raw/`.
  3. Rebuild. **Then re-measure loudness.**
- **New loops or genres:**
  1. Add data to `DRUMS` / `KITS` / `KEYS` / `GTRS` / `WINDS` / `BONGOS` (and `GENRES`).
  2. Re-measure loudness: render each loop offline with `setupAudio(new OfflineAudioContext(…))`, then `await ensureSamples(setsFor(...))`, then `playInst(...)` for 64 sixteenths. Take the RMS and compute `trim = target / rms`. Script: `lv4.py` in `tools/test-scripts.zip`.
  3. Write the results to `trim.json` and rebuild.
- **Tests** (`tools/test-scripts.zip`, Playwright for Python + Chromium). The paths inside point at the original build machine, so edit them first.

  | Script | Covers |
  |---|---|
  | `ui3.py` | Tempo, moods, sections, ruler and loop range, persistence, visual timing lag |
  | `exp.py` | MP3 and WAV export (check the output with `ffprobe`) |
  | `native.py` | Android save and share path with a simulated Capacitor bridge |
  | `v5.py` | Touch instruments, mini piano, lights menu, My Songs, bar options, project-file round trip |
  | `vizshots.py` | Screenshots and fps for all 20 light shows |
  | `lv4.py` | Loudness of every loop for one instrument |
  | `mix.py` | Full-band clipping check |
  | `demo.py` | Renders a demo song |

---

## 6. Testing status

**Done, in desktop Chromium (headless Playwright):**

- no JavaScript errors anywhere
- all 560 loops render, none silent, levels balanced
- full-band mixes don't clip
- beat-to-animation sync about 9–20 ms
- Song and Loop modes, the ruler, and the loop range wrapping correctly
- saved-state reload and migration from older saves
- MP3 and WAV export verified with ffprobe: 44.1 kHz stereo, −1 dBFS peak
- the Android save path, with a simulated bridge
- project files: save, new, reopen
- all 20 light shows at about 60 fps
- the APK contents: manifest, orientation, the latest `index.html` inside

**Not yet tested on real devices** (Alex was going to test; no results recorded in this project yet):

- [ ] Android tablet: install, sound on the speakers, timing, light-show smoothness, saving to Documents, Share
- [ ] iPad: Home Screen mode, sound, the silent switch, Save to Files, first-load time (8 MB)
- [ ] Memory use on the tablet with many instruments loaded
- [ ] Safari-specific behavior: `outputLatency` support, the AnalyserNode, Web Share with files

---

## 7. Known limitations and gotchas

- **Size:** about 8 MB because of the audio, which means a few seconds to load the first time on the iPad. A service worker for offline caching was offered but **not built**; the iPad version needs Wi-Fi at launch.
- **Landscape only.** In portrait the app shows a "turn sideways" prompt. The NerdHomies guide asks for portrait support too; this is an intentional deviation.
- **Style-guide deviations (agreed with Alex):**
  - **Recorded audio files instead of sound made in code.** Alex chose real samples. If the app goes on the NerdHomies Arcade, this needs an exception.
  - **No levels, stars or 2-player mode.** It's a music toy.
- **The kick drum is always synthesized,** because VCSL has no drum-kit kick. A CC0 kit kick would be a quick upgrade.
- **Sample gaps:** no timpani (dropped), the contrabass is missing its top note, and there is a single velocity layer with no round-robin except claps and bongos.
- **Sustain length:** sustained samples are cut at 2–3 s with no loop points, so very long notes at slow tempos stop early. Pads stay synthesized, partly for this reason.
- **localStorage** is limited to about 5 MB per site. My Songs warns if it's full; there's no cloud sync.
- **Export** is capped at 10 minutes, a memory guard.
- **The APK is debug-signed** (see §4).
- **The 7.5 KB `icon.png` in this folder** differs from the build's icon (see §1).
- **Long base64 strings:** don't run formatters or minifiers on the built HTML. The website prompt also warns about this.

---

## 8. Version history

| Date | Version | What changed |
|---|---|---|
| 16 Oct | **v0** | Reviewed the PRD (HTML first, then Android, landscape tablet). First single-file game: 8-step track, 6 head and 2 arm moves, 4 beats, a Web Audio lookahead scheduler (fixed the "doesn't follow the beat" problem), drag and tap, localStorage. |
| 16 Oct | **Stop 1** | Added the teddy bear (drums), fairy (keys) and unicorn (guitar); tabs; the robot's Head, Arms and Legs lanes; 5 shape arm moves with matching waveforms; 4 leg moves. |
| 16 Oct | **Stop 2** | 12 genres × 4 loops for drums, keys and guitar, all in one shared key; reverb and echo ticks for each beat; sections of 2–32 bars with a Loop/Song switch; loudness matching. Design choices (asked): repeating patterns per section, effect ticks per beat, two checkpoints. |
| 16 Oct | **Beta** | Feedback: the genres all sounded the same, there were too few loops, and tempo should be changeable. Rebuilt the sound: 14 genres (added Jazz and Space), a distinct kit for each genre, 8 loops each, swing, EDM ducking, moods (chord progressions), tempo 60–180, the song ruler with start point and loop range. |
| 16 Oct | **v1.0** | Mister Sly the fox and the Winds tab; WAV and MP3 export; **first Android APK** (Capacitor); iPad Home Screen web app (icon, meta tags, the silent-switch fix). |
| 16 Oct | | Sound-quality discussion: three options (better synthesis / real samples / recorded loops). Chose **synthesis plus real samples**, free libraries only, because the app stays free on NerdHomies. |
| 16 Oct | **v1.1** | Real-instrument sampler (VCSL + FluidR3), stereo layout, human feel and a new reverb; **Mr. Slow** and the bongos; touch-to-play; the mini piano; 20 light shows; a full art redo to the NerdHomies style guide; the marquee bow-tie sign; My Songs and `.robogroove` files; bars 1/2/3/4/8/12/16/24 (32 removed); mute; credits; APK v1.1. |
| 18 Oct | | Uploaded `robo-groove.html` to the FTP server at `/NerdHomies/`. |
| 24 Oct | | Wrote the Claude Code prompt and made the cover art for adding the app to Alex's GitHub Pages site (Apps section). |
| 13 Nov | | This handoff package. |

---

## 9. Credits and licenses
- **Instrument samples:** Versilian Community Sample Library (VCSL), Versilian Studios, **CC0**. FluidR3 GM SoundFont by Frank Wen, **MIT** (via midi-js-soundfonts).
- **MP3 encoder:** lamejs, **LGPL**.
- **Capacitor:** **MIT**.
- **Fonts:** Fredoka and Figtree, **SIL Open Font License**.
- **Characters, art, music data and code:** original to this project, made for NerdHomies. No third-party names, art or sounds are used.

All of the above fits a free app. The in-app ℹ️ Credits screen lists them.
