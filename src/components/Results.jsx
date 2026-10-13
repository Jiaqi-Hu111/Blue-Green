import { useState } from "react";
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
          <details className="result-analysis" open>
            <summary>What shaped this outcome?</summary>
            <ol>
              {result.reasons.map((reason, i) => (
                <li key={reason}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{reason}</p>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </div>
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
