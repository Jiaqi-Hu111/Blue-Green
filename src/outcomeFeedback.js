/** Educational feedback, not a second evaluator. No thresholds or outcomes change.
 * Only new completions receive a feedback snapshot. Historical reasons stay intact.
 * General research context is separate from the deterministic RULES assumptions.
 */
import { MATERIALS, RULES } from "./simulation.js";
const outside = (value, [min, max]) => value < min || value > max;
export function describeExperiment(
  { recipe, moisture, temperature, days, treated },
  outcome,
) {
  const blend = MATERIALS.filter((m) => recipe[m.id] > 0)
    .map((m) => m.name + " " + recipe[m.id] + "%")
    .join(", ");
  const count = Object.values(recipe).filter((n) => n > 0).length;
  const densityFlags = [
    (recipe.coffee || 0) > RULES.coffeeLimit
      ? "Coffee Grounds " +
        recipe.coffee +
        "% exceeds the illustrative " +
        RULES.coffeeLimit +
        "% limit"
      : null,
    (recipe.paper || 0) > RULES.paperLimit
      ? "Paper Fibres " +
        recipe.paper +
        "% exceeds the illustrative " +
        RULES.paperLimit +
        "% limit"
      : null,
  ].filter(Boolean);
  const dense = densityFlags.length > 0;
  const factors = [
    {
      id: "recipe",
      label: "Your blend",
      status:
        count < 2 || count > 3 ? "outside" : dense ? "limiting" : "within",
      text:
        blend +
        (count < 2
          ? ". At least two positive materials are needed for this blend model."
          : count > 3
            ? ". Four positive ingredients are outside this model’s coverage."
            : dense
              ? ". " + densityFlags.join("; ") + "."
              : ". No coffee/paper density flag is triggered."),
    },
    {
      id: "moisture",
      label: "Substrate moisture",
      status: outside(moisture, RULES.moistureExtreme)
        ? "risk"
        : outside(moisture, RULES.moistureIdeal)
          ? "limiting"
          : "within",
      text:
        moisture +
        "% water / wet substrate mass. " +
        (outside(moisture, RULES.moistureExtreme)
          ? "Outside the model’s 40–80% guard range."
          : outside(moisture, RULES.moistureIdeal)
            ? "Outside the model’s 55–70% illustrative band."
            : "Within the model’s 55–70% illustrative band.") +
        " Ambient humidity is a different quantity and is not simulated.",
    },
    {
      id: "temperature",
      label: "Incubation temperature",
      status: outside(temperature, RULES.temperatureExtreme)
        ? "risk"
        : outside(temperature, RULES.temperatureIdeal)
          ? "limiting"
          : "within",
      text:
        temperature +
        "°C. " +
        (outside(temperature, RULES.temperatureExtreme)
          ? "Outside the model’s 15–33°C guard range."
          : outside(temperature, RULES.temperatureIdeal)
            ? "Outside the model’s 20–28°C illustrative band."
            : "Within the model’s 20–28°C illustrative band; not a universal fungal optimum."),
    },
    {
      id: "days",
      label: "Incubation duration",
      status:
        days > RULES.daysIllustrative[1]
          ? "outside"
          : days < RULES.daysIllustrative[0]
            ? "limiting"
            : "within",
      text:
        days +
        " simulated days. " +
        (days > RULES.daysIllustrative[1]
          ? "Longer than the model’s 28-day coverage. Longer is not assumed to be better."
          : days < RULES.daysIllustrative[0]
            ? "Below the illustrative 10-day connection window."
            : "Within the illustrative 10–28-day coverage. Real duration depends on species and process."),
    },
    {
      id: "preparation",
      label: "Substrate preparation",
      status: treated ? "within" : "risk",
      text: treated
        ? "Treated substrate: the model’s preparation flag is satisfied. This does not establish sterility or safety."
        : "Untreated substrate triggers the model’s illustrative risk flag. No contamination has been detected.",
    },
  ];
  const adjustments = [];
  if (count < 2 || count > 3)
    adjustments.push(
      "Compare a blend of two or three positive ingredients. A four-material blend is unverified here, not proven unsuitable.",
    );
  if ((recipe.coffee || 0) > RULES.coffeeLimit)
    adjustments.push(
      "Reduce Coffee Grounds from " +
        recipe.coffee +
        "% toward 40% or less to remove this model’s density flag. Rebalance with another selected material.",
    );
  if ((recipe.paper || 0) > RULES.paperLimit)
    adjustments.push(
      "Reduce Paper Fibres from " +
        recipe.paper +
        "% toward 50% or less to remove this model’s compaction flag.",
    );
  if (outside(moisture, RULES.moistureIdeal))
    adjustments.push(
      "Compare substrate moisture within the model’s 55–70% band, keeping the other settings constant. This is not an experimentally validated target.",
    );
  if (outside(temperature, RULES.temperatureIdeal))
    adjustments.push(
      "Compare a temperature within the model’s 20–28°C band. A real optimum would need a specified organism and process.",
    );
  if (days < RULES.daysIllustrative[0] || days > RULES.daysIllustrative[1])
    adjustments.push(
      "Compare a duration within the model’s 10–28-day window. The game does not predict how many real days your material needs.",
    );
  if (!treated)
    adjustments.push(
      "Compare the treated setting to explore the preparation flag. The game does not prescribe a sterilisation protocol.",
    );
  if (!adjustments.length)
    adjustments.push(
      "Keep this as a comparison recipe. Change one input on your next model experiment to see what it affects.",
    );
  const summary =
    outcome === "success"
      ? "Your inputs trigger no limiting, risk or coverage flags in this educational model. Real growth and material performance are still untested."
      : outcome === "incomplete"
        ? "The model marks one or two inputs as limiting. These are useful comparisons for another attempt, not measured evidence of patchy growth."
        : outcome === "failed"
          ? "Preparation, an extreme input or three combined stress flags put this recipe in the illustrative risk category. This does not confirm contamination."
          : "The ingredient count or incubation period is outside the model’s supported coverage. This is uncertainty, not proof of an unsuccessful substrate.";
  return {
    version: 1,
    summary,
    factors,
    adjustments,
    note: "Change one factor at a time for a clearer model comparison. These suggestions are educational, not cultivation instructions or guarantees.",
  };
}

