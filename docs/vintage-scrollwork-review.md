# Vintage scrollwork corner refinement

Refines the blue-panel ornaments from PR #14 using the supplied screenshot as a visual reference. The screenshot is not included in the website or used as a background.

The SVG now draws open interwoven curls, small counter-curls, fine muted blue-grey strokes and restrained diamond terminal accents. A responsive ornament size gives the scrollwork room on wider panels. The existing CSS mirrors the right corner; the decorative layers remain behind the windows/cards and cannot intercept pointer input.

Only the shared SVG and its absolute dimensions change in the application. The three blue panel backgrounds, wooden tabletop, harbour images, cards, vessels, jars, text, layout and interactions remain unchanged. This branch starts from main at `35b9770`, after PR #14 was merged.

## Visual review

| Page | Previous desktop ornament | New desktop ornament | New mobile ornament |
| --- | --- | --- | --- |
| Mix Natural Ingredients | [Previous](review/light-blue-lab-scenes/after-mixing-desktop.png) | [New](review/vintage-scrollwork/mixing-desktop.png) | [Mobile](review/vintage-scrollwork/mixing-mobile.png) |
| Give it a Swirl | [Previous](review/light-blue-lab-scenes/after-stirring-desktop.png) | [New](review/vintage-scrollwork/stirring-desktop.png) | [Mobile](review/vintage-scrollwork/stirring-mobile.png) |
| Create Growth Conditions | [Previous](review/light-blue-lab-scenes/after-conditions-desktop.png) | [New](review/vintage-scrollwork/conditions-desktop.png) | [Mobile](review/vintage-scrollwork/conditions-mobile.png) |

## Verification

- Production build and all 28 unit tests pass.
- Two existing Playwright tests pass: the complete experiment journey, and desktop/tablet/compact-phone layouts with production subdirectory assets.
- Additional Chromium comparisons at 320, 390, 768 and 1440px show identical text, element bounds, image URLs, card/background styles and controls. No horizontal overflow or browser page errors were reported.
- Wooden tabletop surface pixels match the previous version. Welcome and growth pages remain pixel-identical at all four viewport sizes.
- The ornament remains a lightweight SVG inlined by Vite into the production CSS; no dependency, screenshot background or gameplay code was added.
