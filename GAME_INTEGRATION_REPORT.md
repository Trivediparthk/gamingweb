# GAME_INTEGRATION_REPORT.md

> **Historical record:** this document records the original RPG Car Game integration (`nx-015`). The catalogue now has 19 games, including the authorised MadKidGames embed `nx-019`; see `COOKING_LOVE_CHEF_INTEGRATION.md` for the current third-party integration record.

## Summary
The licensed 3D off-road driving game **RPG Car Game** (original by Sam Wilson) is integrated into Robloxsplay as `nx-015` on the Racing shelf. The 14 existing Robloxsplay games and all site routes are unchanged and verified working. The build is fully self-hosted with no external network requests.

## Source and license
- Repository: https://github.com/rsamwilson2323-cloud/rpg-car-game
- Commit: `c20b70619cdfeae07a120c8eee49a8c0be51e2ff`
- License: MIT, preserved at `games/rpg-car-game/LICENSE`
- Author: Sam Wilson
- Upstream assets: no bundled models, textures, audio, or fonts were found. The empty `models/` folder and procedural fallback were retained.
- Full dependency attribution: `THIRD_PARTY_LICENSES.md`.

## Files added
- `games/rpg-car-game/index.html` - adapted self-hosted build (local paths, error overlay, touch controls)
- `games/rpg-car-game/LICENSE`, `games/rpg-car-game/README.md`
- `games/rpg-car-game/vendor/three/` - Three.js `0.183.1` WebGPU build (`three.webgpu.js`, `three.core.js`, `three.tsl.js`) plus the full `examples/jsm` tree and license
- `games/rpg-car-game/rapier.es.js` + `rapier_wasm3d_bg.wasm` - Rapier `0.14.0` runtime; `games/rpg-car-game/vendor/rapier/LICENSE` retains the Apache-2.0 text
- `games/rpg-car-game/vendor/stats-gl/` - stats-gl `2.4.2` plus MIT license text
- `games/rpg-car-game/vendor/draco/` - Draco `1.5.7` decoder JS/WASM plus Apache-2.0 license text
- `games/rpg-car-game/models/README.md` - upstream notes on optional GLB models (kept for attribution)
- `assets/images/games/rpg-car-game.svg` - original cover artwork
- `assets/images/placeholders/game-generic.svg` - original fallback cover
- `THIRD_PARTY_LICENSES.md`
- `GAME_INTEGRATION_REPORT.md`

## Files modified
- `assets/js/games-data.js` - added `nx-015` (`sourceType: "iframe"`, `embedUrl: "/games/rpg-car-game/index.html"`); all 14 original games remain `sourceType: "custom"`
- `assets/js/game-page.js` - iframe sizing class, autofocus, retry cleanup, self-hosted wording, reset loading/error state
- `assets/js/components.js` - thumbnail `onerror` fallback to the generic cover
- `assets/css/games.css` - `.game-stage > iframe` now fills the stage
- `sitemap.xml` - added `game.html?game=rpg-car-game` (correct `game` parameter)
- Count/copy updates to 15 games: `site-chrome.js`, `index.html`, `all-games.html`, `about.html`, `contact.html`, `404.html`
- `DELIVERY.md` - linked the licensed title and updated counts

## Integration details
- **Loading path:** the game is a standalone Three.js + Rapier + WASM app, so it uses the existing iframe path. The iframe fills `.game-stage` (16:10 on desktop, full-bleed in fullscreen).
- **Dependencies:** all CDN imports replaced with local `vendor/` copies. Runtime audit reports **zero external requests**.
- **Fonts:** the Google Fonts `@import` was removed; system fallbacks are used.
- **Renderer:** Three.js `WebGPURenderer` uses WebGPU when available and automatically falls back to its WebGL2 backend otherwise. Verified in headless Chromium (`WebGPU is not available, running under WebGL2 backend`) with correct rendering. If `navigator.gpu` is absent, a small non-blocking notice explains that WebGL2 compatibility mode is in use; it never blocks gameplay.
- **Physics:** Rapier initialises from local `rapier.es.js` and `rapier_wasm3d_bg.wasm`.
- **Models:** `models/chassis.glb` and `models/tire.glb` do not exist upstream. The game intentionally logs a warning and uses procedural shapes. These two 404s are expected, non-fatal, and are not hidden.
- **Error handling:** the game shows a visible error overlay with a Retry button on uncaught errors/rejections and a 30-second timeout if no canvas initialises. The site iframe also shows a loading state, a retry state, and cleans up the previous iframe before retrying.
- **Controls:** keyboard (WASD/arrows, Shift, Space, R, U, P, O) and a functional touch controller. The touch joystick maps to `KeyW/KeyS/KeyA/KeyD`; BOOST/BRAKE/JUMP map to `ShiftLeft/KeyS/Space`. Input is delivered as keyboard events, so the game's physics logic is untouched.
- **Responsive layout:** tested at 1440×900 and on an iPhone 13 profile; no horizontal overflow.

