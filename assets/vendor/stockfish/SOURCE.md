Stockfish.js 10.0.2 — distribution and source information
=========================================================

Engine: Stockfish 10, multi-variant build, compiled to WebAssembly/asm.js by Niklas Fiekas.
Package: stockfish.js 10.0.2
License: GNU General Public License, version 3 (GPL-3.0).
License text: ./COPYING.txt
Package source: https://github.com/niklasf/stockfish.js
Upstream engine: https://github.com/official-stockfish/Stockfish

Vendored files:
- stockfish.wasm.js (single-threaded Web Worker/WASM loader)
- stockfish.wasm (WASM payload)
- stockfish.js (asm.js fallback, single-threaded Web Worker)
- COPYING.txt
- README.md (package usage notes)

The engine is loaded only as a separate Web Worker. It communicates with the
game through UCI text commands. The game does not modify the engine source.
The WebAssembly build is preferred; the asm.js build is a compatibility
fallback. The Stockfish worker in this package is single-threaded, uses a
32 MB memory limit, and has Syzygy tablebases and benchmark disabled as
documented by the package.

Difficulty mapping used by Royal Wood 3D Chess:
- Easy: Skill Level 0, depth 2, ~160 ms budget.
- Medium: Skill Level 8, depth 6, ~480 ms budget.
- Hard: Skill Level 20, depth 14, ~1500 ms budget.

The game code is separate from the GPL engine. A recipient of this build may
obtain the corresponding engine source from the upstream links above and the
package version noted here.
