/** Persistent, tip-based colonisation artwork. All parameters below are artistic
 * assumptions, NOT fungal morphology, elapsed biological time or outcome data.
 * This module never calls or feeds evaluate(). Coverage is a raster diagnostic.
 */
export const SUBSTRATE_PATH = "M68 92Q70 66 100 66H298Q328 66 332 96L349 235Q351 271 310 279H91Q50 271 52 238Z";
export const SUBSTRATE_BOUNDS = {
  x: 50,
  y: 66,
  width: 302,
  height: 215
};
export const ASSESSMENT_STEPS = 720;
export const GROWTH_DURATION_MS = 16000;
export const VISIBLE_INK = 0.35;
export const VISUAL_PROFILES = Object.freeze({
  success: {
    target: 0.935,
    reach: 2,
    branching: 0.065
  },
  incomplete: {
    target: 0.52,
    reach: 0.25,
    branching: 0.05
  },
  failed: {
    target: 0.20,
    reach: 0.17,
    branching: 0.035
  },
  unverified: {
    target: 0.63,
    reach: 0.29,
    branching: 0.055
  }
});
// Coverage requests control how many new filament segments are grown, never an
// image opacity or a precomputed white overlay. Even the final fill is branches.
const DEVELOPMENT = [
  [0, 0], [0.025, 0], [0.05, 0.001], [0.15, 0.012], [0.25, 0.065],
  [0.45, 0.25], [0.5, 0.35], [0.75, 0.75], [0.8, 0.84], [1, 1]
];
export function growthTarget(progress) {
  return Math.round(Math.max(0, Math.min(100, progress)) / 100 * ASSESSMENT_STEPS);
}
export function visualQuality({
  width = 390,
  memory = 8
} = {}) {
  return memory <= 2 ? {
    width: 256,
    height: 176
  } : width < 720 ? {
    width: 384,
    height: 264
  } : {
    width: 512,
    height: 352
  };
}
export function hashSeed(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
// Flatten the same vessel outline for an engine-side raster mask. The Canvas
// also clips to the exact Path2D, so subpixel edge differences cannot leak ink.
const OUTLINE = [[68, 92]];
function curve(cx, cy, x, y) {
  const [sx, sy] = OUTLINE.at(-1);
  for (let i = 1; i <= 16; i++) {
    const t = i / 16,
      a = 1 - t;
    OUTLINE.push([a * a * sx + 2 * a * t * cx + t * t * x, a * a * sy + 2 * a * t * cy + t * t * y]);
  }
}
curve(70, 66, 100, 66);
OUTLINE.push([298, 66]);
curve(328, 66, 332, 96);
OUTLINE.push([349, 235]);
curve(351, 271, 310, 279);
OUTLINE.push([91, 279]);
curve(50, 271, 52, 238);
OUTLINE.push([68, 92]);
function makeMask(width, height) {
  const mask = new Uint8Array(width * height),
    b = SUBSTRATE_BOUNDS;
  for (let y = 0; y < height; y++) {
    const py = b.y + (y + 0.5) / height * b.height,
      intersections = [];
    for (let i = 1; i < OUTLINE.length; i++) {
      const [x0, y0] = OUTLINE[i - 1],
        [x1, y1] = OUTLINE[i];
      if ((y0 > py) !== (y1 > py)) intersections.push(x0 + (py - y0) / (y1 - y0) * (x1 - x0));
    }
    if (!intersections.length) continue;
    const left = Math.min(...intersections),
      right = Math.max(...intersections);
    for (let x = 0; x < width; x++) {
      const px = b.x + (x + 0.5) / width * b.width;
      if (px >= left && px <= right) mask[y * width + x] = 1;
    }
  }
  return mask;
}
export class ColonisationNetwork {
  constructor({
    outcome = "success",
    seed = 1,
    width = 384,
    height = 264
  } = {}) {
    this.width = width;
    this.height = height;
    this.scale = width / 384;
    this.profile = VISUAL_PROFILES[outcome] || VISUAL_PROFILES.unverified;
    this.seed = seed >>> 0;
    this.iteration = 0;
    this.segments = 0;
    this.field = new Float32Array(width * height);
    this.backbone = new Float32Array(width * height);
    this.dirty = new Int32Array(width * height);
    this.dirtyFlags = new Uint8Array(width * height);
    this.dirtyCount = 0;
    this.mask = makeMask(width, height);
    this.area = this.mask.reduce((a, b) => a + b, 0);
    this.allowed = new Uint8Array(this.mask.length);
    this.queued = new Uint8Array(this.mask.length);
    this.frontier = new Int32Array(this.mask.length);
    this.frontierCount = 0;
    this.covered = 0;
    this.tips = [];
    this.cursor = 0;
    this.sites = [[.22, .25], [.73, .26], [.43, .61], [.78, .78], [.18, .78]].map(([x, y]) => [x + (this.random() - .5) * .055, y + (this.random() - .5) * .055]);
    let reach = this.profile.reach,
      capacity;
    do {
      capacity = 0;
      for (let i = 0; i < this.mask.length; i++) {
        if (!this.mask[i]) continue;
        const x = (i % width + .5) / width,
          y = ((i / width | 0) + .5) / height;
        let distanceSquared = Infinity;
        for (const [sx, sy] of this.sites) {
          const dx = x - sx,
            dy = y - sy;
          distanceSquared = Math.min(distanceSquared, dx * dx + dy * dy);
        }
        // Lobed footprint is illustrative access, never a contamination map.
        const edge = Math.sin(x * 31 + y * 7) * Math.cos(y * 25 - x * 4) * .025;
        this.allowed[i] = distanceSquared < (reach + edge) * (reach + edge) ? 1 : 0;
        capacity += this.allowed[i];
      }
      reach += .025;
    } while (capacity < this.area * (this.profile.target + .055));
  }
  random() {
    this.seed = Math.imul(1664525, this.seed) + 1013904223 >>> 0;
    return this.seed / 4294967296;
  }
  index(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return -1;
    return (y | 0) * this.width + (x | 0);
  }
  enqueue(i) {
    if (!this.allowed[i] || this.queued[i] || this.field[i] >= VISIBLE_INK) return;
    this.queued[i] = 1;
    this.frontier[this.frontierCount++] = i;
  }
  brush(x0, y0, x1, y1, radius, opacity, primary = false) {
    const w = this.width,
      h = this.height;
    const left = Math.max(0, Math.floor(Math.min(x0, x1) - radius - .5));
    const right = Math.min(w - 1, Math.ceil(Math.max(x0, x1) + radius + .5));
    const top = Math.max(0, Math.floor(Math.min(y0, y1) - radius - .5));
    const bottom = Math.min(h - 1, Math.ceil(Math.max(y0, y1) + radius + .5));
    const dx = x1 - x0,
      dy = y1 - y0,
      length = dx * dx + dy * dy;
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const i = y * w + x;
      if (!this.allowed[i]) continue;
      const t = length ? Math.max(0, Math.min(1, ((x + .5 - x0) * dx + (y + .5 - y0) * dy) / length)) : 0;
      const distance = Math.hypot(x + .5 - x0 - t * dx, y + .5 - y0 - t * dy);
      const amount = Math.max(0, Math.min(1, radius + .5 - distance)) * opacity;
      if (!amount) continue;
      const old = this.field[i];
      // Small intrinsic variation keeps mature fibres legible. There is no
      // evaporation, white background fill or stage-wide opacity adjustment.
      const cap = .83 + .11 * ((Math.imul(i + 1, 2654435761) >>> 0) / 4294967296);
      const ink = old + amount * Math.max(0, cap - old);
      this.field[i] = ink;
      if (!this.dirtyFlags[i]) {
        this.dirtyFlags[i] = 1;
        this.dirty[this.dirtyCount++] = i;
      }
      // Preserve early structural fibres above the later, softer infill layer.
      if (primary && this.iteration <= ASSESSMENT_STEPS * .45) this.backbone[i] = Math.max(this.backbone[i], ink);
      if (old < VISIBLE_INK && ink >= VISIBLE_INK) {
        this.covered++;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox,
            ny = y + oy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) this.enqueue(ny * w + nx);
        }
      }
    }
    this.segments++;
  }
  newTip(x, y, angle, fine = false) {
    if (this.tips.length >= 512) return;
    this.tips.push({
      x,
      y,
      angle,
      age: 0,
      stale: 0,
      curl: 0,
      radius: this.scale * (fine ? .25 + this.random() * .12 : .35 + this.random() * .18),
      opacity: .72 + this.random() * .18
    });
  }
  sprout() {
    // Every infill branch starts on a formed filament and grows into a nearby
    // gap. No detached dots or pre-rendered layer is introduced at maturity.
    for (let tries = 0; tries < 24 && this.frontierCount; tries++) {
      const slot = this.random() * this.frontierCount | 0;
      const i = this.frontier[slot];
      this.frontier[slot] = this.frontier[--this.frontierCount];
      if (this.field[i] >= VISIBLE_INK) continue;
      const x = i % this.width,
        y = i / this.width | 0;
      let anchor = -1,
        strongest = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const j = this.index(x + ox, y + oy);
        if (j >= 0 && this.field[j] >= VISIBLE_INK && this.field[j] > strongest) {
          strongest = this.field[j];
          anchor = j;
        }
      }
      if (anchor < 0) continue;
      const sx = anchor % this.width + .5,
        sy = (anchor / this.width | 0) + .5;
      const tx = x + .5,
        ty = y + .5;
      this.brush(sx, sy, tx, ty, this.scale * .36, .88);
      if (this.field[i] < VISIBLE_INK) {
        // Retry a weak antialiased edge from the same parent, never fill it.
        this.queued[i] = 0;
        this.enqueue(i);
      }
      this.newTip(tx, ty, Math.atan2(ty - sy, tx - sx), true);
      return true;
    }
    return false;
  }
  extend() {
    if (!this.tips.length) return this.sprout();
    this.cursor %= this.tips.length;
    const tip = this.tips[this.cursor],
      step = this.scale * (1.1 + this.random() * .45);
    let best = -Infinity,
      heading = tip.angle;
    tip.curl = tip.curl * .75 + (this.random() - .5) * .22;
    for (const turn of [-.85, -.42, 0, .42, .85]) {
      const a = tip.angle + turn + tip.curl,
        dx = Math.cos(a),
        dy = Math.sin(a);
      const near = this.index(tip.x + dx * step, tip.y + dy * step);
      const far = this.index(tip.x + dx * step * 3, tip.y + dy * step * 3);
      if (near < 0 || far < 0 || !this.allowed[near] || !this.allowed[far]) continue;
      const score = 1 - this.field[far] * .75 - this.field[near] * .25 - Math.abs(turn) * .07 + (this.random() - .5) * .09;
      if (score > best) {
        best = score;
        heading = a;
      }
    }
    if (best !== -Infinity) {
      const x = tip.x + Math.cos(heading) * step,
        y = tip.y + Math.sin(heading) * step;
      const before = this.covered;
      this.brush(tip.x, tip.y, x, y, tip.radius, tip.opacity, true);
      tip.x = x;
      tip.y = y;
      tip.angle = heading;
      tip.age++;
      tip.stale = before === this.covered ? tip.stale + 1 : 0;
      if (tip.age > 3 && this.random() < this.profile.branching) this.newTip(x, y, heading + (this.random() < .5 ? -1 : 1) * (.65 + this.random() * .5));
    }
    if (best === -Infinity || tip.stale > 5 || tip.age > 65) {
      this.tips[this.cursor] = this.tips.at(-1);
      this.tips.pop();
    } else this.cursor++;
    return true;
  }
  step() {
    if (this.iteration >= ASSESSMENT_STEPS) return;
    this.iteration++;
    const progress = this.iteration / ASSESSMENT_STEPS;
    let development = 0;
    for (let j = 1; j < DEVELOPMENT.length; j++) {
      const [to, end] = DEVELOPMENT[j],
        [from, start] = DEVELOPMENT[j - 1];
      if (progress <= to) {
        development = start + (end - start) * (progress - from) / (to - from);
        break;
      }
    }
    const desired = Math.ceil(this.area * this.profile.target * development);
    if (this.iteration === 1) for (const [x, y] of this.sites) for (let j = 0; j < 3; j++) this.newTip(x * this.width, y * this.height, this.random() * Math.PI * 2);
    const budget = Math.min(1800, Math.max(16, (desired - this.covered) * 4));
    for (let i = 0; i < budget && this.covered < desired; i++) {
      const infill = progress < .45 ? .015 : .12 + .45 * (progress - .45) / .55;
      if (this.random() < infill && this.sprout()) continue;
      this.extend();
    }
  }
  advanceTo(target, budget = Infinity) {
    target = Math.max(0, Math.min(ASSESSMENT_STEPS, target));
    let count = 0;
    while (this.iteration < target && count++ < budget) this.step();
    return this.iteration >= target;
  }
  coverage() {
    return this.covered / this.area;
  }
}
