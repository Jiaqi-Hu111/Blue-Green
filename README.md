# BLUEGREEN — Mycelium Lab

A vintage botanical storybook ecological laboratory about material lifecycle and waste transformation. Built with React, Vite, Tailwind CSS and Motion. All website text is English. No backend, accounts or external runtime image services are required.

## Run the exhibition

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/Blue-Green/`. In a cloud workspace, forward port **5173** and append `/Blue-Green/` to the forwarded address. The development server listens on all interfaces.

For the production build and browser preview:

```sh
npm test
npm run build
npm run preview
```

Open `http://localhost:4173/Blue-Green/`. The primary mobile viewport is **390 × 844**, with responsive compact-phone, tablet and desktop layouts and safe-area support.

## Nine visible stages

1. **Welcome** — start a fresh visitor journey, or explicitly choose Resume Previous Experiment.
2. **Explore the Laboratory** — tap ingredient jars for material research notes and meet Milo, an original SVG mycelium guide.
3. **Collect, Drop & Mix** — collect at least two materials by dragging or tapping illustrated jars. A permanently visible parchment Recipe Composition panel sits below the vessel, with 5% sliders, exact percentage inputs and direct removal. Nonempty blends always total 100%; zero-share selections remain editable.
4. **Stir Your Substrate** — the same lab clears around the vessel. Draw approximately two full circles or use **Auto Mix**. A wooden spoon, moving particles and the rim track progress. Review Ingredients preserves the blend.
5. **Growth Conditions** — use the interactive thermometer, moisture vessel and circular incubation calendar. Precision sliders, a scrollable day selector and minus/plus controls remain accessible alternatives. Treatment, moisture, temperature and time are real inputs.
6. **Watch Mycelium Grow** — observe four input-dependent, agent-based Canvas growth phases. Pause, play or skip. Reduced-motion mode begins paused; sequence progress is not measured colonization.
7. **Experiment Results** — read Favourable Growth, Incomplete Growth, High Contamination Risk or Unverified Combination, with input summaries and recorded explanations. Open details, pin a result or adjust and retry.
8. **Material Lifecycle** — rotate conceptual forms and explore three applications and six lifecycle stops. Growth, moulding, drying and post-processing remain separate; disposal depends on composition and conditions.
9. **Experiment Notebook** — open, duplicate and compare two experiments, including their model versions and changed inputs. Discarding an unfinished recipe requires confirmation.

See [visitor reset policy, acceptance checks and mobile captures](docs/visitor-sessions-and-inline-recipes.md).

The retained internal `portions` field is a compatibility representation of relative dry-substrate weights. New recipe edits use percentages, not repeated +1 taps or measured gram quantities. The mycelium culture is separate from waste percentages. **Optional Reference Recipe** supplies 60% sawdust / 40% straw at 62% substrate moisture, 24°C, 18 days and treated preparation, explicitly labelled as educational assumptions without a biological guarantee.

The active tab and completed notebook now have separate storage. See [the implementation and caching investigation](docs/updates-and-experiments.md) for the measured live headers, new storage keys, privacy choices, update behaviour and verification.

## Scientific scope and transparent rules

`src/simulation.js` contains the clearly documented deterministic model and its numeric assumptions; `src/data/research.js` records published context, educational copy and sources. No threshold is claimed to be a scientifically validated optimum, success probability, strength value or cultivation protocol.

| Model input        | Educational assumption                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Substrate moisture | 55–70% illustrative favorable range; outside 40–80% flags extreme conditions                          |
| Temperature        | 20–28°C illustrative favorable range; outside 15–33°C flags extreme conditions                        |
| Duration           | Under 10 days adds a limiting factor; 10–28 days is illustrative coverage; over 28 days is unverified |
| Recipe             | More than 40% coffee or 50% paper adds a modeled density/compaction stressor                          |
| Preparation        | Untreated substrate triggers an illustrative contamination-risk flag, not a diagnosis                 |
| Model coverage     | Two/three-material blends are modeled; four-material blends are unverified                            |

Within model coverage, zero stressors produces favorable growth and one/two produces incomplete growth. Three stressors, an extreme condition or untreated preparation produces a risk state. Known modeled risk flags take precedence over uncertainty. Otherwise an unsupported blend or long duration yields **Unverified Combination**. These categories explain the model; they do not establish actual biological performance.

Substrate moisture means water divided by **wet substrate mass**. It is not ambient relative humidity. Real results also depend on species, inoculum, sterilization, particle size, airflow and other omitted factors.

Research context:

- Haneef et al. (2017), _Advanced Materials From Fungal Mycelium_, Scientific Reports 7, 41292. https://doi.org/10.1038/srep41292
- Appels et al. (2019), _Fabrication factors influencing mechanical, moisture- and water-related properties of mycelium-based composites_, Materials & Design 161, 64–71. https://doi.org/10.1016/j.matdes.2018.11.027

These publications provide material and fabrication context; the game’s rules have not been fitted to their experimental data. Application scenes are conceptual, not certified products.

