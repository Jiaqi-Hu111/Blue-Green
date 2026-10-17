/**
 * BLUEGREEN educational model v2 — deterministic, not empirically calibrated.
 * Every numeric range below is an EDUCATIONAL SIMULATION ASSUMPTION.
 * Research context is recorded separately in data/research.js. No species-specific
 * optimal range, measured probability, duration or mechanical property is asserted.
 * Moisture = water / wet substrate mass (%). Ambient humidity is not modeled.
 * Inoculum is a separate fixed illustrative starter; species and dose are not modeled.
 * Two/three-material blends are within this model's illustrative coverage. Four-way
 * blends and long incubation are unverified exploration, not unreliable diagnoses.
 * Untreated preparation adds an illustrative risk flag, not detected contamination.
 */
export const RULES = Object.freeze({
  version: 2,
  moistureIdeal: [55, 70],
  moistureExtreme: [40, 80],
  temperatureIdeal: [20, 28],
  temperatureExtreme: [15, 33],
  daysRange: [3, 35],
  daysIllustrative: [10, 28],
  coffeeLimit: 40,
  paperLimit: 50,
  supportedIngredientCount: [2, 3],
  maxHistory: 24,
  maxPortionsPerMaterial: 1000,
});
export const MATERIALS = [
  {
    id: "sawdust",
    name: "Sawdust",
    label: "WOOD / STRUCTURE",
    description:
      "A lignocellulosic scaffold. Wood particles create a framework for the growing network.",
    detail:
      "Particle size and wood type affect a real substrate. Here, each portion is an equal illustrative dry-mass unit.",
    tone: "#b5956f",
    position: "0% 0%",
  },
  {
    id: "coffee",
    name: "Coffee Grounds",
    label: "COFFEE / NUTRIENTS",
    description:
      "A nutrient-rich leftover. Dense, wet grounds can limit air movement in a blend.",
    detail:
      "This model flags blends above 40% coffee as dense. That threshold is an educational assumption, not a validated limit.",
    tone: "#735345",
    position: "100% 0%",
  },
  {
    id: "straw",
    name: "Straw",
    label: "FIBRE / AIR SPACE",
    description:
      "Plant fibres offer a framework and change the texture and air space of a blend.",
    detail:
      "Real preparation depends on fibre size, hydration and organism. The game does not prescribe a cultivation protocol.",
    tone: "#c8bc7d",
    position: "0% 100%",
  },
  {
    id: "paper",
    name: "Paper Fibres",
    label: "CELLULOSE / FIBRE",
    description:
      "A second life for cellulose. Paper absorbs water and can compact the mixture.",
    detail:
      "Use sorted, appropriate paper in real research. Inks, coatings and additives affect both growing and end-of-life choices.",
    tone: "#d2d2bc",
    position: "100% 100%",
  },
];
export const OUTCOMES = {
  success: {
    title: "A New Material Takes Shape!",
    label: "Favourable Growth",
    message:
      "In this illustrative model, the growing conditions allow a connected network to bind the substrate. A real material would still need moulding, drying, processing and testing.",
  },
  incomplete: {
    title: "Not Quite There Yet!",
    label: "Incomplete Growth",
    message:
      "The modeled network is patchy. Limiting conditions suggest a useful next experiment, rather than a final verdict on your materials.",
  },
  failed: {
    title: "Something Interrupted the Growth.",
    label: "High Contamination Risk",
    message:
      "The model flags preparation or environmental stress. The interrupted visualization is illustrative: no contamination has been observed or biologically diagnosed.",
  },
  unverified: {
    title: "An Experimental Discovery!",
    label: "Unverified Combination",
    message:
      "This combination is outside the model’s limited coverage. Its exploratory network does not predict growth, failure or material performance.",
  },
};
/** Largest-remainder allocation guarantees integer percentages totaling 100. */
export function percentages(portions) {
  const entries = MATERIALS.map((m) => [
    m.id,
    Math.max(0, Number(portions[m.id]) || 0),
  ]).filter(([, n]) => n > 0);
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  if (!total) return {};
  const shares = entries.map(([id, n]) => ({
    id,
    raw: (n / total) * 100,
    value: Math.floor((n / total) * 100),
  }));
  let remainder = 100 - shares.reduce((sum, s) => sum + s.value, 0);
  [...shares]
    .sort((a, b) => b.raw - b.value - (a.raw - a.value))
    .slice(0, remainder)
    .forEach((s) => s.value++);
  return Object.fromEntries(shares.map((s) => [s.id, s.value]));
}
/** Kept for existing recipe consumers. */
export function rebalance(recipe, id, value) {
  const rest = Object.keys(recipe).filter((k) => k !== id);
  if (!rest.length) return recipe;
  const next = {
    ...recipe,
    [id]: Math.max(0, Math.min(100, Math.round(value))),
  };
  const remaining = 100 - next[id],
    old = rest.reduce((s, k) => s + recipe[k], 0);
  let allocated = 0;
  rest.forEach((key, i) => {
    next[key] =
      i === rest.length - 1
        ? remaining - allocated
        : Math.round(remaining * (old ? recipe[key] / old : 1 / rest.length));
    allocated += next[key];
  });
  return next;
}
export function evaluate({
  recipe,
  moisture,
  temperature,
  portions,
  days = 18,
  treated = true,
}) {
  const reasons = [];
  let stress = 0;
  const outside = (value, range) => value < range[0] || value > range[1];
  const extreme =
    outside(moisture, RULES.moistureExtreme) ||
    outside(temperature, RULES.temperatureExtreme);
  if (moisture < RULES.moistureIdeal[0]) {
    stress++;
    reasons.push(
      "Low substrate moisture limits the water available in the model.",
    );
  } else if (moisture > RULES.moistureIdeal[1]) {
    stress++;
    reasons.push(
      "High substrate moisture reduces modeled air space and raises an illustrative risk.",
    );
  } else
    reasons.push(
      "Substrate moisture falls within the model’s illustrative 55–70% range. This is water / wet substrate mass, not ambient humidity.",
    );
  if (temperature < RULES.temperatureIdeal[0]) {
    stress++;
    reasons.push("Cool incubation slows the modeled network.");
  } else if (temperature > RULES.temperatureIdeal[1]) {
    stress++;
    reasons.push("Warm incubation adds a modeled stressor.");
  } else
    reasons.push(
      "Temperature falls within the illustrative 20–28°C range, not a universal optimum.",
    );
  if ((recipe.coffee || 0) > RULES.coffeeLimit) {
    stress++;
    reasons.push(
      "More than 40% coffee adds a density stressor in this educational model.",
    );
  }
  if ((recipe.paper || 0) > RULES.paperLimit) {
    stress++;
    reasons.push(
      "More than 50% paper adds a compaction stressor in this educational model.",
    );
  }
  if (days < RULES.daysIllustrative[0]) {
    stress++;
    reasons.push(
      `${days} modeled days leaves less time for connections in the illustrative sequence.`,
    );
  } else if (days > RULES.daysIllustrative[1])
    reasons.push(
      `${days} days is outside the model’s illustrative time coverage. Longer is not assumed to mean better.`,
    );
  else
    reasons.push(
      `${days} days sits within the model’s illustrative 10–28-day window. Real duration is species- and process-dependent.`,
    );
  reasons.push(
    treated
      ? "Treated substrate represents a preparation step; it does not guarantee sterility or safety."
      : "Untreated substrate triggers an illustrative contamination-risk flag. This is not a biological diagnosis.",
  );
  const count = Object.values(portions || recipe).filter((n) => n > 0).length;
  const unsupported =
    count < 2 || count > 3 || days > RULES.daysIllustrative[1];
  if (count > 3)
    reasons.push(
      "Four-material blends are outside this limited model’s coverage; the recipe remains unverified.",
    );
  if (count < 2)
    reasons.push(
      "At least two substrate materials are needed for the illustrative blend model.",
    );
  const outcome =
    !treated || extreme || stress >= 3
      ? "failed"
      : unsupported
        ? "unverified"
        : stress
          ? "incomplete"
          : "success";
  return {
    outcome,
    ...OUTCOMES[outcome],
    reasons,
    modelVersion: RULES.version,
    evidence: "Educational simulation assumptions — not a validated prediction",
  };
}
