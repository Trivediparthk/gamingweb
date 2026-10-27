# GAME_VISUAL_UPGRADE_PLAN.md

## Scope

This plan covers the ten original arcade games that formed the first NEXORA / Robloxsplay collection. The site later gained five additional titles (Jungle Dash, Metro Sprint, Neon Street Racer, Robot Target Arena and the licensed RPG Car Game), followed by the original 3D endless runner Ruin Runner 3D. Those additions are outside this 5-neon / 5-3D brief and are preserved unchanged; Ruin Runner 3D is documented in ENDLESS_RUNNER_REPORT.md.

- **5 games stay neon:** keep the existing 2D Canvas identity, polished and lightweight.
- **5 games become real 3D:** rebuilt with Three.js `WebGLRenderer`, perspective cameras, real 3D meshes, lights, shadows and 3D collision.
- No game is deleted and no game name is changed.

## Audit of the ten games

| # | Game | Current style | Technical complexity | 3D suitability | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | Neon Snake | Polished neon, strong trail glow | Low-medium | Low: grid readability matters more than depth | **Neon** |
| 2 | Orbit Pong | Polished neon, orbit rings, particles | Medium | High: a real zero-gravity court with depth and spin | **3D** |
| 3 | Prism Breaker | Polished neon, gradients, spark bursts | Medium | High: a perspective prism wall with a 3D core | **3D** |
| 4 | Memory Matrix | Polished neon, custom symbols, flip | Medium | Low: memory pairs gain nothing from depth | **Neon** |
| 5 | Number Merge | Polished neon, 2048 tiles | Medium | Low: rapid board reading is the core skill | **Neon** |
| 6 | Meteor Defender | Polished neon, starfield, meteors | Medium | Very high: approaching rocks, depth and a 3D ship | **3D** |
| 7 | Reaction Rush | Minimal, deliberate neon timing | Low | Very low: a timing test with no spatial element | **Neon** |
| 8 | Grid Runner | Polished neon, maze, patrols | Medium | High: a true 3D maze with real walls and a portal | **3D** |
| 9 | Target Tap | Polished neon, target rings | Medium | High: a raycast shooting gallery with depth | **3D** |
| 10 | Logic Tiles | Polished neon, Lights Out | Medium | Low: neighbour adjacency must stay instantly readable | **Neon** |

## Final selection

### Neon (5)

1. **Neon Snake** — arcade snake with a glowing trail.
2. **Memory Matrix** — 4x4 memory pairs with custom geometric symbols.
3. **Number Merge** — 2048-style tile merging.
4. **Reaction Rush** — five-round reaction test.
5. **Logic Tiles** — Lights Out across three grid sizes.

These keep their existing Canvas implementations and neon language. They remain fast, keyboard/touch friendly and independent.

### 3D (5)

1. **Orbit Pong 3D** — a zero-gravity court with a real 3D ball, player/AI paddles on separate planes, depth camera, wall bounces, spin, rally speed-up, first-to-seven scoring and match-win records.
2. **Prism Breaker 3D** — a 3D arena with a 45-prism wall, a core that travels through depth, a neon energy barrier controlled in X, three lives, wall/top/bottom collisions and brick-break particles.
3. **Meteor Defender 3D** — a real asteroid field with meteors that grow as they approach, a 3D ship, energy shards, pass bonuses, ramping spawn rate and a one-hit survival loop.
4. **Grid Runner 3D** — the original 15x9 maze and drone rules, rebuilt with 3D walls, a glowing runner, six shards, patrol drones, a locked/unlocked portal, turn-based movement and the +500 clear bonus.
5. **Target Tap 3D** — a 30-second shooting gallery with glossy targets at different depths, true raycast hits, combo scoring, a timer bar, depth lighting and accuracy reporting.

## Technical approach

- **Rendering:** Three.js `0.183.1` with `WebGLRenderer` (not WebGPU), vendored locally at `assets/vendor/three/`. No external requests.
- **Architecture:** vanilla HTML/CSS/JS. Each game remains a standalone ES module under `assets/js/custom-games/`. No React, database or authentication.
- **Shared toolkit:** `three-kit.js` provides the renderer/scene/camera setup, resize handling, studio lights, particle bursts, trails, glow sprites, starfields, grid floors, pointer/keyboard input and disposal.
- **Shell integration:** `GameShell` now supports a `renderer: "3d"` mode so it does not create a 2D context. The game-page passes `renderer` from the game registry.
- **Performance:** capped pixel ratio, limited light count, shared geometries/materials where possible, pooled particles, capped frame delta, and disposal of spawned objects. No post-processing stack.
- **Loading/error:** WebGL startup is wrapped; if a context cannot be created, a visible error overlay with Retry is shown instead of a blank canvas.
- **Scoring/state:** every 3D game uses the existing score/best storage, pause/restart handlers, HUD and overlay system.

## Presentation changes

- The five 3D cards use **actual canvas screenshots** of the implemented games, not fabricated images.
- 3D cards get a cyan **3D badge**, a "Robloxsplay 3D" label and a distinct hover treatment.
- The five neon cards keep their original SVG key art.
- Descriptions, instructions and control lists were rewritten for the new 3D controls.
- The game page shows **"Original 3D / WebGL"** for 3D builds.

## Out of scope / preserved

- The five additional site games and the licensed RPG Car Game are untouched.
- The site-wide design system, navigation, categories, legal pages, AdSense readiness and licensing docs are preserved and updated where needed.
