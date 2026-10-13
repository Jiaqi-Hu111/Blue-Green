# BLUEGREEN — Mycelium Lab

A premium playable ecological laboratory about material lifecycle and waste transformation. Built with React, Vite, Tailwind CSS and Motion. All website text is English. No backend, accounts or external runtime image services are required.

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

## Eight connected stages

1. **Welcome** — enter an original botanical greenhouse world; resume a current experiment without losing it.
2. **Explore the Laboratory** — tap ingredient jars for material research notes and meet Milo, an original SVG mycelium guide.
3. **Collect, Drop & Mix** — drag a portion into the glass vessel or tap a jar; repeatedly add/remove equal illustrative dry-mass portions. Percentages use largest-remainder allocation and always sum to 100 for a nonempty blend. At least two substrates are required. Draw approximately two full circles in the vessel, or use **Auto Mix**. Rotational travel drives blending; back-and-forth jitter does not count as repeated full turns within one gesture.
4. **Growth Conditions** — drag thermometer liquid and substrate water level vertically, use sliders or minus/plus controls, and swipe or tap the incubation day wheel. Treatment, moisture, temperature and time are actual simulation inputs.
5. **Watch Mycelium Grow** — observe four procedural, input-dependent phases. Pause, play or skip. Reduced-motion mode begins paused. Animation progress is sequence progress, not measured colonization.
6. **Experiment Results** — inspect a deterministic favorable, incomplete, contamination-risk or unverified outcome, input summary and explanations. Open details, pin a result, refine it or explore its lifecycle.
7. **Material Lifecycle** — rotate conceptual material forms, explore three potential applications and tap six lifecycle stops. Growth, moulding, drying and post-processing are separate. End-of-life possibilities depend on the formulation and disposal conditions.
8. **Experiment Notebook** — open, duplicate and compare two experiments, including changed inputs, model versions and recorded explanations. New experiments keep existing records. Discarding an unfinished recipe requires confirmation.

Each portion represents an equal illustrative dry-mass unit, not a measured gram quantity. The mycelium culture is a separate fixed illustrative starter. Species and inoculum dose are not modeled and are not included in waste percentages. There is a 1,000-portion limit per ingredient to bound local state.

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

Within model coverage, zero stressors produces favorable growth and one/two produces incomplete growth. Three stressors, an extreme condition or untreated preparation produces a risk state. Known modeled risk flags take precedence over uncertainty. Otherwise an unsupported blend or long duration yields **Unverified Recipe**. These categories explain the model; they do not establish actual biological performance.

Substrate moisture means water divided by **wet substrate mass**. It is not ambient relative humidity. Real results also depend on species, inoculum, sterilization, particle size, airflow and other omitted factors.

Research context:

- Haneef et al. (2017), _Advanced Materials From Fungal Mycelium_, Scientific Reports 7, 41292. https://doi.org/10.1038/srep41292
- Appels et al. (2019), _Fabrication factors influencing mechanical, moisture- and water-related properties of mycelium-based composites_, Materials & Design 161, 64–71. https://doi.org/10.1016/j.matdes.2018.11.027

These publications provide material and fabrication context; the game’s rules have not been fitted to their experimental data. Application scenes are conceptual, not certified products.

## Local progress and previous experiments

Progress, blending, growing conditions, sequence progress and the latest **24** records are stored under `bluegreen-lab-v2`. A cultivation sequence resumes paused after reload. Revisiting its result does not create duplicate records. **Save Experiment** pins an existing record visually; all completed runs are already recorded automatically, and the 24-record limit still applies.

The application migrates `bluegreen-lab-v1` recipes and history without overwriting the old key. Recorded v1 outcomes and explanations stay as recorded and are marked as an earlier model. Incubation period and preparation were absent from v1; they display **Not recorded**, rather than invented historical values. Duplicating such a record uses current default settings (18 days and treated substrate) and asks the visitor to review them. Corrupted storage falls back safely. If local storage is blocked, the game continues in memory with a visible notice. Data is specific to the current browser/origin; it does not sync across devices.

## Reusable components

- `src/components/Laboratory.jsx` — LaboratoryScene, IngredientJar, IngredientTray, MixingVessel, StirringInteraction.
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

This redesign is prepared on **`redesign/enchanted-eco-laboratory`** for review. Do not merge or deploy it without review. The existing production deployment workflow and base path are preserved.

The repository is **Jiaqi-Hu111/Blue-Green**, with the case-sensitive Vite base **`/Blue-Green/`**. Screen navigation uses React state and browser history on the same document; no nested server routes or SPA redirect workaround are needed.

After reviewing and merging the branch into `main`:

1. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. The existing **Deploy BLUEGREEN to GitHub Pages** workflow runs on the `main` push. If Pages was enabled afterward, use **Actions → Deploy BLUEGREEN to GitHub Pages → Run workflow** on `main`.
3. After successful deployment, open **https://jiaqi-hu111.github.io/Blue-Green/**.

The deployment installs from the lockfile, runs unit tests, builds Vite, and uploads/deploys `dist` using Pages/OIDC permissions. No token is embedded in the app. The public URL represents the production branch; the review branch is not published automatically. Verify a deployment’s status before claiming the redesigned site is live.

## Artwork

`laboratory.png`, `materials.png` and the retained `mycelium.png` are original generated illustrative artworks, not records of physical experiments. Procedural SVG provides the vessel, instruments, guide, input-dependent mycelium networks and samples. No external image URL is required at runtime.
