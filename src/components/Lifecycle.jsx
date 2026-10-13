import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Leaf,
  Package,
  Layers,
  FlaskConical,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { APPLICATIONS, LIFECYCLE, SOURCES } from "../data/research";
import { Button, ScreenHeading, ActionDock } from "./Common";
import { MaterialSample } from "./Growth";
export function LifecycleGallery({ result, onNew, onNotebook }) {
  const [application, setApplication] = useState(APPLICATIONS[0]),
    [stage, setStage] = useState(3);
  return (
    <section className="lifecycle-gallery">
      <ScreenHeading
        eyebrow="THE DISCOVERY GALLERY / BEYOND GROWTH"
        title={
          <>
            Grown for a purpose.
            <br />
            <em>Considered for a cycle.</em>
          </>
        }
        description="A living network is only the beginning of a material’s story."
        center
      />
      <div className="gallery-showcase">
        <div className="gallery-sample">
          <span className="eyebrow">SPECIMEN / POSSIBLE FORM</span>
          <MaterialSample
            key={application.id}
            outcome={result?.outcome || "unverified"}
            form={application.form}
            interactive
          />
          <p className="fine-print">
            Drag the sample or use the rotation controls. Forms are conceptual,
            not verified products.
          </p>
        </div>
        <div className="gallery-interpretation">
          <p className="eyebrow">POTENTIAL APPLICATIONS</p>
          <div className="application-options">
            {APPLICATIONS.map((a) => (
              <button
                className={application.id === a.id ? "selected" : ""}
                key={a.id}
                onClick={() => setApplication(a)}
                aria-pressed={application.id === a.id}
              >
                {a.icon === "package" ? (
                  <Package size={20} />
                ) : a.icon === "layers" ? (
                  <Layers size={20} />
                ) : (
                  <FlaskConical size={20} />
                )}
                <span>{a.title}</span>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
          <article className="application-note" aria-live="polite">
            <span className="eyebrow">{application.subtitle}</span>
            <h2>{application.title}</h2>
            <p>{application.description}</p>
            <div className="material-caution">
              <Leaf size={17} />
              <p>{application.considerations}</p>
            </div>
            <a
              href={SOURCES.find((s) => s.id === application.source).url}
              target="_blank"
              rel="noreferrer"
            >
              Read the research context
              <ArrowUpRight size={14} />
            </a>
          </article>
        </div>
      </div>
      <section className="formation-note">
        <span className="eyebrow">TRANSFORMATION IS A PROCESS</span>
        <h2>Grow. Shape. Dry. Finish.</h2>
        <p>
          Growth binds the substrate; moulding guides its geometry. Drying
          removes moisture and is often part of stopping growth, while
          post-processing changes the final surface and behaviour. Real
          processes need their own evidence and testing.
        </p>
        <div className="process-sequence">
          <span>GROWTH</span>
          <ArrowRight size={14} />
          <span>MOULDING</span>
          <ArrowRight size={14} />
          <span>DRYING</span>
          <ArrowRight size={14} />
          <span>FINISHING</span>
        </div>
      </section>
      <section className="lifecycle-explorer">
        <div className="lifecycle-copy">
          <p className="eyebrow">THINK IN CYCLES</p>
          <h2>
            Nothing exists
            <br />
            <em>in isolation.</em>
          </h2>
          <p>Tap a stop to follow the complete material lifecycle.</p>
        </div>
        <div className="lifecycle-wheel" aria-label="Material lifecycle">
          <svg viewBox="0 0 300 300" aria-hidden="true">
            <circle
              cx="150"
              cy="150"
              r="105"
              fill="none"
              stroke="#8fa99a"
              strokeWidth="1"
              strokeDasharray="3 6"
            />
            <circle
              cx="150"
              cy="150"
              r="63"
              fill="none"
              stroke="#8fa99a"
              strokeOpacity=".25"
            />
            <path
              d="M144 100Q188 110 180 151q-25-4-36-51Z"
              fill="#8fa99a"
              fillOpacity=".2"
            />
            <path
              d="M146 163q-31-32-43-23q7 34 43 23"
              fill="#b7c9a9"
              fillOpacity=".2"
            />
          </svg>
          <span className="wheel-center">
            <Leaf size={25} />
            <span>
              A MATERIAL’S
              <br />
              NEXT LIFE
            </span>
          </span>
          {LIFECYCLE.map((s, i) => {
            const a = ((i * 60 - 90) * Math.PI) / 180;
            return (
              <button
                className={stage === i ? "active" : ""}
                key={s.id}
                onClick={() => setStage(i)}
                aria-label={`Explore ${s.title}`}
                aria-pressed={stage === i}
                style={{
                  left: `${50 + 35 * Math.cos(a)}%`,
                  top: `${50 + 35 * Math.sin(a)}%`,
                }}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
              </button>
            );
          })}
        </div>
        <article className="lifecycle-stage" aria-live="polite">
          <span className="eyebrow">0{stage + 1} / THE MATERIAL LIFECYCLE</span>
          <h3>{LIFECYCLE[stage].title}</h3>
          <p>{LIFECYCLE[stage].text}</p>
        </article>
      </section>
      <div className="origin-note">
        <span>BACK TO THE BEGINNING</span>
        <p>
          {result
            ? `Your recipe began with ${Object.keys(result.recipe)
                .map(
                  (id) =>
                    ({
                      sawdust: "sawdust",
                      coffee: "coffee grounds",
                      straw: "straw",
                      paper: "paper fibres",
                    })[id],
                )
                .join(
                  ", ",
                )}. Each choice remains part of this material’s story.`
            : "Every material starts with a source, a process and a set of choices."}
        </p>
      </div>
      <ActionDock>
        <Button onClick={onNew}>
          Explore Another Recipe
          <RotateCcw size={17} />
        </Button>
        <Button secondary onClick={onNotebook}>
          View My Experiments
          <BookOpen size={17} />
        </Button>
      </ActionDock>
    </section>
  );
}
