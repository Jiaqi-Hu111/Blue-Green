# Light-blue laboratory scene review

This branch starts from main at `82db9f7` and changes only the background treatment of Mix Natural Ingredients, Give it a Swirl and Create Growth Conditions.

The application changes are confined to `src/style.css` and `src/assets/lab-corner.svg`. Shared CSS gradients provide the light-blue surface; one small SVG is mirrored into the two upper corners. The existing left-side and window foliage is hidden only within the requested scenes. The ornament is decorative, does not capture pointer input and sits behind the scene content.

The central harbour artwork and frame on mixing/stirring, vessels, jars, wooden tabletop, card styles, text, controls and element positions remain unchanged. The conditions page retains its existing hidden window. No game, simulation, animation, persistence, routing or deployment code was edited.

## Browser comparison

Screenshots use the same reference inputs and viewport sizes before and after the change. Mobile is 390 × 844; desktop is 1440 × 1000. Captures show the scene itself.

| Page | Mobile before | Mobile after | Desktop before | Desktop after |
| --- | --- | --- | --- | --- |
| Mix Natural Ingredients | [Before](review/light-blue-lab-scenes/before-mixing-mobile.png) | [After](review/light-blue-lab-scenes/after-mixing-mobile.png) | [Before](review/light-blue-lab-scenes/before-mixing-desktop.png) | [After](review/light-blue-lab-scenes/after-mixing-desktop.png) |
| Give it a Swirl | [Before](review/light-blue-lab-scenes/before-stirring-mobile.png) | [After](review/light-blue-lab-scenes/after-stirring-mobile.png) | [Before](review/light-blue-lab-scenes/before-stirring-desktop.png) | [After](review/light-blue-lab-scenes/after-stirring-desktop.png) |
| Create Growth Conditions | [Before](review/light-blue-lab-scenes/before-conditions-mobile.png) | [After](review/light-blue-lab-scenes/after-conditions-mobile.png) | [Before](review/light-blue-lab-scenes/before-conditions-desktop.png) | [After](review/light-blue-lab-scenes/after-conditions-desktop.png) |

## Validation

- Production build and all 28 unit tests passed.
- Seven existing Playwright tests passed: complete experiment journey, pointer drag/drop and circular stirring, touch stirring, condition instruments and keyboard/dial input, responsive layouts/subdirectory assets, instrument visibility, and the dedicated stirring scene.
- Additional Chromium comparisons at 320, 390, 768 and 1440px found identical text, element bounds and image URLs, with no horizontal overflow or page errors.
- Wooden tabletop CSS and the rendered interior surface pixels match the baseline. Rounded outer scene edges now meet the blue background.
- Instrument card CSS backgrounds and bounds match the baseline. The existing harbour images retain their original sources and dimensions on mixing/stirring; the conditions window stays hidden.
- Welcome and growth screenshots were pixel-identical to the baseline at all four tested widths.

The screenshots are review evidence only. They are not used as website backgrounds. Production deployment remains restricted to main; this branch is for manual review and merging.
