# THIRD_PARTY_LICENSES.md

This document records the third-party software, fonts, and assets used by Robloxsplay, with their licenses and where the license texts are stored. It is provided for attribution and compliance.

## Integrated game: RPG Car Game (`nx-015`)

- **Project:** rpg-car-game
- **Author:** Sam Wilson (`rsamwilson2323-cloud`)
- **Source:** https://github.com/rsamwilson2323-cloud/rpg-car-game
- **Commit:** `c20b70619cdfeae07a120c8eee49a8c0be51e2ff`
- **License:** MIT
- **License text:** `games/rpg-car-game/LICENSE` (preserved unchanged)
- **Assets:** The upstream repository contains no bundled car models, textures, audio, music, or font files. `models/` is empty, and the game uses procedural geometry as its fallback. No third-party art or audio was imported from the repository.

Modifications made for this integration: local import paths, removal of the Google Fonts `@import`, a local Draco decoder path, a WebGPU/WebGL2 status notice, an error overlay with retry, and optional touch controls. No gameplay code, physics logic, or vehicle behaviour was replaced.

## Site-wide 3D runtime

The five upgraded Robloxsplay games — **Orbit Pong 3D, Prism Breaker 3D, Meteor Defender 3D, Grid Runner 3D and Target Tap 3D** — use Three.js `0.183.1` with `WebGLRenderer`.

- **License:** MIT, copyright the three.js authors.
- **License text:** `assets/vendor/three/LICENSE`.
- **Vendored:** `assets/vendor/three/three.module.js` and `assets/vendor/three/three.core.js` (local, no CDN).
- **Assets:** the five upgraded games generate their meshes, materials, lights, particles, characters and effects procedurally in original code. Ruin Runner 3D combines original game/scene code with the CC0 GLTF/PBR/HDRI assets documented below. No copyrighted game assets are shipped.
- **Thumbnails:** the 3D card images are screenshots of the implemented games in this project; the Ruin Runner 3D logo is an original SVG.

## Ruin Runner 3D CC0 asset pack (`nx-016`)

Ruin Runner 3D is an original 3D endless runner. Its character, environment props, textures and HDRI are locally served third-party CC0 assets. The endless causeway, lane runes, tunnel shell, gate framing, sky, moon, effects, UI and all gameplay code are original work for this project.

- **RobotExpressive character** — model by Tomás Laulhé (Quaternius), modifications by Don McCurdy. **CC0 1.0**. Source: https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive. Local: `assets/games/ruin-runner/characters/robot-expressive.glb`; notes: `characters/ROBOT_LICENSE_NOTES.md`. Built-in animations used: `Idle`, `Running`, `Jump`, `Sitting`, `Death`.
- **KayKit Forest Nature Pack (1.0)** — Kay Lousberg, **CC0 1.0**. Official KayKit pack download; license text: `assets/games/ruin-runner/forest/LICENSE.txt`. Used for tree, bush, rock and grass GLTF models.
- **KayKit Dungeon Remastered (1.0)** — Kay Lousberg, **CC0 1.0**. Official KayKit pack download; license text: `assets/games/ruin-runner/dungeon/LICENSE.txt`. Used for pillars, walls, arches, torches, banners, crates, barrels, rubble, barriers and coins.
- **Poly Haven PBR textures** — **CC0 1.0**. 1K JPG diffuse, normal, roughness and ambient-occlusion maps for cobblestone, dark rock and grass. Local note: `assets/games/ruin-runner/textures/LICENSE.txt`; library: https://polyhaven.com/textures.
- **Poly Haven Dikhololo Night HDRI** — **CC0 1.0**. 1K HDR used as the PBR environment/reflection map. Source: https://polyhaven.com/a/dikhololo_night. Local note: `assets/games/ruin-runner/hdri/LICENSE.txt`.
- **Three.js r183 addons** — MIT, copyright the three.js authors. Locally vendored `GLTFLoader`, `BufferGeometryUtils`, `SkeletonUtils`, `HDRLoader`, `RoundedBoxGeometry`, `EffectComposer`, `RenderPass`, `ShaderPass`, `UnrealBloomPass`, `OutputPass`, `MaskPass`, `Pass`, `CopyShader`, `LuminosityHighPassShader` and `OutputShader` under `assets/vendor/three/jsm/`. License: `assets/vendor/three/LICENSE`.

CC0 places the source assets in the public domain; the creators are credited here as good practice. The robot's local material/emissive adjustments and the procedural scene additions are original modifications.

## Royal Wood 3D Chess (nx-018)

Royal Wood 3D Chess is an original 3D chess game. The carved piece meshes, board geometry, three environments (Wooden Study, Forest Nature, Dark Royal Room), camera/input layer, UI, animations and sound are original code for this project. The game uses the following third-party components and assets.

