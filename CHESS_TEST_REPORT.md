# CHESS_TEST_REPORT.md

## Delivered

**Royal Wood 3D Chess** is the 18th game in the Robloxsplay catalogue (`nx-018`), the 17th in-house original and the second **Board** title. It is a complete Three.js game using local chess.js rules, a local Stockfish.js Web Worker, carved procedural 3D pieces, three switchable 3D rooms, camera orbit/zoom, mouse/touch play and the existing GameShell.

- Route: `/game.html?game=royal-wood-3d-chess`
- Module: `assets/js/custom-games/royal-wood-chess.js`
- Pieces/board: `assets/js/custom-games/chess/pieces.js`
- Environments: `assets/js/custom-games/chess/environments.js`
- Engine worker: `assets/js/custom-games/chess/engine.js`
- Styles: `assets/css/royal-wood-chess.css`
- Cover: `assets/images/games/royal-wood-3d-chess.png`

## Features implemented

- 32 pieces on an 8×8 maple/walnut board. Each colour has 8 pawns, 2 knights, 2 bishops, 2 rooks, 1 queen and 1 king; the scene reports **252 piece meshes** across the 32 groups.
- Carved King cross, Queen crown, Bishop mitre/slit, Knight horse-head profile with mane/eyes/nostrils, Rook crenellated tower and turned Pawn profile. All use procedural lathe/extrude/bevel geometry and local PBR wood maps.
- Player vs Computer with White/Black side choice, and local two-player.
- Stockfish AI with three genuinely different settings:
  - Easy — Skill Level 0, depth 2, 160 ms.
  - Medium — Skill Level 8, depth 6, 480 ms.
  - Hard — Skill Level 20, depth 14, 1500 ms.
- Full chess rules through chess.js: legal movement, check/checkmate, stalemate, kingside/queenside castling, en passant, promotion choice (Queen/Rook/Bishop/Knight), threefold repetition, fifty-move rule, insufficient material, resignation and restart.
- Move animation with lift/landing, captured-piece exit animation, last-move/hover/selected/check highlights, legal-move rings/dots, promotion dialog, SAN history, captured-piece display and result modal.
- Camera orbit and zoom through OrbitControls with damping; camera reset and immediate side-view flip; background-specific lighting and 3D room/forest groups.
- Three actual 3D environments: Wooden Study, Forest Nature and Dark Royal Room. Switching changes visible geometry, lights, fog, background and exposure, not just a CSS colour.
- Responsive glass/gold UI; mobile touch selection/drag; mute; error/loading state; engine preparation state.

## Test record

All tests used Playwright Chromium against the local HTTP server, plus the isolated Stockfish worker page.

### Rules
- Castling kingside: FEN `r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1`, `e1g1` passed; king on g1, rook on f1.
- En passant: FEN with `d6` target, `e5d6` passed; the captured pawn was removed.
- Promotion: promotion dialog opened; choosing Knight produced `a1=N` with a black knight mesh on a1.
- Checkmate: `Qg7#` produced result `Checkmate`, winner white.
- Stalemate: `Qg6` produced result `Stalemate`, winner draw.
- Fifty-move: halfmove clock 99 + `Ra2` produced `Fifty-move rule` draw.
- Insufficient material: bare kings + `Ke2` produced `Insufficient material` draw.
- Threefold repetition: `Nf3 Nf6 Ng1 Ng8` twice produced `Threefold repetition` draw.
- Check: state reports `inCheck`; king highlight is wired through the same check state.

### Interaction
- Click source + click target: e2→e4 passed.
- Drag source → target: e7→e5 passed.
- Orbit by dragging empty space: camera position changed.
- Legal markers, selected square, last move and check highlight code paths exercised in the rendered scene.
- Undo local: e4 removed, history empty, all 32 pieces restored.
- Undo vs computer after the AI reply: e4/e5 removed, history empty, all 32 pieces restored.
- Resign: confirmation dialog + result modal produced the correct winner and reason.

### AI
- Stockfish WASM loaded in-browser as a Web Worker. The first computer start pauses the renderer behind a “Preparing Stockfish” state so the worker can initialise.
- Easy returned depth 2 (`e4 d5` in test), Medium depth 6 (`e4 Nc6`), Hard depth 14 (`e4 e5`).
- Playing as Black: CPU (White) opened, turn returned to the human as Black.
- Every returned engine move was validated with chess.js before being applied.

### Backgrounds, rendering, mobile
- Background group visibility toggles correctly: Study on → Study visible; Forest on → only Forest visible; Royal on → only Royal visible.
- No console/page errors or failed requests in the chess tests.
- Desktop (1440×1100), tablet (820×1180), mobile (390×844) and 320 px layouts checked; no horizontal overflow. Mobile game stage measured 348×496 at 390 px; the actual board, HUD and bottom controls fit.
- Responsive start setup, in-game HUD, history drawer, promotion and result modal inspected.

## Known limitations

- **Visual fidelity:** the pieces and rooms are polished procedural/stylized 3D, not photoreal scanned or commissioned assets. The Forest room in particular reads as a stylized forest rather than a photographic forest. A photoreal brief would need a higher-detail licensed chess set and environment assets.
- **Stockfish version:** Stockfish.js 10.0.2 (2019 engine build) is used. It is strong but not the latest Stockfish. WASM is preferred; asm.js is the compatibility fallback. The GPL-3.0 source and licence records are in `assets/vendor/stockfish/`.
- **Camera flip:** orbit/zoom are smoothly damped; the “flip side” action repositions the camera immediately rather than performing a scored animation. This keeps the side view reliable.
- **Captured pieces:** shown in the HUD/history drawer, not as separate 3D trays on the table.
- No game clock, draw offers, online multiplayer or 3D captured-piece trays.
- No physical iPhone/Android or real-GPU benchmark was available; headless software WebGL was used for automated tests.

## Files changed/added

- `assets/js/custom-games/royal-wood-chess.js`
- `assets/js/custom-games/chess/pieces.js`
- `assets/js/custom-games/chess/environments.js`
- `assets/js/custom-games/chess/engine.js`
- `assets/js/custom-games/chess/audio.js`
- `assets/css/royal-wood-chess.css`
- `assets/vendor/chess/chess.js`, `assets/vendor/chess/LICENSE`
- `assets/vendor/stockfish/stockfish.wasm.js`, `stockfish.wasm`, `stockfish.js`, `COPYING.txt`, `README.md`, `SOURCE.md`
- `assets/vendor/three/jsm/controls/OrbitControls.js`
- `assets/vendor/three/jsm/environments/RoomEnvironment.js`
- `assets/games/royal-wood-chess/wood/*` and `LICENSE.txt`
- `assets/images/games/royal-wood-3d-chess.png`
- `game.html`, `assets/js/game-page.js` (existing DOM changes already present)
- `assets/js/games-data.js`
- `index.html`, `all-games.html`, `about.html`, `contact.html`, `assets/js/site-chrome.js`, `sitemap.xml`
- `THIRD_PARTY_LICENSES.md`, `LICENSING-AUDIT.md`, `DELIVERY.md`, `CHESS_TEST_REPORT.md`
