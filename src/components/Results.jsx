import { neutralGrowthText } from "../text";
import {
  ArrowRight,
  RotateCcw,
  Bookmark,
  FileText,
  GitCompareArrows,
  Check,
} from "lucide-react";
import { OUTCOMES } from "../simulation";
import { Button, Guide, ActionDock, ScreenHeading } from "./Common";
import { MaterialSample } from "./Growth";
import { ExperimentSummary } from "./Notebook";
import { EVIDENCE_TABLE } from "../outcomeFeedback";
import { SOURCES } from "../data/research";
export function ResultPanel({
  result,
  onExplore,
  onRetry,
  onDetails,
  onCompare,
  onSave,
}) {
  const outcome = OUTCOMES[result.outcome];
  return (
    <section className={`result-panel result-${result.outcome}`}>
      <span className={`outcome-badge ${result.outcome}`}>{outcome.label}</span>
      <ScreenHeading
        eyebrow={`EXPERIMENT ${String(result.number).padStart(2, "0")} / GROWTH ASSESSMENT`}
        title={outcome.title}
        center
      />
      <div className="result-layout">
        <MaterialSample outcome={result.outcome} />
        <div className="result-story">
          <Guide
            mood={result.outcome === "success" ? "happy" : "calm"}
            message={
              result.outcome === "success"
                ? "A small beginning has found new connections."
                : result.outcome === "unverified"
                  ? "There is more to learn. Uncertainty is part of discovery."
                  : "Every experiment is a clue. Let’s explore what changed."
            }
          />
          <p className="result-introduction">{outcome.message}</p>
          {result.feedback?.version === 1 && (
            <div className="educational-feedback">
              <h2>Your conditions, explained.</h2>
              <p>{neutralGrowthText(result.feedback.summary)}</p>
              <dl className="feedback-factors">
                {result.feedback.factors.map((factor) => (
                  <div key={factor.id}>
                    <dt>
                      {neutralGrowthText(factor.label)}
                      <span className={"factor-status " + factor.status}>
                        {factor.status === "within"
                          ? "Within model"
                          : factor.status === "outside"
                            ? "Outside coverage"
                            : factor.status === "risk"
                              ? "Risk flag"
                              : "Limiting flag"}
                      </span>
                    </dt>
                    <dd>{neutralGrowthText(factor.text)}</dd>
                  </div>
                ))}
              </dl>
              <h3>Ideas for your next model experiment</h3>
              <ul className="feedback-adjustments">
                {result.feedback.adjustments.map((item) => (
                  <li key={item}>{neutralGrowthText(item)}</li>
                ))}
              </ul>
              <p className="fine-print">{neutralGrowthText(result.feedback.note)}</p>
            </div>
          )}
          <details className="result-analysis" open={!result.feedback}>
            <summary>What shaped this outcome?</summary>
            <ol>
              {result.reasons.map((reason, i) => (
                <li key={reason}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{neutralGrowthText(reason)}</p>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </div>
      <details className="result-evidence">
        <summary>Scientific evidence & model assumptions</summary>
        <p>
          Published research supports general relationships. None of these
          sources validates BLUEGREEN’s exact bands, weights or outcome
          classifications or stylised imagery. The animation does not predict
          fungal morphology, growth speed or detected contamination.
        </p>
        <div
          className="evidence-table-scroll"
          role="region"
          aria-label="Evidence and assumptions comparison"
          tabIndex={0}
        >
          <table>
            <caption>Research context and uncalibrated game rules</caption>
            <thead>
              <tr>
                <th scope="col">Published principle</th>
                <th scope="col">BLUEGREEN assumption</th>
              </tr>
            </thead>
            <tbody>
              {EVIDENCE_TABLE.map((row) => (
                <tr key={row.topic}>
                  <th scope="row">
                    <strong>{row.topic}</strong>
                    <p>{row.principle}</p>
                    {row.sources.map((id) => {
                      const source = SOURCES.find((s) => s.id === id);
                      return (
                        <a
                          key={id}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {source.authors}, {source.year}
                          {id === "fungar2021" ? " · technical report" : ""}
                        </a>
                      );
                    })}
                  </th>
                  <td>{row.assumption}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine-print">
          Species, inoculum, airflow, particle size and preparation protocols
          are not represented fully. No success probability, material strength
          or biological safety has been measured.
        </p>
      </details>
      <div className="result-recipe">
        <div>
          <p className="eyebrow">YOUR EXPERIMENT AT A GLANCE</p>
          <h2>A record of your choices.</h2>
        </div>
        <ExperimentSummary experiment={result} />
      </div>
      <div className="result-extra-actions">
        <button onClick={onDetails}>
          <FileText size={16} />
          View Experiment Details
        </button>
        <button onClick={onCompare}>
          <GitCompareArrows size={16} />
          Compare Experiments
        </button>
        <button onClick={onSave} disabled={result.pinned}>
          {result.pinned ? <Check size={16} /> : <Bookmark size={16} />}{" "}
          {result.pinned ? "Experiment Saved" : "Save Experiment"}
        </button>
      </div>
      <p className="assumption-note">
        Illustrative simulation, not a validated prediction.{" "}
        {result.modelVersion === 1
          ? "This record was retained from the earlier model; its rules differ from the current model."
          : "No measured strength, success probability or biological diagnosis is implied."}
      </p>
      <ActionDock>
        <Button onClick={onExplore}>
          Explore Your Material
          <ArrowRight size={18} />
        </Button>
        <Button secondary onClick={onRetry}>
          Adjust & Retry
          <RotateCcw size={17} />
        </Button>
      </ActionDock>
    </section>
  );
}