- **chess.js 1.4.0** - BSD-2-Clause. Source: https://github.com/jhlywa/chess.js. Local ESM build: `assets/vendor/chess/chess.js`; license: `assets/vendor/chess/LICENSE`. Used for legal move generation, FEN, castling, en passant, promotion, check/checkmate/stalemate, repetition, fifty-move, insufficient-material and SAN history.
- **Stockfish.js 10.0.2** - GPL-3.0. Source: https://github.com/niklasf/stockfish.js; upstream: https://github.com/official-stockfish/Stockfish. Local: `assets/vendor/stockfish/stockfish.wasm.js`, `stockfish.wasm`, `stockfish.js`, with `COPYING.txt`, `README.md` and `SOURCE.md`. The engine runs in a separate Web Worker and speaks UCI. WASM is preferred, with the package single-threaded asm.js worker as fallback. Difficulty maps to Skill Level 0/8/20 and depth 2/6/14 for Easy/Medium/Hard. GPL-3.0 source information is recorded in `assets/vendor/stockfish/SOURCE.md`.
- **Poly Haven white maple veneer and American walnut veneer textures** - CC0 1.0. Sources: https://polyhaven.com/a/white_maple_veneer and https://polyhaven.com/a/american_walnut_veneer. Eight 1K JPG diffuse/normal/roughness/AO maps under `assets/games/royal-wood-chess/wood/`; license note: `assets/games/royal-wood-chess/wood/LICENSE.txt`. Used for the board, pieces and furniture.
- **Three.js r183 OrbitControls and RoomEnvironment addons** - MIT, copyright the three.js authors. Locally vendored under `assets/vendor/three/jsm/`; license: `assets/vendor/three/LICENSE`.

The chess pieces are not Unicode glyphs or flat sprites; all 32 are 3D mesh groups with turned profiles, bevels, carved details and PBR wood maps. No external runtime requests are needed.


## Authorised MadKidGames embeds (nx-019 to nx-027)

Cooking Love Chef Restaurant is **not hosted or modified by Robloxsplay**. It is served by the provider in an official iframe on its game page.

- **Provider:** MadKidGames
- **Official game page:** https://www.madkidgames.com/game/cooking-love-chef-restaurant
- **Official embed URL:** https://www.madkidgames.com/full/cooking-love-chef-restaurant
- **Embed instructions:** https://www.madkidgames.com/add-games-to-your-website
- **Thumbnail:** https://www.madkidgames.com/games/cooking-love-chef-restaurant/thumb_2.jpg, loaded from the provider's public game JSON; it is not downloaded or rehosted.
- **Attribution:** "Play Cooking Love Chef Restaurant" links to the provider's game page with `target="_blank" rel="noopener noreferrer"`; a direct fallback link is shown under the player.
- **Ownership:** The game, artwork, code, trademarks and any advertising or third-party services in the frame remain with MadKidGames and its licensors.
- **Advertising:** The provider controls the iframe and any advertising loaded inside it. Robloxsplay adds no advertising code, no ad placeholders beside the player, and does not manipulate provider ads.
- **Ads.txt:** The provider seller record is present in root `ads.txt`: `google.com, pub-2328712687113561, DIRECT, f08c47fec0942fa0`. Provider domain approval is still pending. No site AdSense configuration was changed. See `ADS_TXT_AUDIT.md`.

Additional titles under the same provider terms:

| Game | ID | Thumbnail | Page |
| --- | --- | --- | --- |
| Subway Surfers | `nx-020` | https://www.madkidgames.com/games/subway-surfers/thumb_2.jpg | https://www.madkidgames.com/game/subway-surfers |
| Pepi Hospital Learn and Care | `nx-021` | https://www.madkidgames.com/games/pepi-hospital-learn-and-care/thumb_2.jpg | https://www.madkidgames.com/game/pepi-hospital-learn-and-care |
| Toca Boca Life Neighborhood | `nx-022` | https://www.madkidgames.com/games/toca-boca-life-neighborhood/thumb_2.jpg | https://www.madkidgames.com/game/toca-boca-life-neighborhood |
| World Cricket Championship WCC Lite | `nx-023` | https://www.madkidgames.com/games/world-cricket-championship-wcc-lite/thumb_2.jpg | https://www.madkidgames.com/game/world-cricket-championship-wcc-lite |
| It Girl Story - Celebrity Life | `nx-024` | https://www.madkidgames.com/games/it-girl-story-celebrity-life/thumb_2.jpg | https://www.madkidgames.com/game/it-girl-story-celebrity-life |
| Free Kick Football 3D Soccer | `nx-025` | https://www.madkidgames.com/games/free-kick-football-3d-soccer/thumb_2.jpg | https://www.madkidgames.com/game/free-kick-football-3d-soccer |
| Offroad Outlaws | `nx-026` | https://www.madkidgames.com/games/offroad-outlaws/thumb_2.jpg | https://www.madkidgames.com/game/offroad-outlaws |
| Hot Wheels Race Off | `nx-027` | https://www.madkidgames.com/games/hot-wheels-race-off/thumb_2.jpg | https://www.madkidgames.com/game/hot-wheels-race-off |

Both use the same official MadKidGames iframe pattern, provider attribution, loading state, direct fallback and fullscreen control. Their thumbnails and hero preview videos are provider-served and are not downloaded or rehosted. The hero previews use the provider's public /files/videos/{slug}.mp4 paths, which were verified HTTP 200.
## Vendored dependencies

