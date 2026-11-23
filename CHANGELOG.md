# Changelog

Versions follow `MAJOR.MINOR.PATCH`. A fix is a patch (1.1.0 → 1.1.1); new features are a minor version.

## [1.2.0]: 2026-11-22, free edition (save and export removed)

- **Free edition split out.** The itch.io build no longer has in-app Save, My Songs, `.robogroove`
  save/open, or MP3/WAV export. That code (`export.js`, the save half of `projects.js`, the `lamejs` MP3
  encoder) is left out of the build entirely, not gated at runtime. It moves to the forthcoming premium
  edition (see `PREMIUM-PLAN.md`).
- **Kept in the free edition:** all 14 styles and real-instrument samples, the Lights menu, Mute, Credits,
  and session auto-remember of the current in-progress song.
- **Build:** `build.py --edition=free` produces the free web build (`source/www-free/`). The itch.io zip is
  assembled from `itch-free/` (`index.html`, `icon.png`, `LICENSE.txt`, `CREDITS.txt`) and published from the
  Publishing folder.

**Known issue:** small-screen scaling (carried over from 1.1.x) is still to be addressed.

## [1.1.1]: 2026-11-21, itch.io build in the repo

- **itch.io:** the build live at https://doodledance.itch.io/robo-groove (Doodle Dance) is now kept in `itch/`:
  `index.html`, `icon.png`, `LICENSE.txt` and `CREDITS.txt`. The itch.io zip is built from this folder.
- **License:** `LICENSE.txt` placeholder replaced: all rights reserved, public for viewing and learning, playing and
  personal installs welcome.
- **Web (GitHub Pages) is unchanged.** The `itch/` build has no offline or install support; the site root keeps it.

**Known issue:** on small screens such as phones, the layout doesn't scale properly. A fix is planned for 1.1.2.

## [1.1.0]: 2026-11-18, first tagged release

The app is the same as the version that has been live since 25 Oct 2026. This release makes the repository the master copy.

- **Source code published** in `source/`, with the Android project in `android/`, docs in `docs/` and tests in `tests/`.
- **Signed Android APK** (release key, versionCode 3) attached to the GitHub Release. It replaces the earlier debug-signed APK. Android won't upgrade the old debug build to this one, so uninstall the old one first. Songs saved inside the old app stay with the old app; export them as `.robogroove` files before uninstalling.
- **Web:** the page description and the install manifest now describe the app correctly.
- **Build:** `build.py` now produces byte-identical output on Windows and adds the offline files. `--publish` copies the build to the site root; `--android` builds the Android web folder.

**Known issue:** on small screens such as phones, the layout doesn't scale properly. A fix is planned for 1.1.1.

## 1.1 (untagged): 2026-10-25
- Offline support (service worker) and an install manifest on GitHub Pages.

## 1.1 (untagged): 2026-10-16/17
- Real-instrument sampler, Mr. Slow the turtle and the bongos, touch-to-play, mini piano, 20 light shows, art redone to the NerdHomies style guide, My Songs and `.robogroove` files. First upload to GitHub Pages.

## 1.0 and earlier: 2026-10-16
- See `docs/HANDOFF.md` §8 for the full history.
