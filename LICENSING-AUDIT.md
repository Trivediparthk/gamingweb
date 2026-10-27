# Robloxsplay - Licensing and Asset Audit

> **Current build note:** this audit describes the earlier 14-game state. The current catalogue has **27 games**: 17 original Robloxsplay games (including seven 3D WebGL games, Tic Tac Toe and Royal Wood 3D Chess), the licensed RPG Car Game (MIT, credited separately) and nine authorised MadKidGames iframes (Cooking Love Chef Restaurant, Subway Surfers, Pepi Hospital Learn and Care, Toca Boca Life Neighborhood, World Cricket Championship WCC Lite, It Girl Story - Celebrity Life, Free Kick Football 3D Soccer, Offroad Outlaws and Hot Wheels Race Off; none hosted or modified by Robloxsplay). See `THIRD_PARTY_LICENSES.md` and `ENDLESS_RUNNER_REPORT.md` for the current licensing record. The counts and file references below are retained as the historical audit.

Audit date: 24 October 2026
Scope: the static site in `nexora-arcade/`, including all 14 published games, code, SVG artwork, metadata and local runtime assets.

This is a technical and provenance audit of the delivered files. It is not legal advice, a trademark clearance report or a substitute for signed contracts with rights holders.

## 1. Summary

- 14 games are published, all recorded as original Robloxsplay builds.
- 0 third-party games or embeds are published.
- 15 authorised third-party integration slots remain unfilled and undisclosed in the public catalogue.
- No third-party JavaScript libraries, CSS frameworks, web fonts, analytics, advertising scripts, audio files or remote images were found in the published site.
- All game code and game cover artwork are stored locally in this project.
- No provider names, embed URLs, ratings, player counts or permissions have been invented.

## 2. Published game inventory

| ID | Game | Source | Code | Cover artwork | Status |
| --- | --- | --- | --- | --- | --- |
| nx-001 | Neon Snake | Original in-house | Local module | Local original SVG | Ready |
| nx-002 | Orbit Pong | Original in-house | Local module | Local original SVG | Ready |
| nx-003 | Prism Breaker | Original in-house | Local module | Local original SVG | Ready |
| nx-004 | Memory Matrix | Original in-house | Local module | Local original SVG | Ready |
| nx-005 | Number Merge | Original in-house | Local module | Local original SVG | Ready |
| nx-006 | Meteor Defender | Original in-house | Local module | Local original SVG | Ready |
| nx-007 | Reaction Rush | Original in-house | Local module | Local original SVG | Ready |
| nx-008 | Grid Runner | Original in-house | Local module | Local original SVG | Ready |
| nx-009 | Target Tap | Original in-house | Local module | Local original SVG | Ready |
| nx-010 | Logic Tiles | Original in-house | Local module | Local original SVG | Ready |
| nx-011 | Jungle Dash | Original in-house | Local module | Local original SVG | Ready |
| nx-012 | Metro Sprint | Original in-house | Local module | Local original SVG | Ready |
| nx-013 | Neon Street Racer | Original in-house | Local module | Local original SVG | Ready |
| nx-014 | Robot Target Arena | Original in-house | Local module | Local original SVG | Ready |

Each game record in `assets/js/games-data.js` uses:

```js
sourceType: "custom",
developerOrProvider: "Robloxsplay Studio",
licenseReference: "Original work created in-house for Robloxsplay."
```

## 3. Code audit

- Game logic is implemented in local ES modules under `assets/js/custom-games/`.
- The shared shell and runner engine are also local project code: `game-shell.js`, `game-utils.js` and `runner-core.js`.
- No npm package, bundler, runtime dependency or package manifest is required by the delivered site.
- Games use browser APIs only: Canvas 2D, DOM, `localStorage`, pointer/touch events, keyboard events and the Fullscreen API.
- No minified third-party code, licence headers from other projects or copied embed snippets were found.
- No network calls are made by game modules. The only external-looking URLs are deployment placeholders such as `https://your-domain.example/` and the Schema.org vocabulary URL.

## 4. Art and media audit

- 14 game covers plus the logo and favicon are local SVG files under `assets/images/`.
- The Open Graph image is a locally generated PNG at `assets/images/og-cover.png` (1200 x 630).
- The SVG covers are vector compositions created for this project, not downloaded publisher artwork.
- No photographs, stock images, publisher logos, film/game characters, music, sound effects or third-party fonts are included.
- CSS textures are generated inline with CSS or an inline SVG data URI.
- All displayed type uses locally available system font stacks (`Bahnschrift`, `Segoe UI`, `Cascadia Mono` and fallbacks); no font files are hosted or fetched.

## 5. Third-party integration position

- No third-party game is published.
- The integration registry contains 15 planned slots but no provider identity, embed URL or permission record.
- The iframe loader is dormant until a record has both a real embed URL and a written licence reference.
- Do not publish a third-party game until the following are on file:
  - Official provider embed URL or code.
  - Written authorisation covering this domain and this use.
  - Required attribution, branding and advertising rules.
  - Confirmed fullscreen and age-restriction rules.
  - Provider privacy and data-processing requirements.

## 6. Data and tracking

- No accounts, payments, comments, user uploads or backend services.
- No analytics, advertising or tracking scripts are installed.
- Best scores are stored locally in `localStorage` under `robloxsplay:best:*` keys.
- The contact form does not transmit data; it prepares a draft for the user.
- No personal data is collected by the games.

## 7. Verification performed

- Reviewed the game registry and all 14 cover references.
- Confirmed 14 local game modules and 14 local game SVG covers.
- Scanned HTML, CSS and JavaScript for remote URLs; only deployment placeholders and Schema.org references were present.
- Confirmed no `@import`, remote font, image CDN or third-party script references.
- Validated all game SVG files as XML.
- Validated `sitemap.xml` as XML.
- Ran `node --check` on the game registry, icon module, shared runner engine and four new game modules.
- Ran Playwright/Chromium checks over the site and all 14 games at desktop and mobile widths with no console errors or horizontal overflow.

## 8. Open licensing items

- Confirm ownership and trademark clearance for the "Robloxsplay" name and all game titles. The name includes the Roblox trademark, so avoid implying affiliation with Roblox Corporation and obtain legal advice before launch.
- Confirm the legal entity that will publish the site and own the commissioned work.
- Obtain signed contributor assignments if anyone other than the commissioning client created any code or artwork.
- Replace the placeholder domain, contact address and legal pages before launch.
- Obtain documented permission for any future third-party embed.
- Commission a formal legal review if required for the target jurisdiction or app-store distribution.

## 9. Audit conclusion

On the evidence present in this repository, the 17 original games and their local cover artwork are original project assets. The RPG Car Game is MIT-licensed and self-hosted. Nine authorised MadKidGames embeds are published; their game files are not hosted or modified, their public thumbnails are provider-served, and the provider ads.txt record is present while domain approval remains pending verification. The other 6 integration slots remain unpopulated.
