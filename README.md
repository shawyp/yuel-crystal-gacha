# Yuel Crystal Gacha / 许愿球

Interactive crystal gacha with a white UI, a pixel-rendered 3D machine, original colorful crystal beads, and a bracelet workshop.

## Preview

Open `index.html` in a browser. All runtime resources are local; no build step or API key is required. Static hosting should publish this repository root.

## Features

- Touch-responsive 3D gacha machine with a non-WebGL fallback.
- Turn the knob, pop out a crystal, then reveal its keepsake card.
- 31 original crystals and 13 flowers.
- Choose 5 crystals and 1 flower to compose a bracelet on one page.
- Local collection and optional generated music.

## Xiaohongshu upload

Upload `releases/yuel-xhs-170-files.zip`. It contains 170 files with `index.html` at the archive root, below the platform's 200-file limit. Validate the same ZIP in the creator-platform simulator and on Android and iOS. Browser checks do not replace platform acceptance.

This is the current **offline mini-tool version**. Mood recommendations use preset examples; this repository does not include the separate live-AI backend, API credentials, Blender source files, old drafts or development caches.

Third-party Three.js copyright and MIT license notices are retained in `original-pot.js`. No additional reuse license is granted for the original artwork.
