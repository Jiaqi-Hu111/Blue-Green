/** Published sources provide context, not calibration for the simulation. */
export const SOURCES = [
  {
    id: "haneef2017",
    title:
      "Advanced Materials From Fungal Mycelium: Fabrication and Tuning of Physical Properties",
    authors: "Haneef et al.",
    year: 2017,
    journal: "Scientific Reports 7, 41292",
    url: "https://doi.org/10.1038/srep41292",
  },
  {
    id: "appels2019",
    title:
      "Fabrication factors influencing mechanical, moisture- and water-related properties of mycelium-based composites",
    authors: "Appels et al.",
    year: 2019,
    journal: "Materials & Design 161, 64–71",
    url: "https://doi.org/10.1016/j.matdes.2018.11.027",
  },
  {
    id: "elsacker2019",
    title:
      "Mechanical, physical and chemical characterisation of mycelium-based composites with different types of lignocellulosic substrates",
    authors: "Elsacker et al.",
    year: 2019,
    journal: "PLOS ONE 14, e0213954",
    url: "https://doi.org/10.1371/journal.pone.0213954",
  },
 
];
export const REFERENCE_NOTES = [
  "Published research describes fungal mycelium growing through plant-derived substrates and binding them into composite structures.",
  "Fabrication choices, substrate composition and processing can influence material properties. Published experiments concern particular organisms and processes; their findings do not establish a universal recipe.",
  "Growth, shaping, drying and post-processing are separate steps. This game does not model measured performance or certify an application.",
];
export const APPLICATIONS = [
  {
    id: "packaging",
    title: "Protective Packaging",
    subtitle: "A softer landing",
    icon: "package",
    description:
      "Plant residues can be grown into shaped protective forms. A possible alternative to some disposable packaging, subject to product-specific testing.",
    considerations:
      "Cushioning, transport loads, moisture resistance and storage stability need testing before use.",
    form: "tray",
    source: "appels2019",
  },
  {
    id: "objects",
    title: "Decorative Objects",
    subtitle: "Objects with a growing story",
    icon: "vase",
    description:
      "Sculptural objects and experimental vessels explore the tactile surface of grown composites. Moulding and finishing give a material its final form.",
    considerations:
      "A decorative sample is not automatically food-safe, waterproof or suitable for outdoor use.",
    form: "vase",
    source: "haneef2017",
  },
  {
    id: "design",
    title: "Experimental Product Design",
    subtitle: "An invitation to prototype",
    icon: "layers",
    description:
      "Designers explore panels and product prototypes made from fungal composites. Different substrates and fabrication choices can produce different properties.",
    considerations:
      "Structural, acoustic, fire and durability claims require application-specific measurements.",
    form: "panel",
    source: "appels2019",
  },
];
export const LIFECYCLE = [
  {
    id: "waste",
    title: "Organic Waste",
    text: "Collect suitable plant-derived residues. Sorting matters: contaminants and mixed materials affect what can happen next.",
  },
  {
    id: "prepare",
    title: "Material Preparation",
    text: "Size reduction, hydration and appropriate treatment prepare a substrate. Real preparation protocols depend on the organism and the process.",
  },
  {
    id: "grow",
    title: "Mycelium Cultivation",
    text: "A separate living culture grows through the substrate. Species, inoculum, airflow, moisture and time all matter in real cultivation.",
  },
  {
    id: "form",
    title: "Biomaterial Formation",
    text: "Growth binds the substrate. Moulding establishes a shape; drying and further processing create a finished composite. The game stops short of these real processes.",
  },
  {
    id: "use",
    title: "Potential Applications",
    text: "Use requires appropriate testing. A simulated grown sample does not establish strength, safety or fitness for a product.",
  },
  {
    id: "return",
    title: "End-of-Life Pathways",
    text: "Reuse or suitable managed composting may be considered. Composition, coatings, additives and local disposal conditions determine the available routes. Do not assume direct soil disposal is suitable.",
  },
];
export const CONTEXT_HELP = [
  {
    title: "Welcome to BLUEGREEN",
    text: "A playable exhibition about giving waste a new life. Enter the laboratory, build a recipe and explore an illustrative material lifecycle.",
  },
  null, // Retired introductory stage; active journeys begin at step 2.
  {
    title: "Collect, drop & mix",
    text: "Drag an ingredient into the vessel, or tap its jar. Use the inline Recipe Composition sliders or exact percentage inputs to adjust or remove materials. Choose at least two positive shares, then select Mix Ingredients. Draw circles inside the vessel to stir, or use Auto Mix.",
  },
  {
    title: "Set growing conditions",
    text: "Drag each instrument vertically or use its slider and minus/plus controls. Swipe the incubation dial horizontally or tap a day. Substrate moisture is water as a proportion of wet substrate mass, not ambient humidity.",
  },
  {
    title: "Observe the transformation",
    text: "Pause or play the illustrated timeline, or skip to the assessment. Sequence progress is not a measurement of real mycelium growth. The selected incubation period is simulated; no real days need to pass.",
  },
  {
    title: "Read the findings",
    text: "Results follow transparent educational rules. Four states illustrate favorable conditions, limiting factors, contamination risk and combinations outside this model’s coverage. Save a result to pin it in your notebook.",
  },
  {
    title: "Follow the material",
    text: "Select a sample and drag it gently to change the viewing angle. Tap a lifecycle stop to explore its next life. End-of-life claims depend on the entire formulation and disposal conditions.",
  },
  {
    title: "Your field notebook",
    text: "Open any experiment, duplicate its recipe, or select two records and compare their inputs and explanations side by side. Device records stay on this browser; tab-only records and active progress stay in this tab’s session.",
  },
];
