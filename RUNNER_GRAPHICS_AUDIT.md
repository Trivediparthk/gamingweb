# RUNNER_GRAPHICS_AUDIT.md

## Scope

Audit of the **Ruin Runner 3D** graphics rebuild delivered on 2026-10-25 for the Robloxsplay 18-game catalogue. The goal was to replace the earlier primitive prototype with a cohesive, asset-driven 3D endless runner while preserving the site, game shell and all other titles.

## Verdict

**Delivered as a stylized twilight 3D game, not a photoreal production.** The character, environment props, textures and HDRI are real CC0 assets; the gameplay, endless-track construction and presentation are original. The result is substantially richer than the prototype and has a deliberate night-temple art direction. The remaining limitation is the source art style: the CC0 packs are low-poly/stylized. If "premium" is defined as photoreal or AAA fidelity, this build does not meet that definition and would need a higher-detail commissioned/licensed character and environment set.

## What changed

- Replaced the procedural explorer with the rigged **RobotExpressive** automaton (CC0) and added original cyan face/core accents.
- Replaced the flat daylight sky with an original procedural night sky (stars, moon, clouds/horizon) plus a **Dikhololo Night HDRI** used for PBR reflections.
- Added a moon sprite, moonlit fog, torch point lights, glowing cyan lane inlays, wetter PBR stone, bloom, fireflies and a warmer player lantern.
- Replaced the gate's oversized shield pillars with plain ruined columns and moved the gate to the far end of the temple section, opening the starting composition.
- Added 21 forest GLTFs, 29 dungeon GLTFs and 12 PBR texture maps as the visible environment.
- Removed the obsolete prototype rogue asset, old sunrise HDRI and temporary asset test page.
- Replaced the old card thumbnail with a real 918x573 night-gameplay capture.

## Asset manifest and rights

| Asset | Source / creator | License | Shipped location |
| --- | --- | --- | --- |
| RobotExpressive GLB | Tomás Laulhé (Quaternius); mods by Don McCurdy | CC0 1.0 | `assets/games/ruin-runner/characters/robot-expressive.glb` |
| KayKit Forest Nature Pack 1.0 | Kay Lousberg / KayKit | CC0 1.0 | `assets/games/ruin-runner/forest/` |
| KayKit Dungeon Remastered 1.0 | Kay Lousberg / KayKit | CC0 1.0 | `assets/games/ruin-runner/dungeon/` |
| Poly Haven PBR textures | Poly Haven contributors | CC0 1.0 | `assets/games/ruin-runner/textures/` |
| Dikhololo Night 1K HDR | Poly Haven | CC0 1.0 | `assets/games/ruin-runner/hdri/dikhololo_night_1k.hdr` |
| Three.js r183 + addons | Three.js authors | MIT | `assets/vendor/three/` |

License copies/notes:

- `assets/games/ruin-runner/characters/ROBOT_LICENSE_NOTES.md`
- `assets/games/ruin-runner/forest/LICENSE.txt`
- `assets/games/ruin-runner/dungeon/LICENSE.txt`
- `assets/games/ruin-runner/textures/LICENSE.txt`
- `assets/games/ruin-runner/hdri/LICENSE.txt`
- `assets/vendor/three/LICENSE`
- Site-wide record: `THIRD_PARTY_LICENSES.md`

No Temple Run, Subway Surfers, Roblox or other copyrighted game assets are used. No external runtime requests or CDNs are used by the game.

## Visual feature checklist

- [x] Rigged, animated 3D character (not a primitive or billboard).
- [x] Five used character clips: Idle, Running, Jump, Sitting (slide), Death.
- [x] GLTF character, obstacles, collectibles, vegetation, architecture and dungeon props.
- [x] PBR stone path with diffuse, normal, roughness and AO maps.
- [x] CC0 HDRI PBR environment/reflections + original procedural sky.
- [x] Night art direction with moon, stars, fog, moonlight and warm torches.
- [x] Glowing lane inlays for three-lane readability.
- [x] Bloom, shadows, particles, waterfall, mist, puddle/sheen effects.
- [x] Loading progress, retry error state and game-over/pause overlays.
- [x] New gameplay thumbnail at the existing 918x573 catalogue size.
- [x] No external asset fetches and no console/network errors in local smoke tests.

## Residual procedural geometry

The endless track requires recycled construction. The following are original procedural elements, not asset placeholders: path base/slabs, curbs, lane inlays, tunnel shell, gate framing, puddle/sheen planes, sky, moon, particles and UI. All major characters, obstacles, vegetation, dungeon architecture and collectibles are GLTF assets. This is an intentional gameplay/performance decision, not a failure to source art.

## Test record

Environment: local `python -m http.server 8765`; Playwright Chromium headless; software WebGL; 800-1440 px viewports.

- Load: pass; no console errors, page errors, failed requests or asset 404s.
- Assets: 1 HDRI, 1 character GLB, 21 forest GLTFs, 29 dungeon GLTFs, 12 PBR maps.
- Scene: about 434 meshes, 8 instanced path chunks, 6 skinned meshes, 44-48 textures, 78-92 geometries.
- Animation: `Running` at start, `Jump` airborne, `Sitting` sliding, `Death` on collision, `Running` after restart.
- Gameplay: lane change, jump, slide, coin pickup, shield absorption, tall-obstacle collision, game over and restart verified.
- Visual review: night scene, moon, lane lines, gate/torches, robot core and GLTF crates/totems present in the final 918x573 capture.

## Known limitations and next actions

1. **Art style:** source packs are low-poly/stylized. A photoreal brief needs a different licensed asset tier.
2. **Hardware performance:** no physical GPU/phone benchmark. Headless software WebGL is not representative. Test on a mid-range Android/iPhone before a marketing push.
3. **Character fit:** the automaton is a deliberate thematic choice. If a human explorer is required, source a high-detail rigged character with matching animations and re-run this audit.
4. **Torch lights:** four dynamic point lights are added by temple sections; verify mobile frame time at high quality and consider disabling them at low quality if needed.
5. **Deployment:** shipped to `http://54.221.130.253/game.html?game=ruin-runner-3d`; public load reached the running state with 438 meshes and zero console/network errors. A server backup was kept at `/var/www/nexora-arcade.bak-20261025-premium`.

## Files of record

- `assets/js/custom-games/endless-runner.js`
- `assets/js/custom-games/runner3d/{assets,scene,environment,player,obstacles,collectibles,ui,audio,controls}.js`
- `assets/games/ruin-runner/`
- `assets/images/games/ruin-runner-3d.png`
- `assets/js/games-data.js`
- `game.html`
- `ENDLESS_RUNNER_REPORT.md`
- `THIRD_PARTY_LICENSES.md`
