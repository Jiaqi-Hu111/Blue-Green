import { MATERIALS } from "../simulation";
import { CompositionStrip } from "./Common";
import { MaterialTexture } from "./Laboratory";
export function RecipeComposition({ draft, recipe, onChange, onRemove }) {
  const ingredients = MATERIALS.filter((m) =>
    Object.hasOwn(draft.portions, m.id),
  );
  const empty = ingredients.length === 0;
  return (
    <section
      className={`recipe-composition ${empty ? "is-empty" : ""}`}
      aria-labelledby="recipe-composition-title"
    >
      <div className="recipe-heading">
        <span className="eyebrow">FIELD NOTES / YOUR BLEND</span>
        <h2 id="recipe-composition-title">Recipe Composition</h2>
      </div>
      <CompositionStrip recipe={recipe} />
      {empty ? (
        <p className="recipe-empty">Add ingredients to begin</p>
      ) : (
        <>
          <div className="recipe-total">
            Total composition <strong>100%</strong>
          </div>
          <p className="recipe-instruction">
            Slide in 5% steps, or type an exact value. The other ingredients
            rebalance.
          </p>
          {ingredients.map((m) => (
            <div className="recipe-composition-row" key={m.id}>
              <MaterialTexture material={m} className="portion-thumbnail" />
              <label htmlFor={`ratio-${m.id}`}>{m.name}</label>
              <div className="recipe-number">
                <input
                  aria-label={`${m.name} exact percentage`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  step="1"
                  value={recipe[m.id] || 0}
                  onChange={(e) => {
                    if (e.target.value !== "")
                      onChange(m.id, Number(e.target.value));
                  }}
                />
                %
              </div>
              <input
                id={`ratio-${m.id}`}
                type="range"
                min="0"
                max="100"
                step="5"
                value={recipe[m.id] || 0}
                onChange={(e) => onChange(m.id, Number(e.target.value))}
                aria-label={`${m.name} percentage`}
              />
              <button
                className="text-link"
                onClick={() => onRemove(m.id)}
                aria-label={`Remove ${m.name}`}
              >
                Remove
              </button>
            </div>
          ))}
          <p className="fine-print">
            Zero-percent selections stay editable. At least two ingredients must
            have a positive share before mixing. Changing a mixed recipe resets
            stirring.
          </p>
        </>
      )}
    </section>
  );
}
