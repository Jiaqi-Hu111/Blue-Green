import { useState } from "react";
import {
  ArrowUpRight,
  Copy,
  Check,
  Bookmark,
  ArrowRight,
  GitCompareArrows,
} from "lucide-react";
import { MATERIALS, OUTCOMES } from "../simulation";
import { Button, CompositionStrip } from "./Common";
import { GrowthVisualization } from "./Growth";
export function ExperimentSummary({ experiment, compact = false }) {
  return (
    <div className={`experiment-summary ${compact ? "compact" : ""}`}>
      <CompositionStrip recipe={experiment.recipe} />
      <dl>
        {MATERIALS.filter((m) => experiment.recipe[m.id] != null).map((m) => (
          <div key={m.id}>
            <dt>
              <i style={{ background: m.tone }} />
              {m.name}
            </dt>
            <dd>{experiment.recipe[m.id]}%</dd>
          </div>
        ))}
        <div className="summary-condition">
          <dt>Temperature</dt>
          <dd>{experiment.temperature}°C</dd>
        </div>
        <div>
          <dt>Substrate moisture</dt>
          <dd>{experiment.moisture}%</dd>
        </div>
        <div>
          <dt>Incubation period</dt>
          <dd>
            {experiment.days == null
              ? "Not recorded"
              : `${experiment.days} days`}
          </dd>
        </div>
        <div>
          <dt>Preparation</dt>
          <dd>
            {experiment.treated == null
              ? "Not recorded"
              : experiment.treated
                ? "Treated"
                : "Untreated"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
export function ExperimentNotebook({
  history,
  onOpen,
  onDuplicate,
  onCompare,
}) {
  const [selected, setSelected] = useState([]),
    [notice, setNotice] = useState("");
  function toggle(id) {
    setNotice("");
    if (selected.includes(id)) setSelected((s) => s.filter((x) => x !== id));
    else if (selected.length < 2) setSelected((s) => [...s, id]);
    else
      setNotice(
        "Select two experiments at a time. Uncheck one to choose another.",
      );
  }
  return (
    <div className="experiment-notebook">
      <div className="notebook-binding" aria-hidden="true" />
      <div className="notebook-heading">
        <span className="eyebrow">FIELD NOTES / YOUR EXPLORATIONS</span>
        <span>{history.length} RECORDS</span>
      </div>
      {history.length === 0 ? (
        <div className="empty-notebook">
          <h2>
            A blank page.
            <br />A world of possibilities.
          </h2>
          <p>
            Your experiments will be recorded here automatically. Return to the
            laboratory to create your first blend.
          </p>
        </div>
      ) : (
        <>
          <div className="notebook-records">
            {history.map((h) => (
              <article
                className={`notebook-record ${selected.includes(h.id) ? "chosen" : ""}`}
                key={h.id}
              >
                <div className="record-top">
                  <span className="record-number">
                    Experiment {String(h.number).padStart(2, "0")}
                  </span>
                  <span className="record-date">
                    {h.date
                      ? new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(h.date))
                      : "Earlier session"}
                  </span>
                  {h.pinned && (
                    <Bookmark
                      size={14}
                      fill="currentColor"
                      aria-label="Saved experiment"
                    />
                  )}
                </div>
                <div className="record-main">
                  <div className="pinned-sample">
                    <GrowthVisualization outcome={h.outcome} sample />
                    <span className="sample-pin" />
                  </div>
                  <div className="record-findings">
                    <span className={`outcome-badge ${h.outcome}`}>
                      {OUTCOMES[h.outcome].label}
                    </span>
                    <ExperimentSummary experiment={h} compact />
                  </div>
                </div>
                <div className="record-actions">
                  <label className="compare-checkbox">
                    <input
                      type="checkbox"
                      checked={selected.includes(h.id)}
                      onChange={() => toggle(h.id)}
                    />
                    <span>Compare</span>
                  </label>
                  <button
                    onClick={() => onOpen(h)}
                    aria-label={`Open experiment ${h.number}`}
                  >
                    Open
                    <ArrowUpRight size={16} />
                  </button>
                  <button
                    onClick={() => onDuplicate(h)}
                    aria-label={`Duplicate experiment ${h.number}`}
                  >
                    Duplicate
                    <Copy size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="compare-dock">
            <p>
              {selected.length === 2
                ? "Two stories. What changed?"
                : `Select two records to compare (${selected.length}/2).`}
            </p>
            <Button
              secondary
              disabled={selected.length !== 2}
              onClick={() =>
                onCompare(
                  selected.map((id) => history.find((h) => h.id === id)),
                )
              }
            >
              Compare Experiments
              <GitCompareArrows size={17} />
            </Button>
          </div>
          {notice && (
            <p className="notebook-notice" role="status">
              {notice}
            </p>
          )}
        </>
      )}
      <p className="notebook-footnote">
        Stored on this browser only. The latest 24 experiments are retained;
        “Save Experiment” pins a record visually, without changing this limit.
      </p>
    </div>
  );
}
export function ComparisonPanel({ experiments }) {
  const [a, b] = experiments;
  const rows = [
    ...MATERIALS.map((m) => [
      m.name,
      `${a.recipe[m.id] || 0}%`,
      `${b.recipe[m.id] || 0}%`,
    ]),
    ["Temperature", `${a.temperature}°C`, `${b.temperature}°C`],
    ["Substrate moisture", `${a.moisture}%`, `${b.moisture}%`],
    [
      "Incubation period",
      a.days == null ? "Not recorded" : `${a.days} days`,
      b.days == null ? "Not recorded" : `${b.days} days`,
    ],
    [
      "Preparation",
      a.treated == null ? "Not recorded" : a.treated ? "Treated" : "Untreated",
      b.treated == null ? "Not recorded" : b.treated ? "Treated" : "Untreated",
    ],
    ["Model version", `v${a.modelVersion}`, `v${b.modelVersion}`],
    [
      "Illustrative outcome",
      OUTCOMES[a.outcome].label,
      OUTCOMES[b.outcome].label,
    ],
  ];
  return (
    <div className="comparison-panel">
      <p>
        Compare inputs and modeled explanations. These outcomes are not measured
        experimental evidence.
      </p>
      <div className="comparison-table-wrap">
        <table>
          <caption>
            Experiments {a.number} and {b.number}
          </caption>
          <thead>
            <tr>
              <th scope="col">Variable</th>
              <th scope="col">Experiment {a.number}</th>
              <th scope="col">Experiment {b.number}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, one, two]) => (
              <tr className={one !== two ? "different" : ""} key={label}>
                <th scope="row">{label}</th>
                <td>{one}</td>
                <td>{two}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="comparison-key">
        <span /> Highlighted rows show a changed variable.
      </p>
      {experiments.map((h) => (
        <div className="comparison-analysis" key={h.id}>
          <h3>
            Experiment {h.number} / {OUTCOMES[h.outcome].label}
          </h3>
          <ul>
            {h.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
