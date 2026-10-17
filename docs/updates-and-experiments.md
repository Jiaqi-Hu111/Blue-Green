# Update, experiment and growth investigation

## Confirmed live caching observations

Read-only HTTPS probes on 17 October 2026 inspected the normal public URL and `?v=52022db`, plus their JS, CSS and image assets. TLS verification remained enabled for these requests.

| Resource                                       | Observed response                                                      | Cache-Control |
| ---------------------------------------------- | ---------------------------------------------------------------------- | ------------- |
| `/Blue-Green/`                                 | 200; ETag `"6ad35263-280"`; last modified 17 October 2026 10:48:03 UTC | `max-age=600` |
| `/Blue-Green/?v=52022db`                       | 200; identical HTML and ETag                                           | `max-age=600` |
| `/Blue-Green/assets/index-B88XVVY6.js`         | 200; JavaScript                                                        | `max-age=600` |
| `/Blue-Green/assets/index-B4EvT9xE.css`        | 200; CSS                                                               | `max-age=600` |
| `/Blue-Green/images/illustrated-materials.png` | 200; PNG                                                               | `max-age=600` |
| `/Blue-Green/images/coastal-storybook.png`     | 200; PNG                                                               | `max-age=600` |

The queried HTML had `Age: 13` and a cache hit at the observation point; the initial normal request had `Age: 0`. Both documents referenced the current storybook assets. The deployment uses GitHub Actions/Pages (`build_type: workflow`).

**Confirmed exposure:** the stable entry-document URL can remain fresh in an HTTP cache for ten minutes, and a previously loaded app does not replace itself when a deployment finishes. Vite already content-hashes JS and CSS, so a cached _document_ can continue referencing the old bundle. Previously, public image filenames did not change when their bytes changed. There was no deployment-version check.

**Limit of diagnosis:** the user's earlier stale response is not reproducible now: the normal and versioned URLs currently return the same latest HTML. These observations support an entry-document/browser cache explanation; they do not prove which historical cache entry the user's browser held. A query parameter changes the browser document cache key, but does not prove an origin deployment fault. The app/repository has no Service Worker registration, PWA plugin or Cache Storage writer. We do not purge unrelated registrations or claim to inspect the user's browser remotely.

Native Chromium HTTPS navigation in this execution environment encountered its proxy CA trust error. No TLS verification was disabled. Live response inspection used the environment's trusted HTTPS client; automated fresh/cached browser scenarios below use a local HTTP fixture serving actual production builds.

GitHub Pages controls its response headers. `_headers`, `.htaccess` and HTML cache-control meta tags are not mechanisms for overriding Pages' HTTP `Cache-Control` here, and none were added.

## Implemented update mechanism

- Vite emits `version.json` with the same full commit SHA embedded in the client and `<meta name="bluegreen-build">`. GitHub Actions' `GITHUB_SHA` is used in CI; local builds use `git rev-parse HEAD`.
- Existing JS/CSS hashing is retained. Runtime public-image references now resolve to build-emitted filenames containing a SHA-256 content digest. Original public filenames remain available for compatibility with older bundles; existing artwork is unchanged.
- The production app fetches a fresh, timestamped version-manifest request with `cache: 'no-store'` on entry, focus, return to visibility, and every 60 seconds while visible. Invalid/offline responses do not interrupt the game.
- A different, valid SHA produces an accessible **New version available** prompt. **Later** dismisses that particular release for the current page. The app never auto-reloads during mixing, configuration or any other stage.
- **Update** first saves active tab state and merges notebook records. If saving fails, updating is paused. It then performs a cache-busted navigation under `/Blue-Green/`; the new client immediately removes its private `__bluegreen_update` marker with `history.replaceState`, leaving the normal URL. Visitors never need to type a version parameter.
- No Service Worker is introduced. No broad cache deletion, history reset or account service is used.

**Hosting limit:** checks cannot make an already cached _pre-fix_ client execute code it never downloaded, force a CDN to invalidate instantly, or guarantee zero staleness before the new bootstrap is first delivered. Future clients with this checker can detect newer deployments and update safely. CDN propagation can still delay availability. Deployment timestamps are not used as scientific or gameplay inputs.

## History and active recipe separation

The old `bluegreen-lab-v1` and `bluegreen-lab-v2` keys are read-only migration sources and are never removed or rewritten by this version.

| Key                            | Storage        | Purpose                                                               |
| ------------------------------ | -------------- | --------------------------------------------------------------------- |
| `bluegreen-active-v3`          | sessionStorage | Active tab's recipe, conditions, screen and sequence progress         |
| `bluegreen-history-v3`         | localStorage   | Append/merge-only completed device records, with explicit pin updates |
| `bluegreen-session-history-v3` | sessionStorage | Session-only new records and pending completion backups               |
| `bluegreen-notebook-privacy`   | localStorage   | Preference for device or tab-only storage of new records              |

A new tab/session starts with an empty draft. Same-tab reloads preserve progress and resume cultivation paused. An unfinished legacy local draft is offered through **Resume Previous Experiment**, not injected automatically into the vessel. Enter and Begin always clear active state for a fresh visitor. Explicit new-experiment actions replace only active state. Back/review navigation keeps the current recipe.

