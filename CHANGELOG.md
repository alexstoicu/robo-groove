# Changelog

Versions follow `MAJOR.MINOR.PATCH`. A fix is a patch (1.1.0 → 1.1.1); new features are a minor version.

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
