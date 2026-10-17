import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowLeft, X, Leaf, Info, Check } from "lucide-react";
import { CONTEXT_HELP, SOURCES, REFERENCE_NOTES } from "../data/research";
export const asset = (path) =>
  (typeof __IMAGE_ASSETS__ !== "undefined" && __IMAGE_ASSETS__[path]) ||
  `${import.meta.env.BASE_URL}${path}`;
export function Button({
  children,
  onClick,
  secondary = false,
  className = "",
  ...props
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      whileTap={reduced ? undefined : { scale: 0.97 }}
      onClick={onClick}
      className={`button ${secondary ? "secondary" : "primary"} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
export function ScreenHeading({ eyebrow, title, description, center = false }) {
  return (
    <div className={`screen-heading ${center ? "center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p className="screen-description">{description}</p>}
    </div>
  );
}
export function Guide({ message, mood = "calm", compact = false }) {
  return (
    <div className={`guide ${compact ? "compact" : ""}`}>
      <svg
        className={`guide-character ${mood}`}
        viewBox="0 0 90 100"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="guide-cream">
            <stop stopColor="#fffef2" />
            <stop offset="1" stopColor="#cfdfc3" />
          </radialGradient>
        </defs>
        <g stroke="#647b61" fill="none" strokeWidth="1" opacity=".8">
          <path d="M44 75q-25 11-28 22m21-15-20-2m16 6-3 11M48 75q21 8 26 23m-13-17 20 3m-16 1 4 12" />
        </g>
        <path
          d="M32 50q-9 20-3 30q15 7 29-1q6-13-2-28"
          fill="url(#guide-cream)"
        />
        <path
          d="M9 46Q12 18 42 18q29-2 39 29Q70 58 49 54Q26 58 9 46Z"
          fill="#bf7751"
          stroke="#35413a"
          strokeWidth="1.1"
        />
        {[
          [27, 32],
          [40, 26],
          [55, 30],
          [65, 40],
          [20, 42],
        ].map(([x, y]) => (
          <ellipse
            key={x}
            cx={x}
            cy={y}
            rx="2"
            ry="1.4"
            fill="#f3ebd9"
            stroke="#705845"
            strokeWidth=".5"
          />
        ))}
        <path
          d="M19 43q25-14 51 1M25 45q20-11 39 0"
          fill="none"
          stroke="#796747"
          strokeWidth="1"
        />
        <circle cx="37" cy="65" r="2" fill="#163f42" />
        <circle cx="51" cy="65" r="2" fill="#163f42" />
        <path
          d={mood === "happy" ? "M39 72q5 5 10 0" : "M41 73q3 2 6 0"}
          fill="none"
          stroke="#799a80"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path d="M53 21q4-13 15-14q-1 13-15 14" fill="#9caf87" />
        <path d="M53 21l11-10" stroke="#c8dab3" />
      </svg>
      <div>
        <span className="guide-name">MILO / YOUR MYCELIUM GUIDE</span>
        <p>{message}</p>
      </div>
    </div>
  );
}
export function Modal({ title, children, onClose, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    const first = dialog?.querySelector("button");
    first?.focus();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const listener = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = [
          ...dialog.querySelectorAll(
            'button:not(:disabled),a,input,select,[tabindex="0"]',
          ),
        ];
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      document.body.style.overflow = before;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`modal ${className}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button modal-close"
          aria-label={`Close ${title}`}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <p className="eyebrow">BLUEGREEN / FIELD NOTES</p>
        <h2>{title}</h2>
        {children}
      </motion.section>
    </div>
  );
}
export function HelpContent({ step }) {
  const help = CONTEXT_HELP[step];
  return (
    <>
      <div className="help-context">
        <Info size={20} />
        <div>
          <h3>{help.title}</h3>
          <p>{help.text}</p>
        </div>
      </div>
      <h3>Three kinds of knowledge</h3>
      <div className="knowledge-notes">
        <p>
          <span>01 / RESEARCH CONTEXT</span>
          {REFERENCE_NOTES[0]}
        </p>
        <p>
          <span>02 / SIMULATION ASSUMPTIONS</span>The model uses 55–70%
          substrate moisture, 20–28°C and 10–28 days as illustrative ranges.
          Coffee above 40% and paper above 50% add stressors. One or two
          stressors gives incomplete growth; three, extreme conditions (outside
          40–80% or 15–33°C), or untreated substrate triggers an illustrative
          risk state.
        </p>
        <p>
          <span>03 / UNVERIFIED EXPLORATION</span>Four-material blends and
          periods above 28 days exceed this model’s coverage. They do not imply
          biological failure. Known modeled risk flags take precedence over
          uncertainty.
        </p>
      </div>
      <h3>A separate living starter</h3>
      <p>
        Mycelium culture is supplied as a fixed illustrative laboratory starter,
        separate from the waste recipe. Species, inoculum dose, airflow and real
        sterilization protocols are not modeled.
      </p>
      <p>
        Substrate moisture is water / wet substrate mass. Ambient relative
        humidity is not controlled. Nothing here predicts success probabilities,
        mechanical strength, safety or a universal growing optimum.
      </p>
      <h3>Published research</h3>
      {SOURCES.map((s) => (
        <a
          className="source-link"
          href={s.url}
          target="_blank"
          rel="noreferrer"
          key={s.id}
        >
          {s.authors} ({s.year}) · {s.title}
          <ArrowRight size={15} />
        </a>
      ))}
      <p className="fine-print">
        Progress stays in this tab. Device-mode notebook records remain on this
        device without automatic pruning. Artwork is original illustrative
        imagery, not a photograph of an observed experiment.
      </p>
    </>
  );
}
export function CompositionStrip({ recipe }) {
  return (
    <div
      className="composition-strip"
      role="img"
      aria-label={`Recipe composition: ${
        Object.keys(recipe).length
          ? Object.entries(recipe)
              .map(([id, n]) => `${id} ${n}%`)
              .join(", ")
          : "no ingredients selected"
      }`}
    >
      <div
        style={{ background: "#b5956f", width: `${recipe.sawdust || 0}%` }}
      />
      <div style={{ background: "#735345", width: `${recipe.coffee || 0}%` }} />
      <div style={{ background: "#c8bc7d", width: `${recipe.straw || 0}%` }} />
      <div style={{ background: "#d2d2bc", width: `${recipe.paper || 0}%` }} />
    </div>
  );
}
export function ActionDock({ children, note }) {
  return (
    <div className="action-dock">
      {note && <p className="fine-print">{note}</p>}
      <div className="dock-buttons">{children}</div>
    </div>
  );
}
