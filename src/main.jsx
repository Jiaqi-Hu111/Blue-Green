import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Info,
  Leaf,
  BookOpen,
  RotateCcw,
  Home,
  Check,
} from "lucide-react";
import { MATERIALS, percentages, evaluate } from "./simulation";
import {
  persistState,
  HISTORY_KEY,
  deviceRecords,
  mergeRecords,
  sanitizeEntry,
  positiveIngredientCount,
  setIngredientPercent,
  removeIngredient,
  referenceDraft,
  loadState,
  freshDraft,
  changePortion,
  draftFromEntry,
} from "./state";
import {
  Modal,
  HelpContent,
  Button,
  ScreenHeading,
  ActionDock,
  asset,
} from "./components/Common";
import {
  Welcome,
  LaboratoryIntroduction,
  MixingScreen,
  ConditionsScreen,
  GrowthScreen,
} from "./screens";
import { ResultPanel } from "./components/Results";
import { LifecycleGallery } from "./components/Lifecycle";
import {
  ExperimentNotebook,
  ComparisonPanel,
  ExperimentSummary,
} from "./components/Notebook";
import { DeploymentUpdate } from "./components/DeploymentUpdate";
import { cleanReleaseMarker } from "./deployment";
cleanReleaseMarker();
import "./style.css";
const STAGE_NAMES = [
  "Welcome",
  "Explore the Laboratory",
  "Collect & Mix",
  "Growth Conditions",
  "Watch Mycelium Grow",
  "Experiment Results",
  "Material Lifecycle",
  "Experiment Notebook",
];
const newRunId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
function browserStores() {
  let local, session;
  try {
    local = window.localStorage;
  } catch {}
  try {
    session = window.sessionStorage;
  } catch {}
  return { local, session };
}
function App() {
  const [state, setState] = useState(() => {
    const { local, session } = browserStores();
    return loadState(local, session);
  });
  const { step, draft, history, resultId, nextNumber } = state;
  const [overlay, setOverlay] = useState(null),
    [notice, setNotice] = useState(""),
    [storageError, setStorageError] = useState(false),
    [playing, setPlaying] = useState(false),
    [autoMixing, setAutoMixing] = useState(false),
    [pageVisible, setPageVisible] = useState(!document.hidden),
    [replay, setReplay] = useState(0);
  const reduced = useReducedMotion(),
    screenRef = useRef(null),
    autoRef = useRef(null),
    noticeTimer = useRef(null);
  const stirringView = step === 2 && draft.mixing;
  const recipe = percentages(draft.portions),
    result = history.find((h) => h.id === resultId);
  useEffect(() => {
    try {
      const { local, session } = browserStores();
      persistState(state, local, session);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const t = setTimeout(
      () => screenRef.current?.focus({ preventScroll: true }),
      reduced ? 0 : 400,
    );
    return () => clearTimeout(t);
  }, [step, reduced, stirringView]);
  useEffect(() => {
    const visible = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, []);
  useEffect(() => {
    if (step !== 4 || !playing || !pageVisible || draft.growthProgress >= 100)
      return;
    let frame = 0,
      last = 0,
      carry = 0;
    const tick = (time) => {
      if (last) carry += Math.min(100, time - last);
      last = time;
      if (carry >= 100) {
        const delta = carry / 90;
        carry = 0;
        setState((s) => ({
          ...s,
          draft: {
            ...s.draft,
            growthProgress: Math.min(100, s.draft.growthProgress + delta),
          },
        }));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step, playing, pageVisible, draft.growthProgress >= 100]);
  useEffect(() => {
    if (draft.growthProgress >= 100) setPlaying(false);
  }, [draft.growthProgress]);
  useEffect(() => {
    if (draft.mixProgress >= 1) {
      clearInterval(autoRef.current);
      setAutoMixing(false);
    }
  }, [draft.mixProgress]);
  useEffect(
    () => () => {
      clearInterval(autoRef.current);
      clearTimeout(noticeTimer.current);
    },
    [],
  );
  useEffect(() => {
    const onPop = (e) => {
      if (Number.isInteger(e.state?.bluegreenStep)) {
        setPlaying(false);
        clearInterval(autoRef.current);
        setAutoMixing(false);
        setState((s) => ({ ...s, step: e.state.bluegreenStep }));
      }
    };
    window.history.replaceState({ bluegreenStep: step }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    const sync = (e) => {
      if (e.key !== HISTORY_KEY) return;
      setState((s) => {
        const records = mergeRecords(
          deviceRecords(browserStores().local),
          s.history,
        )
          .map(sanitizeEntry)
          .filter(Boolean);
        return {
          ...s,
          history: records,
          nextNumber: Math.max(0, ...records.map((h) => h.number)) + 1,
        };
      });
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function notify(message) {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 4500);
  }
  function move(n) {
    setPlaying(false);
    setAutoMixing(false);
    clearInterval(autoRef.current);
    setNotice("");
    setState((s) => ({ ...s, step: n }));
    window.history.pushState({ bluegreenStep: n }, "");
  }
  const closeOverlay = useCallback(() => setOverlay(null), []);
  function modifyDraft(fn) {
    setState((s) => ({ ...s, draft: fn(s.draft) }));
  }
  function portion(id, delta) {
    clearInterval(autoRef.current);
    setAutoMixing(false);
    modifyDraft((d) => changePortion(d, id, delta));
    notify(
      delta > 0
        ? `${MATERIALS.find((m) => m.id === id).name} added. Your mixture has changed.`
        : "One portion removed. Your mixture has changed.",
    );
  }
  function field(name, value) {
    modifyDraft((d) =>
      d[name] === value
        ? d
        : { ...d, [name]: value, runId: null, growthProgress: 0 },
    );
  }
  function beginMix(active = true) {
    modifyDraft((d) => ({
      ...d,
      mixing: active !== false,
      mixProgress: active === false ? d.mixProgress : 0,
    }));
  }
  function stir(delta) {
    modifyDraft((d) => ({
      ...d,
      mixProgress: Math.min(1, d.mixProgress + delta / (Math.PI * 4)),
    }));
  }
  function autoMix() {
    if (autoMixing) return;
    setAutoMixing(true);
    autoRef.current = setInterval(
      () =>
        modifyDraft((d) => ({
          ...d,
          mixProgress: Math.min(1, d.mixProgress + 0.06),
        })),
      90,
    );
  }
  function startCultivation() {
    if (positiveIngredientCount(recipe) < 2 || draft.mixProgress < 1) return;
    modifyDraft((d) => ({
      ...d,
      runId: newRunId(),
      growthProgress: 0,
    }));
    move(4);
    setPlaying(!reduced);
  }
  function finish() {
    if (draft.growthProgress < 100) return;
    const id = draft.runId || newRunId();
    const existing = history.find((h) => h.id === id);
    if (existing) {
      setState((s) => ({ ...s, resultId: id }));
      move(5);
      return;
    }
    const entry = {
      id,
      number: nextNumber,
      date: new Date().toISOString(),
      recipe,
      portions: { ...draft.portions },
      moisture: draft.moisture,
      temperature: draft.temperature,
      days: draft.days,
      treated: draft.treated,
      ...evaluate({ ...draft, recipe }),
      pinned: false,
      storageMode: state.privacy,
    };
    setState((s) => ({
      ...s,
      history: [entry, ...s.history],
      resultId: id,
      nextNumber: s.nextNumber + 1,
      draft: { ...s.draft, runId: id },
    }));
    move(5);
  }
  function replaceDraft(next, after = 2, message = null) {
    const action = () => {
      setState((s) => ({
        ...s,
        draft: next,
        resultId: null,
        resumeDraft: null,
      }));
      setOverlay(null);
      move(after);
      if (message) notify(message);
    };
    if (
      Object.keys(draft.portions).length &&
      !history.some((h) => h.id === draft.runId)
    )
      setOverlay({
        kind: "confirm",
        action,
        title: "Begin a new experiment?",
        message:
          "This will replace the current unfinished recipe. Recorded experiments will remain in your notebook.",
      });
    else action();
  }
  function newExperiment() {
    replaceDraft(freshDraft());
  }
  function duplicate(entry) {
    replaceDraft(
      draftFromEntry(entry),
      3,
      entry.days == null || entry.treated == null
        ? "This earlier recipe uses new defaults: 18 days and treated substrate. Review these settings before cultivation."
        : null,
    );
  }
  function openRecord(entry) {
    setState((s) => ({ ...s, resultId: entry.id }));
    move(5);
  }
  function retry() {
    if (result) duplicate(result);
    else move(3);
  }
  function saveResult() {
    setState((s) => ({
      ...s,
      history: s.history.map((h) =>
        h.id === resultId ? { ...h, pinned: true } : h,
      ),
    }));
    notify("Experiment saved and pinned in your notebook.");
  }
  function resume() {
    if (state.resumeDraft) {
      const next = state.resumeDraft;
      setState((s) => ({ ...s, draft: next, resumeDraft: null }));
      move(next.mixProgress >= 1 ? 3 : 2);
      return;
    }
    move(
      draft.runId && draft.growthProgress > 0
        ? 4
        : draft.mixProgress >= 1
          ? 3
          : 2,
    );
  }
  return (
    <div className={`app-shell stage-${step}`}>
      <DeploymentUpdate
        onBeforeUpdate={() => {
          try {
            const { local, session } = browserStores();
            persistState(state, local, session);
            return true;
          } catch {
            return false;
          }
        }}
      />
      <header className="site-header">
        <div className="header-left">
          {step > 0 && (
            <button
              className="icon-button back-button"
              aria-label="Go back"
              onClick={() =>
                step === 2 && draft.mixing
                  ? beginMix(false)
                  : move(step === 7 ? 6 : step - 1)
              }
            >
              <ArrowLeft size={19} />
            </button>
          )}
          <button
            className="wordmark"
            aria-label="Return to Welcome"
            onClick={() => move(0)}
          >
            BLUE<span>GREEN</span>
            <i />
          </button>
        </div>
        <span className="header-context">
          {step === 0 ? "A FIELD GUIDE TO MATERIAL FUTURES" : STAGE_NAMES[step]}
        </span>
        <div className="header-right">
          {step === 0 && (
            <button
              className="icon-button"
              aria-label="Open Experiment Notebook"
              onClick={() => move(7)}
            >
              <BookOpen size={20} />
            </button>
          )}
          {step > 0 && (
            <button
              className="icon-button"
              aria-label="Contextual Help"
              onClick={() => setOverlay({ kind: "help" })}
            >
              <Info size={19} />
            </button>
          )}
          <button
            className="icon-button"
            aria-label="Open navigation menu"
            onClick={() => setOverlay({ kind: "menu" })}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>
      {step > 0 && (
        <nav className="journey-progress" aria-label="Experiment journey">
          {STAGE_NAMES.slice(1).map((name, i) => (
            <button
              key={name}
              title={name}
              aria-label={`Go to ${name}`}
              aria-current={step === i + 1 ? "step" : undefined}
              disabled={i + 1 > step}
              onClick={() => move(i + 1)}
              className={
                step === i + 1 ? "active" : step > i + 1 ? "completed" : ""
              }
            >
              <span />
              <small>{String(i + 1).padStart(2, "0")}</small>
            </button>
          ))}
          <span className="journey-caption">
            {String(
              step > 2 ? step + 2 : step === 2 && draft.mixing ? 4 : step + 1,
            ).padStart(2, "0")}{" "}
            / 09
          </span>
        </nav>
      )}
      <main
        ref={screenRef}
        tabIndex={-1}
        aria-label={
          step === 2 && draft.mixing ? "Stir Your Substrate" : STAGE_NAMES[step]
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{
              opacity: 0,
              scale: reduced ? 1 : 0.975,
              y: reduced ? 0 : 12,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: reduced ? 1 : 1.025,
              y: reduced ? 0 : -8,
            }}
            transition={{ duration: reduced ? 0 : 0.32 }}
          >
            {step === 0 && (
              <Welcome
                onEnter={() => move(1)}
                onAbout={() => setOverlay({ kind: "help" })}
                hasProgress={
                  !!state.resumeDraft ||
                  Object.values(draft.portions).some((n) => n > 0)
                }
                onResume={resume}
              />
            )}
            {step === 1 && (
              <LaboratoryIntroduction
                onStart={() => move(2)}
                onMaterial={(m) =>
                  setOverlay({ kind: "material", material: m })
                }
              />
            )}
            {step === 2 && (
              <MixingScreen
                draft={draft}
                recipe={recipe}
                onPortion={portion}
                onMaterial={(m) =>
                  setOverlay({ kind: "material", material: m })
                }
                onBeginMix={beginMix}
                onStir={stir}
                onAuto={autoMix}
                autoMixing={autoMixing}
                onContinue={() => move(3)}
                onNotice={notify}
                onRecipeChange={(id, v) =>
                  modifyDraft((d) => setIngredientPercent(d, id, v))
                }
                onRemove={(id) => modifyDraft((d) => removeIngredient(d, id))}
                onReference={() =>
                  replaceDraft(
                    referenceDraft(),
                    2,
                    "Reference Recipe loaded. These are illustrative model settings, not a guarantee of biological success.",
                  )
                }
              />
            )}
            {step === 3 && (
              <ConditionsScreen
                draft={draft}
                recipe={recipe}
                onField={field}
                onStart={startCultivation}
                onReview={() => {
                  beginMix(false);
                  move(2);
                }}
              />
            )}
            {step === 4 && (
              <GrowthScreen
                key={replay}
                draft={draft}
                recipe={recipe}
                playing={playing}
                onPlay={() => setPlaying((p) => !p)}
                onSkip={() => {
                  modifyDraft((d) => ({ ...d, growthProgress: 100 }));
                  setPlaying(false);
                }}
                onResults={finish}
                onRestart={() => {
                  modifyDraft((d) => ({ ...d, growthProgress: 0 }));
                  setReplay((n) => n + 1);
                  setPlaying(!reduced);
                }}
              />
            )}
            {step === 5 &&
              (result ? (
                <ResultPanel
                  result={result}
                  onExplore={() => move(6)}
                  onRetry={retry}
                  onDetails={() =>
                    setOverlay({ kind: "details", entry: result })
                  }
                  onCompare={() => move(7)}
                  onSave={saveResult}
                />
              ) : (
                <section className="missing-result">
                  <ScreenHeading
                    eyebrow="YOUR LABORATORY"
                    title="An experiment is waiting."
                    description="Return to your recipe to create and cultivate a mixture."
                  />
                  <Button onClick={() => move(2)}>
                    Return to the Laboratory
                    <ArrowRight size={18} />
                  </Button>
                </section>
              ))}
            {step === 6 && (
              <LifecycleGallery
                result={result}
                onNew={newExperiment}
                onNotebook={() => move(7)}
              />
            )}
            {step === 7 && (
              <section className="notebook-screen">
                <div className="notebook-privacy">
                  <label>
                    Notebook privacy{" "}
                    <select
                      aria-label="Notebook privacy"
                      value={state.privacy}
                      onChange={(e) =>
                        setState((s) => ({ ...s, privacy: e.target.value }))
                      }
                    >
                      <option value="device">
                        Keep new records on this device
                      </option>
                      <option value="session">
                        New records in this tab only
                      </option>
                    </select>
                  </label>
                  <p className="fine-print">
                    Existing device records remain intact in either mode.
                    Session-only records disappear when this browser tab’s
                    session ends.
                  </p>
                </div>
                <ScreenHeading
                  eyebrow="YOUR EXPERIMENT NOTEBOOK"
                  title={
                    <>
                      Some ideas
                      <br />
                      <em>deserve another page.</em>
                    </>
                  }
                  description="A record of choices, connections and possibilities."
                  center
                />
                <ExperimentNotebook
                  history={history}
                  onOpen={openRecord}
                  onDuplicate={duplicate}
                  onCompare={(entries) =>
                    setOverlay({ kind: "compare", entries })
                  }
                />
                <ActionDock>
                  <Button onClick={newExperiment}>
                    Run Another Experiment
                    <RotateCcw size={17} />
                  </Button>
                  <Button secondary onClick={() => move(1)}>
                    Return to the Laboratory
                    <ArrowRight size={17} />
                  </Button>
                </ActionDock>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="site-footer">
        <span>
          <Leaf size={13} /> BLUEGREEN / MATERIAL FUTURES
        </span>
        <button onClick={() => setOverlay({ kind: "help" })}>
          Research & Assumptions
          <ArrowRight size={12} />
        </button>
        <span className="footer-local">NO ACCOUNTS. JUST CURIOSITY.</span>
      </footer>
      {(notice || storageError) && (
        <div
          className={`feedback-toast ${storageError ? "storage-error" : ""}`}
          role="status"
        >
          <Check size={16} />
          <p>
            {storageError
              ? "Device storage is unavailable. Your progress will stay in this session only."
              : notice}
          </p>
        </div>
      )}
      {overlay && (
        <Modal
          title={
            overlay.kind === "help"
              ? "About This Experience"
              : overlay.kind === "menu"
                ? "Your Laboratory"
                : overlay.kind === "material"
                  ? overlay.material.name
                  : overlay.kind === "confirm"
                    ? overlay.title
                    : overlay.kind === "compare"
                      ? "Compare Experiments"
                      : `Experiment ${overlay.entry.number} Details`
          }
          onClose={closeOverlay}
          className={overlay.kind === "compare" ? "wide-modal" : ""}
        >
          {overlay.kind === "help" && <HelpContent step={step} />}
          {overlay.kind === "material" && (
            <>
              <div
                className="material-study"
                style={{
                  backgroundImage: `url(${asset("images/illustrated-materials.png")})`,
                  backgroundPosition: overlay.material.position,
                }}
              />
              <p className="eyebrow">{overlay.material.label}</p>
              <p>{overlay.material.description}</p>
              <p>{overlay.material.detail}</p>
              <Button secondary onClick={closeOverlay}>
                Back to the Workbench
                <ArrowRight size={16} />
              </Button>
            </>
          )}
          {overlay.kind === "menu" && (
            <div className="menu-options">
              <button
                onClick={() => {
                  setOverlay(null);
                  move(0);
                }}
              >
                <Home size={19} />
                <span>
                  Return to Welcome<small>Your recipe will be kept.</small>
                </span>
                <ArrowRight size={17} />
              </button>
              <button
                onClick={() => {
                  setOverlay(null);
                  move(7);
                }}
              >
                <BookOpen size={19} />
                <span>
                  View My Experiments<small>Open your field notebook.</small>
                </span>
                <ArrowRight size={17} />
              </button>
              <button onClick={newExperiment}>
                <RotateCcw size={19} />
                <span>
                  Restart Experiment<small>Begin with an empty vessel.</small>
                </span>
                <ArrowRight size={17} />
              </button>
              <button onClick={() => setOverlay({ kind: "help" })}>
                <Info size={19} />
                <span>
                  Help & Research<small>Explore our assumptions.</small>
                </span>
                <ArrowRight size={17} />
              </button>
            </div>
          )}
          {overlay.kind === "confirm" && (
            <>
              <p>{overlay.message}</p>
              <div className="confirm-actions">
                <Button secondary onClick={closeOverlay}>
                  Keep My Experiment
                </Button>
                <Button onClick={overlay.action}>
                  Begin New Experiment
                  <ArrowRight size={16} />
                </Button>
              </div>
            </>
          )}
          {overlay.kind === "details" && (
            <>
              <ExperimentSummary experiment={overlay.entry} />
              <p className="fine-print">
                Separate fixed illustrative mycelium starter · model v
                {overlay.entry.modelVersion}. No inoculum proportion is included
                in the waste recipe.
              </p>
              <h3>Recorded explanations</h3>
              <ul className="details-reasons">
                {overlay.entry.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
          {overlay.kind === "compare" && (
            <ComparisonPanel experiments={overlay.entries} />
          )}
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