All legacy completed records are merged by ID without reevaluation or automatic pruning, including histories larger than the previous 24-record limit. Unknown record fields and raw legacy keys are retained. Concurrent device records are merged instead of replacing another tab's list. Corrupt device history is preserved rather than overwritten, and pending active/completed work is saved to the tab first where storage is available. Storage quota/security failures produce a notice; no application can guarantee persistence if browser storage is unavailable or the user clears it.

**Device mode** stores new completed records on this device. **Tab-only mode** stores new records for the current session, while previously saved device records remain intact and visible. Switching modes never silently deletes device records. Nothing is sent to a server or shared between different browsers.

## Outcome diagnosis and reference regression

The specified reference already evaluates as **Favourable Growth**: sawdust 60%, straw 40%, substrate moisture 62%, temperature 24°C, 18 days, treated substrate. It has no stressors or coverage flags under the existing educational rules. A state-to-evaluator regression and a complete real-browser result test now protect this path.

Repeated less-favourable outcomes have identifiable input causes:

- Previously, equal sawdust and coffee additions created 50% coffee, exceeding the model's illustrative 40% coffee density limit.
- Four positive materials deliberately fall outside this limited model's coverage; periods above 28 days are also unverified.
- Untreated substrate, extreme moisture/temperature or three combined stressors trigger the illustrative risk category.
- The old loader automatically restored earlier active recipes and settings from device storage, which could repeat an unwanted combination.
- The old ingredient count could inspect raw `portions` rather than the normalized recipe. The evaluator now counts actual positive recipe shares, so stale or zero-share selections cannot incorrectly change the coverage category.

No numeric growing threshold has been widened to manufacture success. All thresholds remain educational assumptions, separately documented from the published research context. No probabilities, strengths or biological guarantees are asserted. Explanations now identify actual ingredient percentages, temperature, substrate moisture, incubation duration, preparation and any extreme-range/coverage flags.

**Optional Reference Recipe** loads the named configuration without pre-completing mixing. The label explicitly states that favourable model conditions do not guarantee real biological success. Adjust, retry and compare keep the same four outcome IDs and recorded historical explanations.

## Inline recipe composition

The four jars and existing storybook environment remain. Drop/tap adds a selection without a popup. The permanently visible Recipe Composition panel below the vessel contains 5% sliders and exact integer inputs that rebalance the other selected shares using largest-remainder allocation; nonempty recipes total 100%. Zero-share selections remain editable, and removing an ingredient renormalizes the remainder. Two positive shares are required before mixing. Any actual recipe modification invalidates earlier stirring and run state. Textures and particle colours follow proportions; no fungal network is shown in mixing.

## Generative growth

`src/growthModel.js` is a deterministic bounded agent/trail model; `GenerativeGrowth.jsx` renders its transparent Canvas overlay over the selected substrate textures. Agents sense ahead/left/right, turn according to local trails, deposit traces, and feed a fading/diffusing trail field. A thinner, slowly fading display layer retains the developing network. Several inoculation sites, a restrained outward bias and occasional heading splits create expanding organic paths. The outcome only selects an artistic visual profile; it never feeds back into `evaluate()`.

The network is clipped by the exact same SVG substrate path and stays beneath glass reflections. Preparation has no network. Early/network/assessment stages emerge continuously. Pause, visibility changes and screen exit stop work; restart deterministically replays the same inputs/outcome. The simulation uses at most 220 agents and a 256 × 164 field, with bounded catch-up work and `requestAnimationFrame`. Reduced-motion begins paused; unsupported Canvas/Path2D gets a labelled static SVG fallback.

The supplied article's C++ source was inspected through Git, including sensing, steering, deposition and its evaporation operation. Attribution and the MIT notice are in `THIRD_PARTY_NOTICES.md` and `licenses/`. **Physarum is not fungal mycelium.** Density, coverage, speed and simulated days are illustrative artwork, not measured biology or material performance.

## Verification

- Unit regressions cover reference success, every outcome category, unchanged boundaries, normalized ratios/zeros, legacy migration, append-only records beyond 24, concurrent merges and notebook privacy.
- Browser tests exercise new visitors, reloads, new experiments, reference-to-result flow, comparison, mobile touch, inline ratio edits and invalidated stirring.
- Cache tests serve two actual SHA-tagged Vite production builds with 600-second cache headers. A fresh normal URL loads the current build; a previously cached context is verified to use HTTP-cached resources, detects a later release, and preserves active conditions/history through Update. The final address contains no version query. Manifest and hashed-asset consistency are checked.
- Growth tests check empty preparation, progressive stages, pause, deterministic restart, four distinct profiles, transparent pixels outside the substrate, hidden-page pause and static fallback. Stage screenshots are saved to `/tmp/growth-*.png`; recipe screenshots use `/tmp/bluegreen-*.png`.

The initial update/growth implementation passed 21 unit tests and 19 Chromium browser tests, including the production build/cache fixture. [Original review screenshots and a short growth recording](review/README.md) are retained for comparison. See [the visitor reset and inline controls review](visitor-sessions-and-inline-recipes.md) for the current interaction and captures.

Original implementation branch: `fix/experiment-growth-updates`; the visitor reset and inline controls refinement is on `fix/visitor-start-inline-recipe`. Production and the Pages deployment workflow are not merged or published automatically.
