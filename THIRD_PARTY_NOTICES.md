# Organic network visualisation reference

The visual approach is inspired by Pavel Peřina's agent-based Physarum simulation:

- Article: https://www.pavelp.cz/posts/eng-cpp-slime-mold-simulation/
- Source studied: https://github.com/pavel-perina/slime_mold
- Copyright (c) 2025 Pavel Peřina. MIT license reproduced in `licenses/pavel-perina-slime-mold-MIT.txt`.

BLUEGREEN uses an independently written, bounded JavaScript/Canvas adaptation of ahead/left/right trail sensing, steering, trail deposition and fading, with an added low-weight spatial diffusion pass. It does not port C++/SIMD/UI code. The reference's current `diffuse` operation is evaporation rather than a spatial blur.

Physarum is a slime mold, not fungal mycelium. Visual density, movement, timing and coverage in BLUEGREEN are artistic parameters, not biological measurements or predictions. The animation never changes the educational outcome evaluator.