## Local progress and previous experiments

Enter the Laboratory and Begin Experiment always start a fresh visitor journey with an empty vessel, even in a reused tab. Same-tab reloads restore active progress from sessionStorage and pause cultivation. On Welcome, Resume Previous Experiment is a separate, explicit choice; Enter never resumes. Back/review navigation within the current experiment preserves the recipe. Legacy unfinished local recipes also require explicit resume. Completed device records are merged into `bluegreen-history-v3`, while the original v1/v2 keys remain untouched. There is no automatic 24-record pruning or reevaluation of older outcomes.

The notebook lets visitors choose device persistence or tab-only storage for **new** records. Both choices preserve existing device history. No visitor data is sent to a server. Explicit new-experiment actions clear only active state; back/review navigation keeps the recipe. Storage failures are reported and corrupt notebook bytes are preserved instead of overwritten.

Older records retain their recorded outcomes/explanations and model version. Missing historical incubation/preparation values remain **Not recorded**. Duplicating them uses clearly announced current defaults for review.

## Reusable components

- `src/components/Laboratory.jsx` — LaboratoryScene, IngredientJar, MixingVessel, StirringInteraction.
- `src/components/RecipeComposition.jsx` — inline 5% sliders, exact percentages, composition bar and removal.
- `src/components/Instruments.jsx` — Thermometer, MoistureInstrument, IncubationDial, PreparationControl.
- `src/components/Growth.jsx` — GrowthVisualization and rotatable MaterialSample.
- `src/components/Results.jsx` — ResultPanel.
- `src/components/Lifecycle.jsx` — LifecycleGallery.
- `src/components/Notebook.jsx` — ExperimentNotebook, ExperimentSummary and ComparisonPanel.
- `src/components/Common.jsx` — Mycelium guide (Guide), buttons, focus-trapped dialog, help and composition strip.
- `src/state.js` — safe restoration, migration, duplication and portion operations.

Pointer gestures have keyboard and tap alternatives. Instruments expose actual slider values and support arrow keys. Dialogs trap focus, close with Escape and restore focus. Page changes move focus to the current screen. Reduced-motion preferences suppress environmental animation and page motion. Original greenhouse and material-study artwork is bundled under `public/images`, and all asset URLs respect the repository base.

## Validation

```sh
npm test
npm run build
npm run test:e2e
```

The unit suite checks proportions, model boundaries, all four outcomes, uncertainty, preparation/time effects, migration and state preservation. The Playwright suite exercises the full journey, actual Chromium touch dragging, circular stirring, keyboard/instrument controls, persistence, comparison, English content, mobile/desktop layouts, reduced motion, storage denial and subdirectory assets. Screenshots are written to `/tmp/bluegreen-*.png`; traces are retained for failures.

The cloud uses `/usr/bin/chromium` automatically. On another machine or in CI:

```sh
npx playwright install chromium
npm run test:e2e
```

`CHROMIUM_EXECUTABLE_PATH` can select another installed browser. `.github/workflows/review.yml` runs model, build and browser checks on pull requests targeting `main`. It does not deploy Pages.

## GitHub Pages and review

This redesign is prepared on **`fix/visitor-start-inline-recipe`** for review. Do not merge or deploy it without review. The existing production deployment workflow and base path are preserved. Each build emits a commit-SHA `version.json`; visitors get a safe, optional Update prompt for later deployments. Runtime images now have content-based filenames. GitHub Pages HTTP headers remain controlled by GitHub, not by this app.

The repository is **Jiaqi-Hu111/Blue-Green**, with the case-sensitive Vite base **`/Blue-Green/`**. Screen navigation uses React state and browser history on the same document; no nested server routes or SPA redirect workaround are needed.

After reviewing and merging the branch into `main`:

1. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. The existing **Deploy BLUEGREEN to GitHub Pages** workflow runs on the `main` push. If Pages was enabled afterward, use **Actions → Deploy BLUEGREEN to GitHub Pages → Run workflow** on `main`.
3. After successful deployment, open **https://jiaqi-hu111.github.io/Blue-Green/**.

The deployment installs from the lockfile, runs unit tests, builds Vite, and uploads/deploys `dist` using Pages/OIDC permissions. No token is embedded in the app. The public URL represents the production branch; the review branch is not published automatically. Verify a deployment’s status before claiming the redesigned site is live.

## Artwork

The current scenes use original `coastal-storybook.png` scenery and an `illustrated-materials.png` atlas, with independent SVG environmental layers and interactive objects. The reference boards are never rendered as screens. Earlier assets are retained for provenance. All imagery is illustrative, not a physical experiment record. See [the art-direction and reference mapping](docs/storybook-design.md) for details. No external image URL is required at runtime.

The observation canvas is a **Mycelium-inspired generative visualisation**, adapted from agent/trail concepts in a Physarum slime mold model. Physarum is not fungal mycelium. See [attribution and licensing](THIRD_PARTY_NOTICES.md). The animation never determines the educational outcome.
