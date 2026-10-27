# ENDLESS_RUNNER_REPORT.md

## Summary

**Ruin Runner 3D** (`nx-016`) is the 16th Robloxsplay catalogue entry and the sixth original 3D WebGL game. It is a complete three-lane endless runner: the player controls a reawakened temple automaton across a moonlit, overgrown causeway, changing lanes, jumping, sliding, collecting coins and power-ups, and surviving an accelerating ruin.

The current build supersedes the earlier primitive prototype. It is asset-driven: a rigged CC0 automaton, 50 GLTF forest/dungeon props, 12 PBR texture maps and a CC0 night HDRI are loaded locally. The game code, endless-track construction, UI, audio and effects remain original work.

No Temple Run or Subway Surfers assets, characters, logos, levels, audio or source code are used. No copyrighted game assets are shipped.

## Technology

- **Three.js r183** (`0.183.1`) with `WebGLRenderer` (WebGL2 where available), vendored under `assets/vendor/three/`.
- Vanilla HTML/CSS/JavaScript ES modules. No React, Firebase, database, authentication or build step.
- The existing `GameShell` 3D mode, HUD, local best-score storage, pause/restart handlers, fullscreen and overlay system.
- Import map in `game.html` maps `three` and `three/addons/` to vendored files, so there are no runtime CDN requests.
- ACES filmic tone mapping, sRGB output, PMREM HDRI environment, PCF shadows, exponential/linear fog, UnrealBloom post-processing and a procedural night sky.

## Graphics architecture

- `assets/js/custom-games/runner3d/assets.js` - GLTFLoader/HDRLoader asset manifest, progress, material deduplication and disposal.
- `assets/js/custom-games/runner3d/scene.js` - renderer/camera, procedural night sky with stars and moon, moon sprite, PMREM night HDRI, moonlight, hemisphere/rim/warm fills, shadows, bloom, atmosphere interpolation and quality control.
- `assets/js/custom-games/runner3d/environment.js` - PBR causeway, three-lane inlays, 8 recycling sections, temple gate/pillars, torches with warm point lights, jungle foliage, bridge railings/water/waterfall/mist, tunnel walls/ceiling, courtyard props, fireflies, dust and rune decals.
- `assets/js/custom-games/runner3d/player.js` - rigged RobotExpressive character, animation fallback map, procedural shadow, footstep dust, canopy/lantern, cyan face emissive, cyan power core.
- `assets/js/custom-games/runner3d/obstacles.js` - pooled GLTF crates, gate/beam, totem-pillar, spike trap and rolling boulder.
- `assets/js/custom-games/runner3d/collectibles.js` - pooled GLTF coins, shield/magnet/boost power-ups, magnet pull and spark effects.
- `assets/js/custom-games/runner3d/audio.js` - original Web Audio synthesis for ambience, footsteps, jump/land/slide, coins, shield, magnet, boost, impact, game over and countdown.
- `assets/js/custom-games/runner3d/ui.js` - loading progress/error, power-up timer, sound/quality controls, countdown, hints, toasts and overlay logo.
- `assets/js/custom-games/runner3d/controls.js` - keyboard and swipe bindings.

## Asset manifest

All third-party assets are CC0 1.0 and locally served. Details and license copies:

- **RobotExpressive** - Tomás Laulhé (Quaternius), modifications by Don McCurdy. `assets/games/ruin-runner/characters/robot-expressive.glb`. Source and notes: `characters/ROBOT_LICENSE_NOTES.md`. Clips used: `Idle`, `Running`, `Jump`, `Sitting`, `Death`.
- **KayKit Forest Nature Pack 1.0** - Kay Lousberg. 21 GLTF tree/bush/rock/grass models plus texture. License: `assets/games/ruin-runner/forest/LICENSE.txt`.
- **KayKit Dungeon Remastered 1.0** - Kay Lousberg. 29 GLTF dungeon props. License: `assets/games/ruin-runner/dungeon/LICENSE.txt`.
- **Poly Haven PBR textures** - 1K cobblestone, dark-rock and grass diffuse/normal/roughness/AO maps. License: `assets/games/ruin-runner/textures/LICENSE.txt`.
- **Poly Haven Dikhololo Night 1K HDRI** - environment/reflection map only; the visible sky is procedural. License: `assets/games/ruin-runner/hdri/LICENSE.txt`.
- **Three.js r183 addons** - MIT. GLTFLoader, BufferGeometryUtils, SkeletonUtils, HDRLoader, RoundedBoxGeometry and post-processing modules. License: `assets/vendor/three/LICENSE`.

