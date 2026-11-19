# Robo Groove: Ideas and Backlog

Everything that was floated during the project, what was decided, and what's still open. Read it together with `HANDOFF.md`, which describes the current state.

Status key: ✅ built · 🔁 built differently than first floated · ❌ considered and decided against (with the reason) · 💡 open idea, not started · ⏳ waiting on someone

---

## 1. Waiting on someone

- ⏳ **Real-device testing of v1.1** on the Android tablet and the iPad. Things to check:
  - sound on the tablet speakers
  - beat sync at fast tempos
  - light-show smoothness
  - saving MP3s to Files and Documents
  - My Songs surviving an app restart
  - iPad first-load time
  - whether the buttons are big enough for a 4-year-old
- ⏳ **Adding the app to Alex's GitHub Pages site** (Apps section). The prompt is ready (`robo-groove-claude-code-prompt.md`); it wasn't recorded whether it was run.
- ⏳ **Which `icon.png` to use:** the 7.5 KB one in this folder, or the 1.7 KB generated one.

## 2. Ideas discussed, with the decision

### Sound
- 🔁 **"Make it sound less like MIDI."** Three options were laid out:
  1. **Better synthesis.** Partly used: stereo, human feel, reverb, synth sounds kept for EDM and Space.
  2. **Real recorded samples.** ✅ Chosen, mixed with option 1, using free libraries only (VCSL CC0 + FluidR3 MIT).
  3. **Pre-recorded loops for each genre.** ❌ Rejected: moods couldn't change chords, tempo changes would smear the sound, and it would need thousands of clips.
- ✅ Every genre gets its own drum kit; 8 loops for each genre and band member; swing; EDM pump.
- ✅ **Moods** (chord progressions for each section), added so genres and sections actually sound different. All band members follow the section's mood, so any mix stays in tune.
- 🔁 **Tempo:** asked for adjustable tempo → ✅ one tempo for the whole song (60–180) plus "match the genre speed". 💡 A **different tempo for each section** is not built.
- 💡 **Genre-only key changes / transposing:** everything is in one key family now. A key or transpose control for each section would add variety.
- 💡 **Better samples:**
  - a real kit **kick** drum (CC0)
  - more velocity layers and round-robin for drums, piano and guitar
  - **loop points** so sustained instruments (strings, organ, winds) can hold longer than 2–3 s
  - timpani that works (it was dropped because its pitch detection was unreliable)
  - a top note for the contrabass
- 💡 **Smaller download:** Opus or AAC instead of MP3 (check Safari support), or loading samples as separate cached files instead of embedded base64.

### Song building
- ✅ Sections whose pattern repeats (chosen over editing every bar, which is too busy for little kids). ❌ **Every-bar-editable sections:** offered and declined.
- ✅ Per-beat reverb/echo ticks (chosen). 💡 **Per-instrument effects in each section**, the alternative offered at the time, is not built.
- ✅ Section lengths are now 1, 2, 3, 4, 8, 12, 16 and 24 bars (32 removed on request).
- ✅ Song ruler: tap to start, drag to loop. ✅ Loop part / Song switch.
- ✅ Project files to "go back and edit the song before exporting" (My Songs + `.robogroove` files).
- 💡 Drag-to-reorder sections (today you use the ◀ ▶ buttons on a section).
- 💡 Undo / redo.
- 💡 A song that **stops at the end** instead of looping (it loops back to the start today).

### Characters and visuals
- ✅ The band, in order: bear (drums), fairy (keys), Mr. Slow the turtle (bongos), robot (centre), unicorn (guitar), Mister Sly the fox (winds, far right).
- ✅ Touch-to-play: each instrument, the mini piano, the robot's antenna.
- ✅ 20 light shows (Alex asked for 12–20) with random, repeat-one and off.
- ✅ Art redone to the NerdHomies style guide, with shading for a "3D as possible" cartoon look. The broken bits were fixed: the guitar neck now joins the body, and the fox's vest is a proper shape.
- ✅ The title is a light-bulb marquee with a bow-tie bottom edge, like the DOOM logo.
- 💡 More robot moves (spins, splits, moonwalk, "freeze"); dance moves for the bandmates driven by the genre.
- 💡 Light-show ideas: hand-picked styles for each genre; a "dance floor" light-up floor; a beat-synced camera zoom.
- 💡 More robot skins, and costumes or hats for the band.
- 💡 Make sure the cover art uses the embedded Fredoka font. `robo-groove-cover.svg` falls back to system fonts outside the app.

### Platforms and distribution
- ✅ Android APK (Capacitor, landscape, full screen, keep awake, saves to Documents).
- ✅ iPad as a Home Screen web app via GitHub Pages.
- 💡 **Offline support for the iPad / web version** (a service worker). Offered, not built; today the iPad needs Wi-Fi at launch.
- 💡 **Native iOS app:** the same Capacitor project. Needs a Mac with Xcode; a free Apple ID works but the install expires every 7 days; a paid developer account ($99/yr) allows TestFlight and the App Store. It was discussed; Alex chose the web-app route for now.
- 💡 **Play Store release:** release keystore, signed AAB, store listing, kids/families policy review.
- 💡 **NerdHomies Arcade listing:** the style guide asks for:
  - a slug
  - a 320×180 cover at `public_html/img/games/<slug>.svg`
  - a `portal.php` entry (title, pitch, tags such as Music / Maker / Family / Sound, players, time, accent)

  It also needs an agreed exception for recorded audio and landscape-only.
- ⏳ / 💡 **Alex's website, Apps section:** see §1.

### Things the style guide expects that this app doesn't have yet
- 💡 **Portrait layout** (phones). Today it's landscape-only with a "turn sideways" prompt.
- 💡 **Pass-the-phone 2-player mode.** A possible version: "copy my beat": player 1 makes a 2-bar pattern, player 2 listens and rebuilds it, then they compare.
- 💡 **A hidden test hook** (`window.__rg = {…}`) for automated tests. The tests today call internal functions directly.
- 💡 The style guide's three phone test sizes (390×844, 360×740, 844×390). Only 1280×800 was tested.

### Possible extras (suggestions, not requested)
- 💡 **Record your voice** as a sample (microphone) and play it as an instrument.
- 💡 **Share a song as a link:** encode the project in the URL hash; no server needed.
- 💡 **Video export** of the band performing, using canvas plus audio recording.
- 💡 **Random song** button ("Surprise me!"), and starter templates for each genre.
- 💡 A parent/teacher settings screen: volume limit, hide export, lock tempo.
- 💡 Accessibility: larger-button mode, high-contrast lights, a reduced-motion option for the light shows.
- 💡 Haptics on touch-to-play (Android vibration).

## 3. Deliberately not done
- ❌ Using another product's name, art or sounds: everything is original.
- ❌ Recorded genre loops (see Sound).
- ❌ 32-bar sections (removed on request).
- ❌ Git LFS for the 8 MB file. It isn't needed under GitHub's limits.
