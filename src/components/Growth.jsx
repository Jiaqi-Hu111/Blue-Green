import { useId, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
export function GrowthVisualization({
  progress = 100,
  outcome = "success",
  sample = false,
  form = "tray",
}) {
  const id = useId().replaceAll(":", "");
  const coverage =
    { success: 1, incomplete: 0.55, failed: 0.27, unverified: 0.66 }[outcome] ||
    0.5;
  const shape =
    form === "vase"
      ? "M153 78Q137 112 160 158L143 276Q200 310 257 276L240 158Q263 112 247 78Q200 56 153 78Z"
      : form === "panel"
        ? "M87 84L303 57L332 245L109 280Z"
        : "M68 92Q70 66 100 66H298Q328 66 332 96L349 235Q351 271 310 279H91Q50 271 52 238Z";
  return (
    <svg
      className={`growth-visualization ${outcome} ${sample ? "sample" : ""}`}
      viewBox="0 0 400 330"
      role="img"
      aria-label={`${outcome === "success" ? "Extensively connected" : outcome === "incomplete" ? "Patchy" : outcome === "failed" ? "Interrupted" : "Exploratory"} illustrative mycelium ${form} sample`}
    >
      <defs>
        <radialGradient id={`substrate-${id}`}>
          <stop stopColor="#ae9674" />
          <stop offset="1" stopColor="#66523d" />
        </radialGradient>
        <linearGradient id={`sample-${id}`} x2=".7" y2="1">
          <stop stopColor="#eee8d8" />
          <stop offset="1" stopColor="#c1b79c" />
        </linearGradient>
        <filter id={`texture-${id}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".27"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feColorMatrix in="noise" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope=".3" />
          </feComponentTransfer>
          <feComposite
            in2="SourceGraphic"
            operator="in"
            result="clippedNoise"
          />
          <feBlend in="SourceGraphic" in2="clippedNoise" mode="soft-light" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id={`substrate-clip-${id}`}>
          <path d={shape} />
        </clipPath>
      </defs>
      <ellipse cx="202" cy="287" rx="151" ry="17" fill="#071a18" opacity=".3" />
      <path d={shape} transform="translate(0 9)" fill="#71624a" />
      <path
        d={shape}
        fill={`url(#${sample && outcome === "success" ? "sample" : "substrate"}-${id})`}
        filter={`url(#texture-${id})`}
      />
      {sample && form === "tray" && (
        <path
          d="M96 114Q90 91 113 92H288Q311 92 307 116L319 226Q322 244 299 246H103Q77 240 82 224Z"
          fill="#8b7f63"
          fillOpacity=".3"
          stroke="#f8f4df"
          strokeOpacity=".6"
          strokeWidth="3"
        />
      )}
      <g clipPath={`url(#substrate-clip-${id})`}>
        {Array.from({ length: 74 }, (_, i) => {
          const x = 65 + ((i * 83) % 280),
            y = 70 + ((i * 57) % 200);
          const opacity = Math.max(
            0,
            Math.min(1, ((progress / 100) * coverage - i / 95) * 7),
          );
          return (
            <g
              key={i}
              transform={`rotate(${(i * 47) % 360} ${x} ${y})`}
              opacity={opacity}
              fill="none"
              stroke={outcome === "unverified" ? "#c7dcca" : "#f6f3e3"}
              strokeWidth={i % 4 === 0 ? "2" : "1"}
              strokeLinecap="round"
              strokeDasharray={outcome === "unverified" ? "3 3" : undefined}
            >
              <path
                d={`M${x - 25} ${y + 24}Q${x + 10} ${y + 12} ${x + 30} ${y - 26}m-21 23l-9-25m17 15 20 2m-18-7 10-20m-22 37-22 3`}
              />
              <path
                d={`M${x + 18} ${y - 4}q13-22 37-30m-14 11l1-13m-6 18 13 0`}
                strokeWidth=".7"
              />
              <circle cx={x + 30} cy={y - 26} r="1.5" fill="#d9eac6" />
            </g>
          );
        })}
        {outcome === "failed" &&
          Array.from({ length: 8 }, (_, i) => (
            <circle
              key={i}
              cx={96 + ((i * 37) % 220)}
              cy={110 + ((i * 53) % 130)}
              r={9 + (i % 3) * 5}
              fill="#786c4a"
              opacity={(progress / 100) * 0.65}
              stroke="#bfa173"
              strokeDasharray="2 4"
            />
          ))}
      </g>
      <path
        d={shape}
        fill="none"
        stroke="#e8e5d0"
        strokeOpacity=".28"
        strokeWidth="1"
      />
    </svg>
  );
}
export function MaterialSample({
  outcome = "success",
  form = "tray",
  interactive = false,
}) {
  const [angle, setAngle] = useState(0),
    gesture = useRef(null);
  function move(e) {
    if (!gesture.current) return;
    setAngle(
      Math.max(
        -35,
        Math.min(
          35,
          gesture.current.angle + (e.clientX - gesture.current.x) / 3,
        ),
      ),
    );
  }
  return (
    <div className={`material-sample ${interactive ? "rotatable" : ""}`}>
      <div className="sample-platform" />
      <div
        className="sample-object"
        style={{
          transform: `perspective(700px) rotateY(${angle}deg) rotateX(${interactive ? 9 : 0}deg)`,
        }}
        onPointerDown={(e) => {
          if (!interactive) return;
          gesture.current = { x: e.clientX, angle };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={move}
        onPointerUp={() => (gesture.current = null)}
        onPointerCancel={() => (gesture.current = null)}
      >
        <GrowthVisualization
          progress={100}
          outcome={outcome}
          sample
          form={form}
        />
      </div>
      {interactive && (
        <div className="sample-rotation">
          <button
            className="round-control"
            aria-label="Rotate sample left"
            onClick={() => setAngle((a) => Math.max(-35, a - 10))}
          >
            <RotateCcw size={16} />
          </button>
          <input
            aria-label="Sample viewing angle"
            type="range"
            min="-35"
            max="35"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
          <button
            className="round-control"
            aria-label="Rotate sample right"
            onClick={() => setAngle((a) => Math.min(35, a + 10))}
          >
            <RotateCw size={16} />
          </button>
        </div>
      )}
      <span className="specimen-caption">
        {outcome === "unverified"
          ? "EXPLORATORY FORM / NOT A PREDICTION"
          : outcome === "failed"
            ? "ILLUSTRATIVE RISK STATE / NOT A DIAGNOSIS"
            : "ILLUSTRATIVE MATERIAL / NOT A MEASURED SAMPLE"}
      </span>
    </div>
  );
}
