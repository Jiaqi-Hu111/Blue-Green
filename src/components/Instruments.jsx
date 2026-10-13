import { useRef, useEffect, useId } from "react";
import { Minus, Plus, ShieldCheck, Leaf, CalendarDays } from "lucide-react";
function useVerticalInstrument(value, min, max, onChange) {
  const held = useRef(false);
  const update = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
    onChange(Math.round(min + ratio * (max - min)));
  };
  return {
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      held.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      update(e);
    },
    onPointerMove: (e) => {
      if (held.current) update(e);
    },
    onPointerUp: () => (held.current = false),
    onPointerCancel: () => (held.current = false),
    onKeyDown: (e) => {
      if (
        [
          "ArrowUp",
          "ArrowRight",
          "ArrowDown",
          "ArrowLeft",
          "Home",
          "End",
        ].includes(e.key)
      ) {
        e.preventDefault();
        onChange(
          e.key === "Home"
            ? min
            : e.key === "End"
              ? max
              : Math.max(
                  min,
                  Math.min(
                    max,
                    value +
                      (["ArrowUp", "ArrowRight"].includes(e.key) ? 1 : -1),
                  ),
                ),
        );
      }
    },
  };
}
function ValueControl({ label, value, min, max, unit, onChange }) {
  return (
    <div className="instrument-controls">
      <button
        className="round-control"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={16} />
      </button>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <button
        className="round-control"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
export function Thermometer({ value, onChange }) {
  const handlers = useVerticalInstrument(value, 10, 38, onChange);
  return (
    <section className="instrument thermometer-instrument">
      <div className="instrument-number">01 / TEMPERATURE</div>
      <div className="instrument-main">
        <div
          className="thermometer interactive-instrument"
          role="slider"
          aria-label="Drag temperature liquid"
          aria-valuemin={10}
          aria-valuemax={38}
          aria-valuenow={value}
          aria-valuetext={`${value} degrees Celsius`}
          tabIndex={0}
          {...handlers}
        >
          <div className="thermometer-markings">
            {[38, 30, 20, 10].map((n) => (
              <span key={n}>{n} —</span>
            ))}
          </div>
          <div className="thermometer-tube">
            <div
              className="thermometer-liquid"
              style={{
                height: `${15 + ((value - 10) / 28) * 80}%`,
                background: value > 28 ? "#dc9b6e" : "#bdd4a5",
              }}
            />
          </div>
          <div
            className="thermometer-bulb"
            style={{ background: value > 28 ? "#dc9b6e" : "#bdd4a5" }}
          />
        </div>
        <div className="instrument-reading">
          <h2>
            Incubation
            <br />
            Temperature
          </h2>
          <div className="instrument-value">
            {value}
            <span>°C</span>
          </div>
          <p>A gentle climate for a growing network.</p>
          <span className="instrument-hint">DRAG THE LIQUID UP OR DOWN</span>
        </div>
      </div>
      <ValueControl
        label="Incubation Temperature"
        value={value}
        min={10}
        max={38}
        unit="°C"
        onChange={onChange}
      />
    </section>
  );
}
export function MoistureInstrument({ value, onChange }) {
  const id = useId().replaceAll(":", "");
  const handlers = useVerticalInstrument(value, 30, 90, onChange);
  return (
    <section className="instrument moisture-instrument">
      <div className="instrument-number">02 / HYDRATION</div>
      <div className="instrument-main">
        <div
          className="moisture-drop interactive-instrument"
          role="slider"
          aria-label="Drag substrate water level"
          aria-valuemin={30}
          aria-valuemax={90}
          aria-valuenow={value}
          aria-valuetext={`${value} percent substrate moisture`}
          tabIndex={0}
          {...handlers}
        >
          <svg viewBox="0 0 150 200" aria-hidden="true">
            <defs>
              <clipPath id={`drop-${id}`}>
                <path d="M75 8C58 43 15 88 15 133a60 60 0 00120 0C135 88 92 43 75 8Z" />
              </clipPath>
              <linearGradient id={`water-${id}`} x2="0" y2="1">
                <stop stopColor="#7bafaf" stopOpacity=".8" />
                <stop offset="1" stopColor="#376f76" stopOpacity=".65" />
              </linearGradient>
            </defs>
            <path
              d="M75 8C58 43 15 88 15 133a60 60 0 00120 0C135 88 92 43 75 8Z"
              fill="#aed5d0"
              fillOpacity=".07"
              stroke="#aed5d0"
              strokeWidth="1.5"
            />
            <g clipPath={`url(#drop-${id})`}>
              <rect
                x="0"
                y={192 - value * 1.5}
                width="150"
                height="200"
                fill={`url(#water-${id})`}
              />
              <path
                className="water-ripple"
                d={`M-20 ${192 - value * 1.5}q30-9 60 0t60 0t60 0`}
                fill="none"
                stroke="#c3e4d9"
                strokeWidth="3"
              />
            </g>
            <path
              d="M43 93q-19 35-10 54"
              fill="none"
              stroke="#e1f3e9"
              strokeOpacity=".45"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <span className="water-base" />
        </div>
        <div className="instrument-reading">
          <h2>
            Substrate
            <br />
            Moisture
          </h2>
          <div className="instrument-value">
            {value}
            <span>%</span>
          </div>
          <p>Water held in the substrate itself.</p>
          <span className="instrument-hint">NOT AMBIENT RELATIVE HUMIDITY</span>
        </div>
      </div>
      <ValueControl
        label="Substrate Moisture"
        value={value}
        min={30}
        max={90}
        unit="%"
        onChange={onChange}
      />
      <p className="fine-print">
        Water / wet substrate mass. All ranges are illustrative assumptions.
      </p>
    </section>
  );
}
export function IncubationDial({ value, onChange }) {
  const wheel = useRef(null),
    timer = useRef(null),
    changeRef = useRef(onChange);
  changeRef.current = onChange;
  function center(day, smooth = true) {
    const button = wheel.current?.querySelector(`[data-day="${day}"]`);
    if (button) {
      wheel.current.scrollTo({
        left:
          button.offsetLeft -
          wheel.current.clientWidth / 2 +
          button.offsetWidth / 2,
        behavior: smooth ? "smooth" : "instant",
      });
    }
  }
  useEffect(() => {
    center(value, false);
    return () => clearTimeout(timer.current);
  }, []);
  function scroll() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const node = wheel.current;
      if (!node) return;
      const r = node.getBoundingClientRect(),
        middle = r.left + r.width / 2;
      const buttons = [...node.querySelectorAll("button")];
      const closest = buttons.reduce((a, b) =>
        Math.abs(b.getBoundingClientRect().left + b.offsetWidth / 2 - middle) <
        Math.abs(a.getBoundingClientRect().left + a.offsetWidth / 2 - middle)
          ? b
          : a,
      );
      changeRef.current(Number(closest.dataset.day));
    }, 100);
  }
  function pick(day) {
    onChange(day);
    center(day);
  }
  return (
    <section className="instrument incubation-instrument">
      <div className="instrument-number">03 / TIME</div>
      <div className="dial-title">
        <CalendarDays size={24} />
        <h2>Incubation Period</h2>
        <span className="day-value">
          {value}
          <small> days</small>
        </span>
      </div>
      <p className="instrument-copy">
        A simulated window for the network to unfold.
      </p>
      <div className="day-wheel-wrapper">
        <div
          className="day-wheel"
          ref={wheel}
          onScroll={scroll}
          role="group"
          aria-label="Incubation day wheel"
        >
          {Array.from({ length: 33 }, (_, i) => i + 3).map((day) => (
            <button
              key={day}
              data-day={day}
              onClick={() => pick(day)}
              aria-label={`${day} incubation days`}
              aria-pressed={day === value}
              className={day === value ? "selected" : ""}
            >
              <span>{day}</span>
              <small>DAYS</small>
            </button>
          ))}
        </div>
        <div className="day-wheel-marker" aria-hidden="true" />
      </div>
      <div className="day-adjust">
        <button
          className="round-control"
          aria-label="Decrease Incubation Period"
          disabled={value <= 3}
          onClick={() => pick(value - 1)}
        >
          <Minus size={16} />
        </button>
        <span>SWIPE THE DIAL OR TAP A DAY</span>
        <button
          className="round-control"
          aria-label="Increase Incubation Period"
          disabled={value >= 35}
          onClick={() => pick(value + 1)}
        >
          <Plus size={16} />
        </button>
      </div>
    </section>
  );
}
export function PreparationControl({ treated, onChange }) {
  return (
    <section className="preparation">
      <p className="eyebrow">A THOUGHTFUL BEGINNING</p>
      <h2>Substrate preparation</h2>
      <div className="preparation-options">
        <button
          aria-label="Treated Substrate"
          aria-pressed={treated}
          className={treated ? "selected" : ""}
          onClick={() => onChange(true)}
        >
          <ShieldCheck size={24} />
          <span>
            Treated Substrate<small>Preparation represented</small>
          </span>
        </button>
        <button
          aria-label="Untreated Substrate"
          aria-pressed={!treated}
          className={!treated ? "selected" : ""}
          onClick={() => onChange(false)}
        >
          <Leaf size={24} />
          <span>
            Untreated Substrate<small>Explore a risk condition</small>
          </span>
        </button>
      </div>
      <p className="fine-print">
        Preparation can influence contamination risk. “Treated” is a simplified
        model input, not proof of sterility. No real treatment protocol is
        provided.
      </p>
    </section>
  );
}
