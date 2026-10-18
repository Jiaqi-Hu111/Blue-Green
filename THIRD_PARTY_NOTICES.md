# Organic network visualisation reference

The earlier trail-based visualisation was inspired by Pavel Peřina's agent-based Physarum simulation:

- Article: https://www.pavelp.cz/posts/eng-cpp-slime-mold-simulation/
- Source studied: https://github.com/pavel-perina/slime_mold (inspected commit `7dc0ab46948e59798f1c71f0182e0e9b310191ed`, simulation and preset implementations; article video and GUI output also examined).
- Copyright (c) 2025 Pavel Peřina. MIT license reproduced in `licenses/pavel-perina-slime-mold-MIT.txt`.

Earlier BLUEGREEN releases used an independently written, bounded JavaScript/Canvas adaptation of ahead/left/right trail sensing, steering, trail deposition and fading, with an added low-weight spatial diffusion pass. It does not port C++/SIMD/UI code. The reference's current `diffuse` operation is evaporation rather than a spatial blur.

Physarum is a slime mold, not fungal mycelium. Visual density, movement, timing and coverage in BLUEGREEN are artistic parameters, not biological measurements or predictions. The animation never changes the educational outcome evaluator.

The current colonisation renderer replaces trail sensing/fading with independently implemented growing tips, persistent branching and gap-filling filaments. Earlier attribution and the license are retained for provenance. The current artwork does not reproduce biological morphology or use experimentally calibrated visual coverage.