| Component | Version | License | License text | Location |
| --- | --- | --- | --- | --- |
| Three.js | 0.183.1 | MIT | `assets/vendor/three/LICENSE` and `games/rpg-car-game/vendor/three/LICENSE` | `assets/vendor/three/` (six original 3D games) and `games/rpg-car-game/vendor/three/` (car game) |
| @dimforge/rapier3d-compat | 0.14.0 | Apache-2.0 | `vendor/rapier/LICENSE` | Runtime `rapier.es.js` and WASM live in `games/rpg-car-game/` |
| stats-gl | 2.4.2 | MIT | `vendor/stats-gl/LICENSE` | `games/rpg-car-game/vendor/stats-gl/` |
| Draco decoder | 1.5.7 | Apache-2.0 | `vendor/draco/LICENSE` | `games/rpg-car-game/vendor/draco/1.5.7/` |
| chess.js | 1.4.0 | BSD-2-Clause | `assets/vendor/chess/LICENSE` | `assets/vendor/chess/` |
| Stockfish.js | 10.0.2 | GPL-3.0 | `assets/vendor/stockfish/COPYING.txt` and `SOURCE.md` | `assets/vendor/stockfish/` |
| Poly Haven wood maps | 1K | CC0-1.0 | `assets/games/royal-wood-chess/wood/LICENSE.txt` | `assets/games/royal-wood-chess/wood/` |

Notes:
- Site dependencies previously fetched from public CDNs (`cdn.jsdelivr.net`, `gstatic.com`) are now served from this project. Original and self-hosted game runtimes make no external runtime requests. The three MadKidGames catalogue cards load their thumbnails from MadKidGames, and their game pages load the provider iframes; these are provider-controlled external requests.
- Apache-2.0 components (Rapier, Draco) require the license text and notices to be retained; the license texts above are included with the vendored files.
- The Draco decoder is only used if a Draco-compressed glTF is loaded. No Draco-compressed assets are bundled.

## Fonts

- The upstream game imported **Inter** and **JetBrains Mono** from Google Fonts (SIL Open Font License 1.1).
- This integration **removed** the Google Fonts `@import` and uses system font fallbacks, so no font files are bundled or fetched.
- If Inter/JetBrains Mono are reintroduced later, they must be self-hosted with their OFL license text included.

## Web platform APIs

- **WebGPU** and **WebGL2** are browser APIs. No additional license obligations apply beyond the browser's terms.

## Robloxsplay original work

- The 17 Robloxsplay original games, the site design, icons, and all game covers are original work created for this project. The licensed RPG Car Game is documented separately above.
- Five of the original ten games were rebuilt as full 3D WebGL experiences (Orbit Pong 3D, Prism Breaker 3D, Meteor Defender 3D, Grid Runner 3D, Target Tap 3D); the other five retain their original neon Canvas implementations. Ruin Runner 3D is a later original 3D endless runner; its gameplay, endless-track construction, UI and effects are original, while its character/environment art is the CC0 asset pack documented above.
- The 3D card thumbnails are real screenshots of the implemented games. The five neon cards keep their original SVG key art. The Ruin Runner 3D logo is original vector art.
- **Tic Tac Toe** (`nx-017`) is original DOM/SVG/CSS work: custom board, X/O symbols, win line, particles, layout and interface code. It ships no third-party art, images, fonts, music or libraries. All sound cues are synthesised at runtime with the Web Audio API.
- **Royal Wood 3D Chess** (`nx-018`) is original Three.js scene/game/UI/audio work; the piece and board meshes are procedurally carved original geometry. Its third-party rules engine, Stockfish worker and wood maps are documented above.
- **Cooking Love Chef Restaurant** (`nx-019`), **Subway Surfers** (`nx-020`), **Pepi Hospital Learn and Care** (`nx-021`), **Toca Boca Life Neighborhood** (`nx-022`), **World Cricket Championship WCC Lite** (`nx-023`) and **It Girl Story - Celebrity Life** (`nx-024`), **Free Kick Football 3D Soccer** (`nx-025`), **Offroad Outlaws** (`nx-026`) and **Hot Wheels Race Off** (`nx-027`) are authorised MadKidGames iframes, not Robloxsplay original work. Their provider attribution, thumbnail sources and ads.txt record/approval status are documented above.
- The RPG Car Game cover is original key art created for this integration; it does not copy the upstream repository's branding or any third-party graphics.

## Original runner audio and effects

Ruin Runner 3D synthesises all of its audio at runtime with the Web Audio API: wind/drone ambience, bird chirps, footsteps, jump/land/slide, coin, shield, magnet, boost, impact and game-over cues. Tic Tac Toe and Royal Wood 3D Chess likewise synthesise their move, capture, castle, check, click, win, loss and draw cues. No audio files, samples, music tracks or third-party sound libraries are used.

## Compliance notes

- Robloxsplay adds no advertising, tracking, analytics or ad scripts. Nine authorised third-party game iframes are embedded from MadKidGames; the provider controls advertising and cookies inside those frames.
- No user accounts, databases, or authentication were added.
- No asset with unclear commercial-use rights is distributed with this build. If a new asset is added, verify its license and record it here before publishing.
