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
import { MATERIALS, evaluate } from "./simulation";
import {
  LaboratoryScene,
  IngredientJar,
  IngredientTray,
  MixingVessel,
  StirringInteraction,
} from "./components/Laboratory";
import {
  Thermometer,
  MoistureInstrument,
  IncubationDial,
  PreparationControl,
} from "./components/Instruments";
import { GrowthVisualization } from "./components/Growth";
import { ExperimentSummary } from "./components/Notebook";
import {
  Button,
  Guide,
  ScreenHeading,
  ActionDock,
  asset,
} from "./components/Common";
export function Welcome({ onEnter, onAbout, hasProgress, onResume }) {
  return (
    <section className="welcome-screen">
      <div
        className="welcome-art"
        style={{ backgroundImage: `url(${asset("images/laboratory.png")})` }}
        aria-hidden="true"
      />
      <div className="welcome-vignette" />
      <div className="welcome-content">
        <p className="eyebrow">
          <span className="glow-dot" /> AN INTERACTIVE MATERIAL EXHIBITION
        </p>
        <h1>BLUEGREEN</h1>
        <h2>
          From Waste
          <br />
          <em>to New Life</em>
        </h2>
        <p>
          Discover how organic waste
          <br />
          can become something new.
        </p>
        <div className="welcome-specimen">
          <div className="welcome-specimen-glass">
            <GrowthVisualization
              progress={100}
              outcome="success"
              sample
              form="vase"
            />
          </div>
          <span>FIG. 01 / A NEW BEGINNING</span>
        </div>
        <div className="welcome-actions">
          <Button onClick={onEnter}>
            Enter the Laboratory
            <ArrowRight size={18} />
          </Button>
          {hasProgress && (
            <button className="text-link resume-link" onClick={onResume}>
              Continue Your Experiment
              <ArrowUpRight size={15} />
            </button>
          )}
          <button className="text-link" onClick={onAbout}>
            About This Experience
          </button>
        </div>
        <div className="welcome-bottom">
          <span>COLLECT. CULTIVATE. REIMAGINE.</span>
          <span>PLAYABLE / ILLUSTRATIVE / LOCAL</span>
        </div>
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
            A little waste.
            <br />
            <em>A living possibility.</em>
          </>
        }
        description="An ecological laboratory for curious minds."
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
          <MixingVessel
            vesselRef={ref}
            recipe={{ sawdust: 60, straw: 40 }}
            progress={0}
          />
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
        <Guide message="Welcome to the Mycelium Lab!" mood="happy" />
        <div>
          <p>
            Here, everyday waste can become the beginning of a new material.
          </p>
          <p>
            Collect ingredients, create your mixture, and discover what grows.
          </p>
        </div>
      </div>
      <ActionDock>
        <Button onClick={onStart}>
          Start Mixing
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
}) {
  const ref = useRef(null),
    [ghost, setGhost] = useState(null),
    [dropKey, setDropKey] = useState(0);
  function add(id) {
    onPortion(id, 1);
    setDropKey((k) => k + 1);
  }
  const count = Object.keys(draft.portions).length;
  return (
    <section className="mix-screen">
      <ScreenHeading
        eyebrow="STEP 01 / CREATE YOUR RECIPE"
        title={
          <>
            Gather the ordinary.
            <br />
            <em>Make something new.</em>
          </>
        }
        description="Drag a portion into the vessel, or tap a jar to add."
        center
      />
      <LaboratoryScene variant="mixing-room">
        <div className="mix-workbench">
          <div className="ingredient-shelves">
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
            portionCount={Object.values(draft.portions).reduce(
              (sum, n) => sum + n,
              0,
            )}
            autoMixing={autoMixing}
          />
          <StirringInteraction
            mixing={draft.mixing}
            progress={draft.mixProgress}
            canMix={count >= 2}
            onBegin={onBeginMix}
            onAuto={onAuto}
            autoMixing={autoMixing}
          />
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
      <IngredientTray
        portions={draft.portions}
        recipe={recipe}
        onChange={onPortion}
      />
      <Guide
        compact
        message={
          draft.mixProgress >= 1
            ? "Your substrate is ready. Let’s give it a climate."
            : draft.mixing
              ? "Follow a circle. Connections start with a little movement."
              : count
                ? "A thoughtful blend begins with different textures."
                : "The shelf is full of second chances. Choose at least two."
        }
        mood={draft.mixProgress >= 1 ? "happy" : "calm"}
      />
      {draft.mixProgress >= 1 && (
        <ActionDock>
          <Button onClick={onContinue}>
            Continue
            <ArrowRight size={18} />
          </Button>
        </ActionDock>
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
        eyebrow="STEP 02 / SET THE CONDITIONS"
        title={
          <>
            A climate
            <br />
            <em>for connections.</em>
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
      <Guide
        compact
        message="Water in your substrate and humidity in the air are different things."
      />
      <div className="culture-note">
        <FlaskConical size={20} />
        <p>
          A separate mycelium starter is supplied in the model. Its species and
          dose are not modeled or included in your waste percentages.
        </p>
      </div>
      <ActionDock note="Illustrative growing ranges, not a cultivation protocol.">
        <Button
          disabled={Object.keys(recipe).length < 2 || draft.mixProgress < 1}
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
}) {
  const verdict = evaluate({ ...draft, recipe }),
    progress = draft.growthProgress,
    phase = progress < 20 ? 0 : progress < 45 ? 1 : progress < 80 ? 2 : 3;
  return (
    <section className="growth-screen">
      <ScreenHeading
        eyebrow="STEP 03 / THE LIVING TRANSFORMATION"
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
          <GrowthVisualization progress={progress} outcome={verdict.outcome} />
          <span className="growth-vessel-reflection" />
        </div>
        <div className="chamber-progress">
          <span>SEQUENCE {Math.round(progress)}%</span>
          <span>{draft.days} ILLUSTRATIVE DAYS</span>
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
          <Button secondary onClick={onPlay} disabled={progress >= 100}>
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
        </div>
      </LaboratoryScene>
      <p className="assumption-note">
        Accelerated illustrative timeline. Sequence progress is not a measured
        colonization percentage.
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