export const EVIDENCE_TABLE = [
  {
    topic: "Materials",
    principle:
      "Substrate type, fibre condition and processing influence colonisation and composite properties.",
    assumption:
      "Coffee >40% and paper >50% each add one stress flag. Only two/three-material blends are covered.",
    sources: ["elsacker2019", "appels2019"],
  },
  {
    topic: "Water",
    principle:
      "Water availability and substrate water-holding characteristics matter; substrate moisture and air humidity differ.",
    assumption:
      "55–70% is the game band; outside 40–80% invokes risk. All values use wet substrate mass.",
    sources: ["fungar2021"],
  },
  {
    topic: "Temperature & time",
    principle:
      "Research protocols specify an organism, environment and incubation schedule; no universal optimum follows.",
    assumption:
      "20–28°C and 10–28 days are illustrative. Outside 15–33°C invokes risk; >28 days is unverified.",
    sources: ["fungar2021"],
  },
  {
    topic: "Preparation",
    principle:
      "Preparation and controlled cultivation form part of research-specific fabrication processes.",
    assumption:
      "The untreated toggle always invokes illustrative risk. Treated does not guarantee sterility.",
    sources: ["haneef2017", "fungar2021"],
  },
  {
    topic: "Classification & imagery",
    principle:
      "These sources do not validate BLUEGREEN’s four deterministic outcomes or stylised growth artwork.",
    assumption:
      "Risk takes precedence: untreated, extreme inputs or three stress flags. Otherwise unsupported count/time is unverified. Within coverage: zero stress flags is favourable; one/two is incomplete. Visual density never changes a result.",
    sources: [],
  },
];
