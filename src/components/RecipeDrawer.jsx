import { MATERIALS } from "../simulation";
import { Modal, Button, CompositionStrip } from "./Common";
import { MaterialTexture } from "./Laboratory";
export function RecipeDrawer({ draft, recipe, onChange, onRemove, onClose }) {
  return (
    <Modal
      title="Recipe Composition"
      onClose={onClose}
      className="recipe-drawer"
    >
      <p>
        Adjust one ingredient; the others rebalance to keep the mixture at 100%.
      </p>
      <CompositionStrip recipe={recipe} />
      <div className="recipe-total">
        Total composition{" "}
        <strong>{Object.keys(recipe).length ? "100%" : "0%"}</strong>
      </div>
      {MATERIALS.filter((m) => Object.hasOwn(draft.portions, m.id)).map((m) => (
        <div className="recipe-drawer-row" key={m.id}>
          <MaterialTexture material={m} className="portion-thumbnail" />
          <label htmlFor={`ratio-${m.id}`}>{m.name}</label>
          <div className="recipe-number">
            <input
              aria-label={`${m.name} exact percentage`}
              type="number"
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
      <Button onClick={onClose}>Done · Keep Collecting</Button>
    </Modal>
  );
}
