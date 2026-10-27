# ADS_TXT_AUDIT.md

## Final file location

- **Local project file:** `C:\Users\LENOVO\Documents\Default Project\nexora-arcade\ads.txt`
- **Project public root:** `C:\Users\LENOVO\Documents\Default Project\nexora-arcade`
- **Hosting:** static HTML/CSS/JS served by nginx; no Vite build and no separate `public/` directory.
- **Nginx document root:** `/var/www/nexora-arcade`
- **Deployed file:** `/var/www/nexora-arcade/ads.txt`
- **Verified URL:** `http://54.221.130.253/ads.txt`
- **Intended custom-domain URL:** `https://MYDOMAIN.com/ads.txt` — **not yet verified** because no production domain/HTTPS hostname is configured in this project.

No existing ads.txt was present locally or on the server, so no entries were overwritten or merged.

## Final ads.txt contents

```text
# MADKIDGAMES
google.com, pub-2328712687113561, DIRECT, f08c47fec0942fa0
```

## Seller record included

| Field | Value | Verified source |
| --- | --- | --- |
| Exchange/domain | `google.com` | MadKidGames official game page, Ads.txt Requirement modal |
| Publisher/account ID | `pub-2328712687113561` | Same official page |
| Relationship | `DIRECT` | Same official page |
| Certification authority ID | `f08c47fec0942fa0` | Same official page |

Official source checked: https://www.madkidgames.com/game/cooking-love-chef-restaurant

The current provider page explicitly displays:

```text
#MADKIDGAMES
google.com, pub-2328712687113561, DIRECT, f08c47fec0942fa0
```

The file uses the requested human-readable comment `# MADKIDGAMES`; the comment is separate from the seller line and is ignored by ads.txt parsers. The seller line does **not** begin with `#`.

## Embedded-game provider audit

| Provider | Games/pages | Requirement | Action |
| --- | --- | --- | --- |
| MadKidGames | Cooking Love Chef Restaurant (`nx-019`), Subway Surfers (`nx-020`), Pepi Hospital Learn and Care (`nx-021`), Toca Boca Life Neighborhood (`nx-022`), World Cricket Championship WCC Lite (`nx-023`), It Girl Story - Celebrity Life (`nx-024`), Free Kick Football 3D Soccer (`nx-025`), Offroad Outlaws (`nx-026`), Hot Wheels Race Off (`nx-027`) | Official ads.txt modal gives one seller record and asks the site owner to email their domain for approval | Added once, for all nine games |
| Robloxsplay Studio | 17 original games | No third-party iframe or advertising seller | No ads.txt record |
| RPG Car Game | Self-hosted `games/rpg-car-game/`; MIT-licensed source | No third-party game iframe or provider seller | No ads.txt record |
| GameMonetize, Playgama, other platforms | Not present in the catalogue | Applicable instructions could not be verified | No records invented or added |

There is only one external game provider in the current catalogue: **MadKidGames**. Multiple games from the same provider use one record, not three duplicates.

## Own Google AdSense status

- No own Google AdSense publisher ID (`ca-pub-...` / `pub-...`) is configured in the site source, scripts or page metadata.
- No AdSense script, ad unit or ad placeholder was added or changed.
- The `pub-2328712687113561` record belongs to **MadKidGames**, not to this site's own AdSense account.
- **Action required:** obtain the site's own publisher ID from its AdSense account and, after verification, add its own Google record separately. Do not reuse the MadKidGames ID as the site's own publisher ID.

## Validation performed

- Local `/ads.txt`: **HTTP 200**, `text/plain`.
- Live `/ads.txt`: **HTTP 200**, `text/plain; charset=utf-8`.
- File bytes: 73, UTF-8 without a BOM, ending in a newline.
- Parsed lines: one comment and one seller record.
- Seller record fields: valid four-field format.
- Duplicate seller records: none.
- Malformed records: none.
- The iframe games remain embedded; no game files were copied, modified or rehosted.

## Remaining actions

1. **Configure the production domain and HTTPS** so the verified URL becomes `https://MYDOMAIN.com/ads.txt`; the current reachable host is the AWS IP over HTTP.
2. **Submit the production domain to MadKidGames for approval** using the email/contact link in the provider's Ads.txt Requirement modal. Approval is not yet confirmed.
3. **Confirm the provider's exact raw-line expectations** with MadKidGames if they require `#MADKIDGAMES` with no space; the seller record itself is already exact.
4. **Obtain the site's own AdSense publisher ID** and add its verified record separately when available.
5. Keep ads.txt intact through future static deployments. Any deploy script/copy step must include the root `ads.txt`.
6. Do not claim AdSense or MadKidGames approval until it has been received and verified.

No DNS, AWS infrastructure, AdSense script, or existing production advertising configuration was changed.
