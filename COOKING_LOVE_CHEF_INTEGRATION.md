# COOKING_LOVE_CHEF_INTEGRATION.md

## Integration summary

**Cooking Love Chef Restaurant** is the 19th game in the Robloxsplay catalogue and the first published authorised third-party embed (`nx-019`). It is served by **MadKidGames** in the provider's official iframe and is not hosted, copied or modified by Robloxsplay.

- Official game page: https://www.madkidgames.com/game/cooking-love-chef-restaurant
- Official embed URL: https://www.madkidgames.com/full/cooking-love-chef-restaurant
- Official embed instructions: https://www.madkidgames.com/add-games-to-your-website
- Provider: MadKidGames
- Categories: **Cooking** and **Simulation**
- Site page: `/game.html?game=cooking-love-chef-restaurant`

## Embed implementation

- The dedicated game page renders the provider's official iframe.
- Container maximum width: **960px**.
- iframe attributes:
  - `src="https://www.madkidgames.com/full/cooking-love-chef-restaurant"`
  - `title="Cooking Love Chef Restaurant"`
  - `width="100%"`
  - `height="540"`
  - `frameborder="0"`
  - `allowfullscreen`
  - `scrolling="no"`
  - `loading="lazy"`
  - `referrerpolicy="no-referrer-when-downgrade"`
- Responsive behaviour: the player stays fluid below 960px; tested at 390px mobile with no horizontal overflow. The frame remains 540px tall.
- Fullscreen: a site-level Fullscreen button expands the 960px player shell; the iframe also carries `allowfullscreen`. Tested at 1280x900; the player expanded to 1280x900.
- Attribution below the player: **Play Cooking Love Chef Restaurant**, linking to the official game page with `target="_blank"` and `rel="noopener noreferrer"`.
- Visible fallback: **Open Cooking Love Chef Restaurant on MadKidGames**, plus a `<noscript>` fallback.
- The page identifies the provider and explains that loading the embed connects to MadKidGames and may use its cookies or advertising. No provider files are downloaded or rehosted.

## Thumbnail

The catalogue card uses the provider's public game JSON thumbnail:

`https://www.madkidgames.com/games/cooking-love-chef-restaurant/thumb_2.jpg`

It is loaded from MadKidGames, not copied into the project. Browser test confirmed the image loaded at its natural **512px** width.

## Catalogue integration

- Homepage **Freshly loaded** grid: card present with the title and a link to the dedicated game page.
- All Games: **19 cards**; new **Cooking** filter shows 1 game; **Simulation** shows 2.
- Category pages:
  - Cooking: 1 game.
  - Simulation: 2 games (RPG Car Game and Cooking Love Chef Restaurant).
- Related games on the detail page: RPG Car Game, Neon Snake, Orbit Pong.
- Cards and detail page identify the game as **Via MadKidGames** / **Authorised embed**.
- No existing game was removed or replaced.

## Test results

Environment: static local server `http://127.0.0.1:8765` and live `http://54.221.130.253`, Playwright Chromium (desktop 1280x900 and mobile 390x844).

| Check | Result |
| --- | --- |
| Homepage card appears | PASS |
| Homepage card opens the dedicated page | PASS |
| All Games shows 19 cards | PASS |
| Cooking and Simulation categories | PASS |
| Thumbnail loads from provider | PASS (512px natural width) |
| Official iframe attributes match requested configuration | PASS |
| Iframe loads the MadKidGames embed page | PASS |
| Provider game content frame loads | PASS (provider `index.html` frame present) |
| Provider game reaches playable state | FAIL in the Chromium test environment: provider stayed on its own Loading screen; see observation below |
| Site-level fullscreen | PASS (1280x900) |
| Attribution text, target and rel | PASS |
| Fallback link present | PASS |
| Mobile layout | PASS (390px, no horizontal overflow; iframe 348x540) |
| Main page console errors | PASS (none) |
| Main page navigation | PASS |
| Provider ads.txt record | ADDED; provider approval pending |

### Provider player observation

In the automated Chromium test, the provider's game frame remained on its own **"Loading..."** screen after 33 seconds, both inside the Robloxsplay iframe and when opening the provider's full page directly. The iframe itself loaded successfully and the provider game frame/canvas were present, but the game did not progress in this test environment. The provider wrapper also logged Content-Security-Policy errors for its own inline scripts and returned a 404 for its `/ej6j/` resource.

This is a provider-side loading/CSP issue, not a bypassable iframe restriction. We did not alter the provider's CSP, remove its ads, or modify the embed. The required direct fallback is visible under the player and links to the official game page.

## Ads.txt - PROVIDER RECORD ADDED; APPROVAL PENDING

**The MadKidGames seller record is now in root `ads.txt`; provider approval is still pending.** See `ADS_TXT_AUDIT.md`. No site AdSense code was added, moved, or placed next to the player.

The provider's page shows:

- A `#MADKIDGAMES` label.
- The raw entry text: `google.com, pub-2328712687113561, DIRECT, f08c47fec0942fa0`
- An instruction to email the domain to MadKidGames for approval.

Confirm with the client and MadKidGames:

1. The exact raw ads.txt line, including whether `#MADKIDGAMES` is a comment marker or part of the required line.
2. Whether the existing AdSense publisher ID matches `pub-2328712687113561`.
3. The domain/email to submit for approval and the expected approval turnaround.
4. Whether any additional provider entries or subdomain entries are required.
5. The correct approval process and any consent/advertising requirements for the embed.

Current state: **integration published, provider ads.txt record present, provider domain approval pending**. See `ADS_TXT_AUDIT.md`.

## Policy and monetisation notes

- No ad scripts, ad placeholders or ad manipulation were added.
- No provider files, private assets or game code were copied or rehosted.
- The provider's attribution and game links are preserved.
- No claim of AdSense approval is made. Approval is not guaranteed.
- No new ad unit was placed beside the interactive player.

## Changed files

- `assets/js/games-data.js` — added `nx-019`, Cooking category, provider metadata and integration status.
- `assets/js/game-page.js` — authoritative MadKidGames iframe player, attribution, fallback, fullscreen and provider-aware play note.
- `assets/js/components.js` — card label for provider embeds.
- `assets/js/all-games.js`, `assets/js/category.js` — current catalogue wording.
- `assets/js/site-chrome.js` — 19-game header/footer wording.
- `assets/css/games.css` — responsive MadKidGames player and fullscreen styles.
- `game.html` — provider-aware play note hook and cache-busted shared script link.
- `index.html`, `all-games.html`, `about.html`, `contact.html` — 19-game catalogue copy and Cooking navigation.
- `privacy-policy.html`, `terms.html` — provider disclosure.
- `sitemap.xml` — new game URL and Cooking category URL.
- `THIRD_PARTY_LICENSES.md`, `LICENSING-AUDIT.md`, `DELIVERY.md` — provider, licensing and integration records.
- `COOKING_LOVE_CHEF_INTEGRATION.md` — this report.
