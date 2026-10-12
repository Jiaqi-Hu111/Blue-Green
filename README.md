# BLUEGREEN — Mycelium Lab

An interactive, mobile-first material lifecycle exhibition. Six working screens guide visitors from waste selection through a recipe, animated growth, explanatory results and a local experiment notebook. React + Vite, Tailwind CSS and Motion. No backend, accounts or runtime image services.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/Blue-Green/` in your browser. The server listens on all interfaces for remote development; use your cloud provider's forwarded port 5173 when browsing from another machine. A 390 × 844 viewport is the primary mobile design target.

```sh
npm test
npm run build
npm run preview
```

The production preview is at `http://localhost:4173/Blue-Green/`. Run browser tests with `npx playwright test`. The supplied browser test configuration uses `/usr/bin/chromium` in this cloud environment. On another machine install Playwright Chromium with `npx playwright install chromium` and remove `executablePath` from `playwright.config.js`.

## GitHub Pages

The selected repository is **Jiaqi-Hu111/Blue-Green**, so Vite uses the case-sensitive base **`/Blue-Green/`**. The originally proposed `/bluegreen-game/` only works if the repository is renamed to `bluegreen-game`; in that case update `vite.config.js` accordingly.

1. Push the project files, including `.github/workflows/deploy.yml`, to `main`.
2. In the GitHub repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Open **Actions → Deploy BLUEGREEN to GitHub Pages**. Push to `main` or use **Run workflow** after enabling Pages.
4. After the build and deployment succeed, open **https://jiaqi-hu111.github.io/Blue-Green/**.

The workflow installs from the lockfile, runs simulation tests, builds Vite and uploads/deploys `dist`. It uses Pages and OIDC permissions, with no personal token required. This URL is a deployment target; its availability must be verified after a successful deployment.

Navigation uses React state rather than nested URLs, so it needs no Pages SPA redirect hack. Asset paths use `import.meta.env.BASE_URL`; all images are bundled in `public/images`. Browser reloads restore progress from localStorage. The latest 12 experiments are retained on the current origin/device. Storage may be unavailable in restrictive browsers; the application continues in memory and reports that limitation.

## Scientific scope

`src/simulation.js` is the separate documented rule configuration and deterministic evaluator. The moisture and temperature ranges and recipe limits are **illustrative simulation assumptions**, not experimentally validated thresholds. No success probabilities, incubation durations or strength values are predicted. Moisture is water as a proportion of wet substrate mass; ambient relative humidity is not modeled. Inoculation, sterilization, species, airflow, additives and actual cultivation must be addressed in real experiments.

Research context:
- Haneef et al. (2017), *Advanced Materials From Fungal Mycelium*, Scientific Reports 7, 41292. https://doi.org/10.1038/srep41292
- Appels et al. (2019), *Fabrication factors influencing mechanical, moisture- and water-related properties of mycelium-based composites*, Materials & Design 161, 64–71. https://doi.org/10.1016/j.matdes.2018.11.027

Photorealistic botanical and material-study images are generated illustrative artwork, not documentation of measured experiments. The network and sample visuals are procedural educational representations. Reduced-motion preferences are respected by page transitions. Controls support keyboard input and have accessible names; the research dialog supports Escape and focus trapping.
