/** Artistic agent/trail model inspired by Pavel Perina's Physarum reference.
 * Physarum is not fungal mycelium. These are visual parameters, NOT biology.
 * Independent implementation; see THIRD_PARTY_NOTICES.md. Never feeds evaluate().
 */
export const SUBSTRATE_PATH =
  "M68 92Q70 66 100 66H298Q328 66 332 96L349 235Q351 271 310 279H91Q50 271 52 238Z";
export const ASSESSMENT_STEPS = 720;
// Narrow sensors + gentler turns sustain small loops instead of rapidly merging
// the whole population into a few coarse routes. Higher population reinforces
// those fine connections; it does not increase displayed stroke width.
export const VISUAL_PROFILES = Object.freeze({
  success: {
    density: 0.7,
    sensor: 3.6,
    angle: 0.25,
    turn: 0.7,
    evaporation: 0.77,
    deposit: 1.55,
    habitat: 1,
  },
  incomplete: {
    density: 0.56,
    sensor: 3.6,
    angle: 0.25,
    turn: 0.7,
    evaporation: 0.77,
    deposit: 1.33,
    habitat: 0.68,
  },
  failed: {
    density: 0.49,
    sensor: 3.6,
    angle: 0.25,
    turn: 0.7,
    evaporation: 0.77,
    deposit: 1.22,
    habitat: 0.5,
  },
  unverified: {
    density: 0.63,
    sensor: 3.6,
    angle: 0.27,
    turn: 0.7,
    evaporation: 0.77,
    deposit: 1.44,
    habitat: 0.82,
  },
});
const ANGLES = 4096,
  MASK = ANGLES - 1,
  TAU = Math.PI * 2;
const SIN = Float32Array.from({ length: ANGLES }, (_, i) =>
  Math.sin((i * TAU) / ANGLES),
);
const COS = Float32Array.from({ length: ANGLES }, (_, i) =>
  Math.cos((i * TAU) / ANGLES),
);
export function hashSeed(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
// Recovery/Skip milestone, not a clock: playing continues beyond this count.
export function growthTarget(progress) {
  return Math.round(
    Math.max(0, Math.min(1, (progress - 20) / 80)) * ASSESSMENT_STEPS,
  );
}
export function visualQuality({ width = 390, memory = 8 } = {}) {
  return memory <= 2
    ? { width: 256, height: 176 }
    : width < 720
      ? { width: 384, height: 264 }
      : { width: 512, height: 352 };
}
export class TrailNetwork {
  constructor({
    outcome = "success",
    seed = 1,
    width = 320,
    height = 224,
  } = {}) {
    this.width = width;
    this.height = height;
    this.profile = VISUAL_PROFILES[outcome] || VISUAL_PROFILES.unverified;
    this.outcome = outcome;
    this.seed = seed >>> 0;
    this.field = new Float32Array(width * height);
    this.next = new Float32Array(width * height);
    this.habitat = new Float32Array(width * height);
    this.count = Math.round(width * height * this.profile.density);
    this.x = new Float32Array(this.count);
    this.y = new Float32Array(this.count);
    this.heading = new Uint16Array(this.count);
    this.iteration = 0;
    for (let i = 0; i < this.count; i++) {
      this.x[i] = this.random() * width;
      this.y[i] = this.random() * height;
      this.heading[i] = this.random() * ANGLES;
    }
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const nx = x / width,
          ny = y / height;
        const patches =
          Math.sin(nx * 11 + ny * 4) * Math.cos(ny * 10 - nx * 3) * 0.5 + 0.5;
        // Artistic uneven access/deposition; never a measured contamination map.
        this.habitat[y * width + x] =
          outcome === "success"
            ? 1
            : Math.max(
                0,
                Math.min(1, (patches - (1 - this.profile.habitat)) * 3),
              );
      }
  }
  random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  sample(x, y) {
    const w = this.width,
      h = this.height;
    x = x < 0 ? x + w : x >= w ? x - w : x;
    y = y < 0 ? y + h : y >= h ? y - h : y;
    return this.field[(y | 0) * w + (x | 0)];
  }
  step() {
    const w = this.width,
      h = this.height,
      p = this.profile;
    this.iteration++;
    const active = this.count;
    const turn = Math.round((p.turn / TAU) * ANGLES),
      sensorAngle = Math.round(((p.angle ?? 0.5) / TAU) * ANGLES);
    // Every agent senses the previous field; deposit only after all movement.
    for (let i = 0; i < active; i++) {
      let a = this.heading[i];
      const left = (a - sensorAngle) & MASK,
        right = (a + sensorAngle) & MASK;
      const x = this.x[i],
        y = this.y[i];
      const forward = this.sample(x + COS[a] * p.sensor, y + SIN[a] * p.sensor);
      const l = this.sample(x + COS[left] * p.sensor, y + SIN[left] * p.sensor);
      const r = this.sample(
        x + COS[right] * p.sensor,
        y + SIN[right] * p.sensor,
      );
      if (l > forward && l > r) a -= turn;
      else if (r > forward && r > l) a += turn;
      // A rotating ~0.2% exploratory cohort avoids a random draw for every
      // already-following agent. All agents still move/deposit every step.
      else if (forward === 0 || ((i + this.iteration) & 511) === 0)
        a += Math.round((this.random() - 0.5) * 80);
      a &= MASK;
      this.heading[i] = a;
      const nx = x + COS[a],
        ny = y + SIN[a];
      // Toroidal boundaries keep agents alive and the network reorganising.
      this.x[i] = nx < 0 ? nx + w : nx >= w ? nx - w : nx;
      this.y[i] = ny < 0 ? ny + h : ny >= h ? ny - h : ny;
    }
    for (let i = 0; i < active; i++) {
      const at = (this.y[i] | 0) * w + (this.x[i] | 0);
      this.field[at] += p.deposit * (0.85 + 0.15 * this.habitat[at]);
    }
    const source = this.field,
      next = this.next,
      diffusion = p.diffusion ?? 0.004;
    // Double-buffered spatial diffusion + evaporation without directional bias.
    for (let y = 0; y < h; y++) {
      const row = y * w,
        up = (y ? y - 1 : h - 1) * w,
        down = (y < h - 1 ? y + 1 : 0) * w;
      for (let x = 0; x < w; x++) {
        const i = row + x;
        next[i] =
          (source[i] * (1 - 4 * diffusion) +
            diffusion *
              (source[row + (x ? x - 1 : w - 1)] +
                source[row + (x < w - 1 ? x + 1 : 0)] +
                source[up + x] +
                source[down + x])) *
          p.evaporation;
      }
    }
    this.field = next;
    this.next = source;
  }
  advanceTo(target, budget = Infinity) {
    let count = 0;
    while (this.iteration < target && count++ < budget) this.step();
    return this.iteration >= target;
  }
  visibilityAt(i) {
    const h = this.habitat[i];
    return this.outcome === "failed"
      ? 0.08 + 0.92 * h
      : this.outcome === "incomplete"
        ? 0.15 + 0.85 * h
        : this.outcome === "unverified"
          ? 0.45 + 0.55 * h
          : 1;
  }
  coverage() {
    let count = 0;
    for (let i = 0; i < this.field.length; i++)
      if (this.field[i] * this.visibilityAt(i) > 1.5) count++;
    return count / this.field.length;
  }
}
