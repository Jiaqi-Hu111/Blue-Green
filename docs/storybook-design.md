# Botanical storybook art direction

This iteration is based on the five actual images added to `design-references/` on `main`. The boards are art-direction references, not rendered UI, scientific evidence or application backgrounds.

| Reference                      | Implemented interpretation                                                                                                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01-ui-design-system.jpg.png`  | Aged-ivory surfaces, ink-green serif typography, outlined teal buttons, irregular paper frames, circular icon buttons, wood grain and a small terracotta-capped guide.                                                            |
| `02-welcome-screen.jpg.png`    | An original coastal illustration inside a separate greenhouse-window component, a programmable glass specimen vessel, an independent worktop and a single primary entry action.                                                   |
| `03-laboratory-scene.jpg.png`  | Ingredient shelves and an empty central vessel. A separate starter-culture label avoids treating inoculum as another waste ingredient.                                                                                            |
| `04-ingredient-mixing.jpg.png` | Four independent jars, pointer-controlled portion collection, falling particles, proportional substrate textures, a wood-mounted vessel and a selected-material tray. Its stirring arrows also inform the distinct stirring view. |
| `05-growth-conditions.jpg.png` | Framed thermometer and moisture instruments, a new interactive circular calendar, preparation choices and vertically stacked mobile instruments.                                                                                  |

There are no standalone stirring or growth-observation reference files in the supplied directory. Those scenes extend the board, mixing and laboratory references using original SVG linework, rather than claiming to reproduce an unavailable image.

## Independent art layers

- `public/images/coastal-storybook.png`: new original generated ink-and-watercolour coastal scenery. Contains no UI, controls, lettering or vessels.
- `public/images/illustrated-materials.png`: new original generated four-quadrant illustration atlas for sawdust, coffee, straw and paper. One local atlas is reused by jars, portions and the mixture.
- `CoastalWindow`, `BotanicalSprig` and `StoryDivider` in `src/components/Illustrations.jsx`: independent programmable environmental layers.
- Existing interactive SVG vessels, substrate particles, mycelium branches, sample forms and guide retain their functional state bindings and use the new print palette.
- The full reference images are never loaded by the running application. The older photographic/dark laboratory assets remain in the repository for provenance, but the new scenes do not render them.

## Composition and motion

Text uses clean paper surfaces; scenery stays behind the vessel or at the edges. The collection view shows the materials and composition, while stirring clears the shelves so the spoon and vessel become the focal interaction. Review Ingredients restores the tray without discarding the recipe. These are two presentation states of the existing persisted mixing step, preserving the v2 storage schema and record compatibility.

Nine visible stages are presented without reindexing the stored eight-step state: welcome, introduction, collection, stirring, conditions, growth, results, lifecycle and notebook. The chapter counter accounts for the stirring presentation state. The explicit English labels are “High Contamination Risk” and “Unverified Combination”; outcome IDs and evaluation thresholds remain unchanged.

The circular incubation instrument accepts pointer rotation and keyboard arrows/Home/End. The scrollable day selector and decrement/increment controls remain as alternatives. All paths update the same actual duration field. Native precision sliders remain available alongside the visual temperature and water instruments.

Motion is limited to ingredient drops, stirring, slow guide movement, water ripples and existing page transitions. Reduced-motion preference disables those ambient movements and button scaling. There are no neon particle effects or perpetual decorative parallax.

## Review and validation

Use `npm test`, `npm run build`, and `npm run test:e2e`. Browser coverage includes real Chromium touch dragging, circular stirring, the circular calendar, on-screen instrument bounds at 320/390/768/1440px, state restoration, all four outcomes and comparison. Screenshots are captured from the rendered production build, including the separate stirring view.

The `/Blue-Green/` base and existing deployment and review workflows remain unchanged. No Vercel configuration exists in the inspected checkout. This work belongs to `redesign/botanical-storybook` and is not automatically merged into `main`.
