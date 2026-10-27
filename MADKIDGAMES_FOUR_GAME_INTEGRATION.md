# MADKIDGAMES_FOUR_GAME_INTEGRATION.md

## Summary

Existing catalogue reviewed before changing anything.

| Game | Result | ID |
| --- | --- | --- |
| Free Kick Football 3D Soccer | **Newly added** | `nx-025` |
| World Cricket Championship WCC Lite | **Already existed** — updated only with the missing Cricket category; description, tags, thumbnail and embed preserved | `nx-023` |
| Offroad Outlaws | **Newly added** | `nx-026` |
| Hot Wheels Race Off | **Newly added** | `nx-027` |

Final unique catalogue: **27 games** (`nx-001`–`nx-027`), with no duplicate IDs or slugs.

## Integration

- Added Football, Soccer, Cricket, Driving and Off-Road category shelves.
- Free Kick: Sports / Football / Soccer / 3D.
- WCC: Sports / Cricket / 3D / Simulation (richer existing description retained).
- Offroad: Racing / Driving / Off-Road / 3D.
- Hot Wheels: Racing / Driving / 3D.
- Homepage recent grid now shows nine recent provider titles, including all three new cards.
- All Games shows 27 cards.
- Search supports the supplied tags (`free-kick`, `offroad-outlaws`, `race-off`, etc.).
- Supplied thumbnails return HTTP 200 and render at 512px.
- Exact iframe URLs, official attribution URLs, 960px maximum player, 540px height, lazy loading, referrer policy and fullscreen are used.
- Mobile 390px: no horizontal overflow.
- No duplicate cards or IDs.

## Actual provider tests

| Game | Site result | Direct official URL | Playable claim |
| --- | --- | --- | --- |
| Free Kick Football 3D Soccer | Provider game frame and canvas load; remained on provider **Loading...** after 60s | Provider game frame/canvas present; gameplay not fully validated | **Not verified** |
| Offroad Outlaws | Provider frame reports **“Embedding unavailable — access to this game has been restricted on this website”**; it also reports 80.3 MB of game files before the restriction | Direct provider game frame/canvas present; embedding on this site remains restricted | **No** |
| Hot Wheels Race Off | Provider game frame and canvas load; remained on provider **Loading...** after 60s | Provider game frame/canvas present; gameplay not fully validated | **Not verified** |
| World Cricket Championship WCC Lite | Existing provider-slow record retained; no duplicate created | Previously tested as provider-slow | **Not verified** |

The provider-side failures observed were CSP errors, `/ej6j/` 404s, blocked `embed.games/api/ad-event.php` requests and Cloudflare challenge aborts. No Robloxsplay page exception occurred. No security or iframe restriction was bypassed.

### UX handling

- Free Kick and Hot Wheels show **Provider check** / **Provider load: slow** with a 20-second slow-load notice and official link.
- Offroad shows **Provider check** and **Provider embed restricted** immediately, with an official game link.
- No game is described as fully playable until gameplay is actually verified.

## Ads.txt

No new seller record was added. The existing single record covers all MadKidGames titles:

```text
# MADKIDGAMES
google.com, pub-2328712687113561, DIRECT, f08c47fec0942fa0
```

Provider domain approval remains pending; see `ADS_TXT_AUDIT.md`. No AdSense publisher ID was invented.

## Files changed

- `assets/js/games-data.js` — added `nx-025`–`nx-027`; updated WCC categories; added category shelves; updated integration status.
- `assets/js/app.js` — homepage recent grid expanded to nine.
- `assets/js/components.js`, `assets/js/game-page.js` — provider-issue/restricted states.
- `assets/css/games.css` — existing provider loading/notice styles.
- `index.html`, `all-games.html`, `about.html`, `contact.html`, `privacy-policy.html`, `terms.html` — 27-game copy and nine-provider disclosure.
- `assets/js/site-chrome.js`, `assets/js/all-games.js` — 27-game catalogue copy.
- `sitemap.xml` — 27 game URLs and 23 category URLs.
- `THIRD_PARTY_LICENSES.md`, `LICENSING-AUDIT.md`, `DELIVERY.md`, `ADS_TXT_AUDIT.md`, `MADKIDGAMES_THREE_GAMES_INTEGRATION.md` — updated records.
- `MADKIDGAMES_FOUR_GAME_INTEGRATION.md` — this report.

## Remaining actions

1. MadKidGames must resolve the provider loading/CSP/404 problems.
2. Offroad Outlaws requires provider/domain approval or a supported embed before it can be playable on this site.
3. Complete provider domain approval and configure the final production domain/HTTPS.
4. No AdSense approval is claimed.
