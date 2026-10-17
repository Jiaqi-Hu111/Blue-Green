/** Mycelium-inspired visual model, NOT fungal biology. Independent JS adaptation
 * of agent/trail principles discussed by Pavel Peřina (Physarum slime mold).
 * See THIRD_PARTY_NOTICES.md. Visual profiles do not change evaluate(). */
export const SUBSTRATE_PATH =
  "M68 92Q70 66 100 66H298Q328 66 332 96L349 235Q351 271 310 279H91Q50 271 52 238Z";
export const VISUAL_PROFILES = Object.freeze({
  success: { agents: 220, speed: 1.1, extent: 1, fade: 0.994 },
  incomplete: { agents: 130, speed: 0.73, extent: 0.65, fade: 0.988 },
  failed: { agents: 50, speed: 0.5, extent: 0.4, fade: 0.975 },
  unverified: { agents: 170, speed: 0.92, extent: 0.8, fade: 0.991 },
});
export function hashSeed(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function growthTarget(progress) {
  return Math.round(Math.max(0, Math.min(1, (progress - 20) / 80)) * 240);
}
export class TrailNetwork {
  constructor({
    outcome = "success",
    seed = 1,
    width = 256,
    height = 164,
  } = {}) {
    this.width = width;
    this.height = height;
    this.profile = VISUAL_PROFILES[outcome] || VISUAL_PROFILES.unverified;
    this.seed = seed >>> 0;
    this.field = new Float32Array(width * height);
    this.next = new Float32Array(width * height);
    this.veins = new Float32Array(width * height);
    this.iteration = 0;
    this.agents = Array.from({ length: this.profile.agents }, (_, i) => {
      const sites = [
        [0.33, 0.42],
        [0.64, 0.57],
        [0.43, 0.68],
        [0.63, 0.3],
      ];
      const [x, y] = sites[i % sites.length];
      const angle =
        ((Math.floor(i / sites.length) % 9) / 9) * Math.PI * 2 +
        (this.random() - 0.5) * 0.14;
      return {
        x: x * width + this.random() * 2,
        y: y * height + this.random() * 2,
        angle,
        siteX: x * width,
        siteY: y * height,
        active: true,
      };
    });
  }
  random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  sample(x, y) {
    const px = Math.round(x),
      py = Math.round(y);
    return px < 1 || py < 1 || px >= this.width - 1 || py >= this.height - 1
      ? 0
      : this.field[py * this.width + px];
  }
  step() {
    const w = this.width,
      h = this.height,
      p = this.profile;
    this.iteration++;
    for (const a of this.agents) {
      if (!a.active) continue;
      const sensor = 4.5,
        angle = 0.55;
      const sense = (turn) =>
        this.sample(
          a.x + Math.cos(a.angle + turn) * sensor,
          a.y + Math.sin(a.angle + turn) * sensor,
        );
      const forward = sense(0),
        left = sense(-angle),
        right = sense(angle);
      if (left > forward && left > right) a.angle -= 0.15;
      else if (right > forward && right > left) a.angle += 0.15;
      else if (forward < left && forward < right)
        a.angle += this.random() < 0.5 ? -0.15 : 0.15;
      else a.angle += (this.random() - 0.5) * 0.14;
      // A small outward bias expands from separate inoculation points rather than wrapping at edges.
      const outward = Math.atan2(a.y - a.siteY, a.x - a.siteX);
      const delta = Math.atan2(
        Math.sin(outward - a.angle),
        Math.cos(outward - a.angle),
      );
      a.angle += delta * 0.16;
      if (this.iteration % 23 === 0 && this.random() < 0.2)
        a.angle += this.random() < 0.5 ? -0.48 : 0.48;
      let x = a.x + Math.cos(a.angle) * p.speed,
        y = a.y + Math.sin(a.angle) * p.speed;
      const radius = this.width * 0.72 * p.extent;
      if (
        x < 2 ||
        y < 2 ||
        x > w - 3 ||
        y > h - 3 ||
        Math.hypot(x - a.siteX, y - a.siteY) > radius
      ) {
        a.active = false;
        continue;
      }
      if (p.extent < 0.5 && this.iteration > 140 && this.random() < 0.65)
        continue;
      a.x = x;
      a.y = y;
      const index = Math.round(y) * w + Math.round(x);
      this.field[index] = Math.min(32, this.field[index] + 1.2);
      this.veins[index] = Math.min(12, this.veins[index] + 0.7);
    }
    if (this.iteration % 3 === 0) {
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          this.veins[i] *= p.extent < 0.5 ? 0.995 : 0.9999;
          this.next[i] =
            (this.field[i] * 0.96 +
              (this.field[i - 1] +
                this.field[i + 1] +
                this.field[i - w] +
                this.field[i + w]) *
                0.01) *
            p.fade;
        }
      [this.field, this.next] = [this.next, this.field];
    }
  }
  advanceTo(target, budget = Infinity) {
    let count = 0;
    while (this.iteration < target && count < budget) {
      this.step();
      count++;
    }
    return this.iteration >= target;
  }
  coverage() {
    let count = 0;
    for (const v of this.veins) if (v > 0.4) count++;
    return count / this.field.length;
  }
}
