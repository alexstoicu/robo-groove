# Robo Groove

**A music toy for kids aged 4 to 12.** Kids build songs with a cartoon band and make a robot dance exactly on the beat.

▶ **Play it in your browser:** https://alexstoicu.github.io/robo-groove/
📦 **Android APK and release notes:** [Releases](https://github.com/alexstoicu/robo-groove/releases)

Best on a tablet or computer, held sideways. Free, no ads, no account. Songs stay on your device.

## What's in it

- **The band:** a teddy bear on drums, a fairy on keys, Mr. Slow the turtle on bongos, a unicorn on guitar, Mister Sly the fox on flute, and a dancing robot in the middle.
- **14 music styles:** Pop, Disco, EDM, Lo-fi, Adventure, Rock, Metal, Hip-Hop, Funk, Reggae, Latin, Country, Jazz and Space. Each band member has 8 loops per style.
- **Real instruments:** recorded samples from free libraries, mixed with synthesizers.
- **Moods** change the chords, so any mix of loops stays in tune.
- **Build a song** from up to 12 sections. Adjust the tempo, and add reverb and echo per beat.
- **Tap to play:** tap any instrument, including a two-octave mini piano.
- **20 light shows** that react to the music.
- **Save your work:** keep songs in the app, export MP3 or WAV, or save `.robogroove` project files.

## Install it

| Device | How |
|---|---|
| iPad / iPhone | Open the link in Safari, then Share → **Add to Home Screen**. It works offline after the first load. |
| Android (web) | Open the link in Chrome, then menu → **Install app** / **Add to Home screen**. |
| Android (app) | Download the APK from [Releases](https://github.com/alexstoicu/robo-groove/releases), open it, and allow the install. |
| Computer | Open the link in Chrome, Edge, Firefox or Safari. |

It's an 8 MB download the first time, because the instrument sounds are inside the app.

## Known issues

- On small screens such as phones, the layout doesn't scale properly yet. A fix is planned for v1.1.1.

## Repository layout

| Folder | What |
|---|---|
| `/` (root) | The published web app, served by GitHub Pages: `index.html`, `manifest.json`, `sw.js` (offline support) and icons. **These files are built output. Don't edit them by hand.** |
| `source/` | All source code, art scripts and the sample library. `python build.py` builds into `source/www/`; add `--publish` to copy the build to the root. |
| `android/` | The Android (Capacitor 8) project. The web files are copied in at build time. |
| `docs/` | `HANDOFF.md` (full technical guide), `IDEAS-AND-BACKLOG.md`, the original product spec and cover art. |
| `tests/` | Playwright test scripts used during development. Edit the paths inside before running them. |

See [CHANGELOG.md](CHANGELOG.md) for versions, and [docs/HANDOFF.md](docs/HANDOFF.md) for how everything works.

## License

Copyright © 2026 Alex Stoicu. **All rights reserved.** The source is public so people can see how the app is made. It isn't open-source licensed: please don't copy, redistribute or sell it without permission. Third-party parts keep their own licenses; see [LICENSE.md](LICENSE.md).
