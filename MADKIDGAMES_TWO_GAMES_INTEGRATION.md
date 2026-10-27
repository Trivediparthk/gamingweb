# MADKIDGAMES_TWO_GAMES_INTEGRATION.md

> Historical two-game record. The catalogue now has 24 games and six MadKidGames embeds; see `MADKIDGAMES_THREE_GAMES_INTEGRATION.md` for the latest integration.

## Summary

Two authorised MadKidGames titles remain in the catalogue and use the provider's official iframe URLs:

| ID | Game | Category | Official embed |
| --- | --- | --- | --- |
| `nx-020` | Subway Surfers | 3D / Runner / Casual | https://www.madkidgames.com/full/subway-surfers |
| `nx-021` | Pepi Hospital Learn and Care | Kids / Educational / Simulation | https://www.madkidgames.com/full/pepi-hospital-learn-and-care |

Cooking Love Chef Restaurant (`nx-019`) remains in place. The catalogue now contains 21 entries: 17 in-house originals, the licensed RPG Car Game and three authorised MadKidGames iframes.

## Loading diagnosis (27 October 2026)

Each official URL was tested twice in Chromium: as a top-level page and embedded in the Robloxsplay game page.

| Check | Subway Surfers | Pepi Hospital |
| --- | --- | --- |
| Official `/full` URL HTTP status | 200 | 200 |
| Provider wrapper frame | Loads | Loads |
| Provider game content frame | Loads | Loads |
| Canvas / WebGL2 available | Yes | Yes |
| Provider game reaches its Play screen | Yes, around 80 seconds ("Tap to play") | Yes, around 50 seconds (Play screen) |
| Full gameplay controls validated | Not fully validated | Not fully validated |
| Robloxsplay iframe sandbox | None | None |
| Robloxsplay CSP blocking the iframe | None observed | None observed |
| Mixed content | Parent HTTP + provider HTTPS; not blocked | Parent HTTP + provider HTTPS; not blocked |
| Console errors attributed to Robloxsplay | None | None |
| Provider-console errors | CSP errors on `/full`, Cloudflare beacon blocked, `/ej6j/` 404, `embed.games/api/ad-event.php` blocked | Same class of provider-side errors |
| Direct vs embedded result | Same slow loader and same provider errors | Same slow loader and same provider errors |

### Interpretation

The integration is not the cause. The iframe has no sandbox restriction, the site has no CSP that blocks it, the provider allows framing with `frame-ancestors *`, and the provider is HTTPS while the current site is HTTP (HTTPS content is not mixed content). The provider's own wrapper loads first, then its game content sits on **Loading...** for roughly a minute before showing its Play screen.

The remaining errors are inside `www.madkidgames.com` / `embed.games` frames, not the Robloxsplay origin. No browser security was disabled, no CSP was bypassed, no ad system was manipulated, and no provider files were downloaded or rehosted.

## UX changes made

- Subway Surfers and Pepi Hospital now use `playability: "provider-slow"`.
- Their cards show **Provider check** instead of **Play** and their detail pages show **Provider load: slow** until complete gameplay is validated.
- The page title uses **Provider preview** and the play note explains that MadKidGames can take up to a minute.
- A continuous site loading overlay appears while the provider wrapper loads, then clears after the iframe load event or a short safety timeout.
- After 20 seconds, a **Still on the provider's loading screen?** notice appears with an **Open official game** button. It does not block the iframe.
- The official embed URL, exact iframe attributes, attribution link, fullscreen control and direct fallback remain in place.
- Global catalogue wording now says **21 games** rather than claiming every listed item is immediately playable.

## Existing catalogue integration

- Homepage: both cards appear in the Freshly loaded section.
- All Games: 21 cards; 3D 01, Runner 04, Educational 01, Cooking 01, Simulation 03.
- Category pages: 3D and Educational each show their new game; Simulation includes both.
- Search works with the supplied tags (`subway-surfers`, `pepi-care`, `educational`).
- Official thumbnails load at 512px natural width.
- Long descriptions remain on detail pages and do not overflow cards.
- 390px mobile layout has no horizontal page overflow and the player remains 350px wide / 540px high.

## Post-fix live verification

Verified after deployment on the current AWS host:

- All Games: 21 cards. Subway and Pepi cards read **Provider check** / **Via MadKidGames**.
- Detail pages: **Provider load: slow** badge, preview title and updated play note.
- At 20 seconds, the **Open official game** button/notice is visible and points to the exact official game page.
- Site-side HTTP failures and page exceptions: none.
- Mobile 390px: no horizontal overflow; iframe remains 540px high.
- The direct provider URL and the embedded page have the same slow loader and the same provider-side console/network errors.
- Full gameplay controls were not fully validated; no "fully playable" claim is made.
- `ads.txt` was not modified by this loading fix.

## Ads.txt status

The MadKidGames seller record is present in root `ads.txt`:

```text
# MADKIDGAMES
google.com, pub-2328712687113561, DIRECT, f08c47fec0942fa0
```

Provider domain approval remains pending; see `ADS_TXT_AUDIT.md`. No ads.txt or advertising-script change was made as part of this loading fix.

## Remaining actions

1. Re-test full gameplay controls for both titles after the provider finishes its long startup. The Play screens were reached, but full gameplay was not validated.
2. Report the slow provider startup and CSP/ad-frame errors to MadKidGames; those errors are on their domain.
3. Complete the MadKidGames domain approval process; it is separate from the slow loader.
4. Configure the production domain/HTTPS before treating the current IP URL as final.
5. No AdSense approval is claimed.

## Changed files for this fix

- `assets/js/games-data.js` — `playability: "provider-slow"` on Subway and Pepi.
- `assets/js/game-page.js` — slow-load notice, 20-second timeout, official-game button, provider preview metadata.
- `assets/js/components.js` — card status becomes **Provider check**; aria label reflects provider status.
- `assets/css/games.css` — slow-state styling.
- `assets/js/site-chrome.js`, `index.html`, `all-games.html` — catalogue wording changed from "playable" to "games".
- `MADKIDGAMES_TWO_GAMES_INTEGRATION.md` — this diagnostic and test record.

No provider game files or thumbnails were downloaded or rehosted. No embed URL was replaced.
