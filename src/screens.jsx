import { useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Leaf,
  FlaskConical,
  Play,
  Pause,
  SkipForward,
  BookOpen,
  Check,
  Info,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { positiveIngredientCount } from "./state";
import { RecipeComposition } from "./components/RecipeComposition";
import { MATERIALS, evaluate } from "./simulation";
import {
  LaboratoryScene,
  IngredientJar,
  MixingVessel,
  StirringInteraction,
} from "./components/Laboratory";
import {
  Thermometer,
  MoistureInstrument,
  IncubationDial,
  PreparationControl,
} from "./components/Instruments";
import { GenerativeGrowth } from "./components/GenerativeGrowth";
import { GrowthVisualization } from "./components/Growth";
import { ExperimentSummary } from "./components/Notebook";
import {
  Button,
  Guide,
  ScreenHeading,
  ActionDock,
  asset,
} from "./components/Common";
import {
  CoastalWindow,
  StoryDivider,
  BotanicalSprig,
} from "./components/Illustrations";
export function Welcome({ onEnter, onAbout, hasProgress, onResume }) {
  return (
    <section className="welcome-screen">
      <div className="welcome-title">
        <p className="eyebrow">A SMALL EXPERIMENT IN POSSIBILITY</p>
        <h1>BLUEGREEN</h1>
        <p className="welcome-subtitle">Mycelium Lab</p>
        <StoryDivider />
        <h2>From Waste to New Life</h2>
      </div>
      <div className="welcome-scene">
        <CoastalWindow arched />
        <div className="welcome-specimen">
          <div className="welcome-specimen-glass">
            <GrowthVisualization
              progress={100}
              outcome="success"
              sample
              form="vase"
            />
          </div>
          <span>A MATERIAL’S NEXT CHAPTER</span>
        </div>
        <div className="welcome-guide">
          <Guide
            message="Every new material begins with a little curiosity."
            mood="happy"
            compact
          />
        </div>
        <div className="welcome-wood" />
      </div>
      <div className="welcome-content">
        <p>Discover how organic waste can become something new.</p>
        <div className="welcome-actions">
          <Button onClick={onEnter}>
            Enter the Laboratory
            <ArrowRight size={18} />
          </Button>
          {hasProgress && (
            <button className="text-link resume-link" onClick={onResume}>
              Resume Previous Experiment
              <ArrowUpRight size={15} />
            </button>
          )}
          <button className="text-link" onClick={onAbout}>
            About This Experience
          </button>
        </div>
        <span className="welcome-bottom">
          COLLECT · MIX · CULTIVATE · REIMAGINE
        </span>
      </div>
    </section>
  );
}

export function LaboratoryIntroduction({ onStart, onMaterial }) {
  const ref = useRef(null);
  return (
    <section className="intro-screen">
      <ScreenHeading
        eyebrow="WELCOME TO YOUR WORKSPACE"
        title={
          <>
            Welcome to the
            <br />
            <em>Mycelium Lab.</em>
          </>
        }
        description="Collect organic waste, mix your ingredients, and discover how new materials can grow."
        center
      />
      <LaboratoryScene variant="introduction">
        <div className="intro-workbench">
          <div className="ingredient-shelves intro-shelves">
            {MATERIALS.map((m) => (
              <IngredientJar
                key={m.id}
                material={m}
                explore
                onInfo={onMaterial}
              />
            ))}
          </div>
          <span className="shelf-discovery">
            <span className="glow-dot" /> TAP A JAR TO DISCOVER ITS STORY
          </span>
          <MixingVessel vesselRef={ref} recipe={{}} progress={0} />
          <div className="culture-starter">
            <FlaskConical size={24} />
            <span>
              MYCELIUM CULTURE
              <small>Separate living starter · fixed illustration</small>
            </span>
          </div>
        </div>
      </LaboratoryScene>
      <div className="intro-message">
        <Guide
          message="Welcome to the Mycelium Lab. A small beginning can become something remarkable."
          mood="happy"
        />
      </div>
      <ActionDock>
        <Button onClick={onStart}>
          Begin Experiment
          <ArrowRight size={18} />
        </Button>
      </ActionDock>
    </section>
  );
}
export function MixingScreen({
  draft,
  recipe,
  onPortion,
  onMaterial,
  onBeginMix,
  onStir,
  onAuto,
  autoMixing,
  onContinue,
  onNotice,
  onRecipeChange,
  onRemove,
  onReference,
}) {
  const ref = useRef(null),
    [ghost, setGhost] = useState(null),
    [dropKey, setDropKey] = useState(0);
  function add(id) {
    onPortion(id, 1);
    setDropKey((k) => k + 1);
  }
  const count = positiveIngredientCount(recipe);
  return (
    <section
      className={`mix-screen ${draft.mixing ? "stirring-screen" : "collecting-screen"}`}
    >
      <ScreenHeading
        eyebrow={
          draft.mixing
            ? "CHAPTER III / THE BLEND"
            : "CHAPTER II / THE INGREDIENTS"
        }
        title={
          draft.mixing
            ? draft.mixProgress >= 1
              ? "Your mixture is ready!"
              : "Give it a swirl!"
            : "Mix Natural Ingredients"
        }
        description={
          draft.mixing
            ? "Draw circles inside the vessel, or choose Auto Mix."
            : "Drag ingredients into the vessel. Tap a jar to add a portion."
        }
        center
      />
      <LaboratoryScene variant="mixing-room">
        <div className="mix-workbench">
          <div className="ingredient-shelves" hidden={draft.mixing}>
            {MATERIALS.map((m) => (
              <IngredientJar
                key={m.id}
                material={m}
                onAdd={add}
                onInfo={onMaterial}
                vesselRef={ref}
                onDrag={setGhost}
                onMiss={() =>
                  onNotice(
                    "That portion stayed on the shelf. Drop it inside the vessel to add it.",
                  )
                }
              />
            ))}
          </div>
          <p id="jar-instructions" className="shelf-instruction">
            DRAG TO DROP · TAP TO ADD · EVERY PORTION COUNTS
          </p>
          <MixingVessel
            vesselRef={ref}
            recipe={recipe}
            mixing={draft.mixing}
            progress={draft.mixProgress}
            onStir={onStir}
            over={ghost?.over}
            dropKey={dropKey}
            portionCount={count * 2}
            autoMixing={autoMixing}
          />
          {draft.mixing && (
            <StirringInteraction
              mixing={draft.mixing}
              progress={draft.mixProgress}
              canMix={count >= 2}
              onBegin={onBeginMix}
              onAuto={onAuto}
              autoMixing={autoMixing}
            />
          )}
        </div>
      </LaboratoryScene>
      {ghost && (
        <div
          className={`ingredient-ghost ${ghost.over ? "over" : ""}`}
          style={{ left: ghost.x, top: ghost.y }}
          aria-hidden="true"
        >
          <span
            style={{
              background: MATERIALS.find((m) => m.id === ghost.id).tone,
            }}
          />
          {MATERIALS.find((m) => m.id === ghost.id).name}
        </div>
      )}
      <RecipeComposition
        draft={draft}
        recipe={recipe}
        onChange={onRecipeChange}
        onRemove={onRemove}
      />
      {!draft.mixing && draft.mixProgress < 1 && (
        <StirringInteraction
          mixing={false}
          progress={draft.mixProgress}
          canMix={count >= 2}
          onBegin={onBeginMix}
          onAuto={onAuto}
          autoMixing={autoMixing}
        />
      )}
      {draft.mixing && (
        <button
          className="text-link back-to-ingredients"
          onClick={() => onBeginMix(false)}
        >
          Review Ingredients
        </button>
      )}
      {draft.mixProgress >= 1 && (
        <ActionDock>
          <Button onClick={onContinue}>
            Continue
            <ArrowRight size={18} />
          </Button>
        </ActionDock>
      )}
      {!draft.mixing && (
        <div className="reference-recipe">
          <button className="text-link" onClick={onReference}>
            Optional Reference Recipe
          </button>
          <p className="fine-print">
            60% sawdust + 40% straw, 62% moisture, 24°C, 18 days, treated.
            Favourable in this educational model; real biological success is not
            guaranteed.
          </p>
        </div>
      )}
    </section>
  );
}
export function ConditionsScreen({
  draft,
  recipe,
  onField,
  onStart,
  onReview,
}) {
  return (
    <section className="conditions-screen">
      <ScreenHeading
        eyebrow="CHAPTER IV / THE GROWING ENVIRONMENT"
        title={
          <>
            Create Growth
            <br />
            <em>Conditions</em>
          </>
        }
        description="Operate your miniature lab. Every setting shapes the illustrative outcome."
        center
      />
      <LaboratoryScene variant="conditions-room">
        <div className="instruments-grid">
          <Thermometer
            value={draft.temperature}
            onChange={(v) => onField("temperature", v)}
          />
          <MoistureInstrument
            value={draft.moisture}
            onChange={(v) => onField("moisture", v)}
          />
          <IncubationDial
            value={draft.days}
            onChange={(v) => onField("days", v)}
          />
        </div>
        <PreparationControl
          treated={draft.treated}
          onChange={(v) => onField("treated", v)}
        />
      </LaboratoryScene>

      <div className="culture-note">
        <FlaskConical size={20} />
        <p>
          A separate mycelium starter is supplied in the model. Its species and
          dose are not modeled or included in your waste percentages.
        </p>
      </div>
      <ActionDock note="Illustrative growing ranges, not a cultivation protocol.">
        <Button
          disabled={
            positiveIngredientCount(recipe) < 2 || draft.mixProgress < 1
          }
          onClick={onStart}
        >
          Start Cultivation
          <ArrowRight size={18} />
        </Button>
        <Button secondary onClick={onReview}>
          Review Recipe
          <FlaskConical size={17} />
        </Button>
      </ActionDock>
    </section>
  );
}
export const GROWTH_PHASES = [
  {
    title: "Substrate Preparation",
    text: "Your selected preparation and a separate culture establish the modeled starting point.",
  },
  {
    title: "Early Colonization",
    text: "Fine hyphae explore the substrate. Real growth also depends on species, inoculum and airflow.",
  },
  {
    title: "Network Formation",
    text: "Connections appear across the mixture. Your inputs influence its illustrative coverage.",
  },
  {
    title: "Growth Assessment",
    text: "The sequence reaches its assessment. These visible threads are not measured biological growth.",
  },
];
export function GrowthScreen({
  draft,
  recipe,
  playing,
  onPlay,
  onSkip,
  onResults,
  onRestart,
  replayToken,
}) {
  const verdict = evaluate({ ...draft, recipe }),
    progress = draft.growthProgress,
    phase = progress < 20 ? 0 : progress < 45 ? 1 : progress < 80 ? 2 : 3;
  return (
    <section className="growth-screen">
      <ScreenHeading
        eyebrow="CHAPTER V / THE OBSERVATION"
        title={
          <>
            Quietly, a network
            <br />
            <em>finds its way.</em>
          </>
        }
        center
      />
      <LaboratoryScene variant="cultivation-chamber">
        <div className="chamber-label">
          <span className="glow-dot" /> CULTIVATION CHAMBER / OBSERVATION
        </div>
        <div className="growth-vessel">
          <GenerativeGrowth
            recipe={recipe}
            progress={progress}
            outcome={verdict.outcome}
            playing={playing}
            onPlay={onPlay}
            onReplay={onRestart}
            replayToken={replayToken}
            seedKey={JSON.stringify({
              recipe,
              moisture: draft.moisture,
              temperature: draft.temperature,
              days: draft.days,
              treated: draft.treated,
            })}
          />
          <span className="growth-vessel-reflection" />
        </div>
        <p className="generative-label">
          Mycelium-inspired generative visualisation
        </p>
        <div className="chamber-progress">
          <span>SEQUENCE {Math.round(progress)}%</span>
          <span>
            {Math.round((draft.days * progress) / 100)} / {draft.days}{" "}
            ILLUSTRATIVE DAYS
          </span>
        </div>
        <div className="growth-phase-dots" aria-label="Cultivation phases">
          {GROWTH_PHASES.map((p, i) => (
            <span
              key={p.title}
              className={i === phase ? "current" : i < phase ? "complete" : ""}
            >
              <i />
              {String(i + 1).padStart(2, "0")}
            </span>
          ))}
        </div>
        <div className="phase-explanation" aria-live="polite">
          <span className="eyebrow">PHASE 0{phase + 1}</span>
          <h2>{GROWTH_PHASES[phase].title}</h2>
          <p>{GROWTH_PHASES[phase].text}</p>
        </div>
        <div className="growth-playback">
          <Button secondary onClick={onPlay}>
            {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
            {playing ? "Pause" : "Play"}
          </Button>
          <button
            className="text-link"
            disabled={progress >= 100}
            onClick={onSkip}
          >
            Skip Animation
            <SkipForward size={16} />
          </button>
          <button className="text-link" onClick={onRestart}>
            Restart Animation
          </button>
        </div>
      </LaboratoryScene>
      <details className="growth-education">
        <summary>About this visualisation</summary>
        <p>
          Inspired by agent-based organic network models: moving agents sense
          nearby trails, turn, deposit traces and gradually diffuse or fade
          them. Physarum is a slime mold, not fungal mycelium. This artwork does
          not predict fungal branching, colonization, growth rates or material
          performance.
        </p>
        <a
          href="https://www.pavelp.cz/posts/eng-cpp-slime-mold-simulation/"
          target="_blank"
          rel="noreferrer"
        >
          Read the visualisation reference
        </a>
      </details>
      <p className="assumption-note">
        Accelerated illustrative timeline. Sequence progress is not a measured
        colonization percentage. At assessment, the network keeps evolving while
        Play is active.
      </p>
      {verdict.outcome === "unverified" && (
        <Guide
          compact
          message="This recipe is outside our model’s coverage. Watch it as an exploration, not a prediction."
        />
      )}
      <ActionDock>
        <Button disabled={progress < 100} onClick={onResults}>
          View Results
          <ArrowRight size={18} />
        </Button>
      </ActionDock>
    </section>
  );
}