Full site-wide records: `THIRD_PARTY_LICENSES.md`. Graphics audit: `RUNNER_GRAPHICS_AUDIT.md`.

## Gameplay

- Three lanes with eased lateral movement and banking; keyboard (A/D or arrows) and touch swipes.
- Jump with gravity, dust burst, animation and sound; tuned to clear low crates.
- Slide with lowered collider and `Sitting` animation for the automaton; clears gate beams.
- Obstacles: low crate (jump), gate beam (slide), tall totem (change lane), spike trap (jump), rolling boulder (avoid).
- Spawn patterns always leave at least one safe lane; difficulty ramps from 13 to 26+ units/s.
- Coins in lines and arcs; score = distance + coins x 10 + power-up bonuses.
- Power-ups:
  - Shield - absorbs one impact, grants brief invulnerability.
  - Magnet - pulls coins for 8 seconds.
  - Boost - 5 seconds of higher speed, wider FOV and trail particles.
- Pause/resume with P, Escape or the shell; restart with R or the overlay.
- Game over on an unshielded collision: death animation, impact particles, camera shake and a delayed retry overlay.
- Persistent best score; distance/coin readout; three quality levels; mobile swipe input; fullscreen.

## Presentation

- Twilight temple direction: deep indigo sky, stars, a moon sprite, moonlit path, cyan lane runes, torch pools, glowing coins and cyan automaton core/face accents.
- 8-zone sequence: jungle, temple, bridge, tunnel, courtyard, then repeats. Atmosphere (fog, sun color/intensity, exposure) interpolates between zones.
- PBR stone path with normal/roughness/AO maps, reflective puddles/sheen on bridge sections, animated waterfall and mist.
- Camera follows the player with lane lead, vertical smoothing and impact shake.
- Loading overlay with progress and a retryable error state; accessible labels; sound and quality controls persisted locally.
- New 918x573 gameplay thumbnail: `assets/images/games/ruin-runner-3d.png`.

## Verification

Local smoke tests (Playwright Chromium, software WebGL, 1280-1440 px viewports):

- Asset load completes with no console or page errors and zero failed requests.
- Scene state: about 434 meshes, 8 instanced path chunks, 6 skinned character meshes, 78-92 geometries and 44-48 textures depending on quality.
- Animation state: `Running` at start, `Jump` while airborne, `Sitting` during a slide, `Death` on game over, `Running` again after restart.
- Lane change, jump, slide, coin collection, shield absorption, tall-obstacle collision, game over and restart all verified through debug hooks and state inspection.
- Moon, night sky, lane inlays, torch pools, GLTF props and robot core render; no runtime 404s.
- Visual frame reviewed from a 918x573 canvas capture and used as the final thumbnail.

Known test limitations:

- Headless Chromium uses software WebGL, so wall-clock frame timing is much slower than a real GPU and is not a valid FPS measurement.
- No physical phone/tablet was available; touch code is shared with the existing shell and the responsive layout was inspected, but hardware swipe/GPU testing remains advisable.
- The source packs are stylized low-poly art. The build is a cohesive stylized twilight game, not photoreal. A photoreal brief would require a different, higher-detail licensed asset set and a larger art/performance budget.

## Performance and safeguards

- Object pooling for obstacles, coins, power-ups and dust; recycling environment sections.
- Shared geometries/materials; instanced path slabs; capped delta time and pixel ratio; capped particle pools.
- Quality levels: low (no shadows/bloom, fewer props, pixel ratio 1), medium (shadows, bloom, 1.5), high (2048 shadows, full props, pixel ratio 2).
- Automatic one-way downgrade when measured frame time is poor; manual quality selection is respected.
- Pause/restart, resize, fullscreen, WebGL context-loss handling and full disposal of renderer, scene, assets, UI and audio are wired.
- No external runtime requests, tracking, ads, accounts or third-party embeds.

## Deployment

Deployed to `http://54.221.130.253/game.html?game=ruin-runner-3d` on 2026-10-25. The public smoke test reached the running state with 438 meshes, no console errors and no failed requests. A pre-deploy server backup is at `/var/www/nexora-arcade.bak-20261025-premium`. The runner assets are under `assets/games/ruin-runner/`; the game module and vendor addons are under `assets/js/` and `assets/vendor/three/`.