## Security review
- No external URLs, remote scripts, remote fonts, analytics, or tracking were found in the game or site source.
- No `eval`, `new Function`, `document.write`, `postMessage`, `localStorage`, or nested iframes in the game.
- The iframe is same-origin, self-hosted content. It is intentionally not sandboxed, because a restrictive sandbox would break module, WASM, and WebGPU startup; it is limited with `allow="fullscreen; autoplay; gamepad; pointer-lock"`.
- `referrerPolicy="strict-origin-when-cross-origin"` is set on the iframe.
- No secrets, keys, or credentials are present.
- The game receives no user input into `innerHTML`; the nine `innerHTML` uses are static settings-panel templates.

## Google AdSense / monetization readiness
- No ads, ad placeholders, ad scripts, or auto-ads were added. Nothing obstructs gameplay.
- The game is fully self-hosted and contains no copied third-party branding or assets with unclear rights.
- Privacy policy, terms, about, and contact pages already exist. No tracking or cookies are introduced by this integration.
- Remaining for AdSense: a real production domain, a real contact address, a legal review of the policy pages, an approved AdSense account, `ads.txt` once a publisher ID exists, and a consent management platform if personalised ads are used. Approval is not guaranteed and is not claimed.
- Do not insert ads over the game stage or between a click and gameplay start.

## Verification performed
Environment: local static server `http://127.0.0.1:8765`, Playwright-driven Chromium (desktop and iPhone 13 emulation). The site has no build step; it is served as static files. The integrated game folder is about 21.5 MB on disk, and only the imported modules are fetched at runtime.

| Check | Result |
| --- | --- |
| Catalog shows 15 game cards | PASS |
| No broken catalog thumbnails | PASS |
| RPG cover natural size | PASS (`1200×630`) |
| Game page title and metadata | PASS |
| iframe fills the stage (desktop) | PASS (`918×574` at 1440×900) |
| Game canvas initialises inside iframe | PASS (`918×574`) |
| Terrain and car render (non-black) | PASS (region avg brightness 132, 17% dark, 244 colours) |
| Keyboard driving | PASS (frame changed; iframe auto-focused) |
| Touch joystick driving | PASS (frame changed on iPhone 13 profile; knob moved) |
| Touch buttons present and clickable | PASS (no errors) |
| Fullscreen control | PASS (iframe expands from 918×574 to 1440×806; canvas follows) |
| Catalog badge | PASS (RPG card reads "Licensed title", others "Robloxsplay original") |
| Mobile layout (iPhone 13) | PASS (no horizontal overflow; touch UI shown) |
| External network requests | PASS (none) |
| Expected optional model 404s | chassis.glb / tire.glb only, procedural fallback used |
| All 14 original games start | PASS (14/14 canvases) |
| All static routes load | PASS (`index`, `all-games`, `about`, `contact`, `privacy-policy`, `terms`, `404`) |
| All 15 game pages resolve | PASS (no "game not found") |
| Category shelves | PASS (arcade 5, racing 2, runner 2) |
| Sitemap | PASS (15 game URLs, no stale `?slug=`) |
| Total automated checks | 26/26 PASS, 0 failures |

Not tested in this environment:
- Real WebGPU hardware acceleration (headless used the WebGL2 fallback).
- Physical mobile devices and gamepads.
- Real AdSense integration (no account was supplied).

## Known limitations
- WebGPU is preferred; the WebGL2 fallback is provided by Three.js and was verified.
- Two optional GLB models are absent upstream, so procedural vehicle shapes are used.
- 3D rendering can be heavy on low-end devices; the game uses `setPixelRatio(Math.min(devicePixelRatio, 2))` to limit cost.
- Touch controls are functional but basic; keyboard is recommended on desktop.

## Remaining blockers / owner actions
1. Replace the placeholder domain (`your-domain.example`) with the production domain in canonical, Open Graph, JSON-LD, and sitemap tags.
2. Replace the placeholder contact email and complete legal review of the policy pages.
3. Verify on a real WebGPU device and at least one physical phone.
4. If ads are approved: add `ads.txt`, a consent platform if required, and keep ads out of the play area.
5. Optional: add the two upstream GLB models if the author publishes them.
