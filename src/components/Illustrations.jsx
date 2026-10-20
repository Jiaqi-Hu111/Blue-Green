import { asset } from "./Common";
/** Original ink illustrations with the supplied, unmodified framed harbour scenery. */
const SCENERY_IMAGE = "images/framed-harbour.png";

export function ExperienceBackground() {
  return (
    <div className="experience-background" aria-hidden="true">
      <img src={asset(SCENERY_IMAGE)} alt="" decoding="async" />
    </div>
  );
}
export function BotanicalSprig({ className = "" }) {
  return (
    <svg
      className={`botanical-sprig ${className}`}
      viewBox="0 0 100 180"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M37 177Q67 106 42 8M45 139l32-25M50 107 22 81M48 76l30-26M45 44 25 22"
        stroke="#35413a"
        strokeWidth="1.6"
      />
      {[
        [39, 144, -30],
        [57, 128, 25],
        [37, 104, -50],
        [57, 87, 25],
        [36, 69, -40],
        [54, 51, 20],
        [36, 32, -30],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path
            d="M0 0Q-19-10-12-29Q7-23 0 0Z"
            fill={i % 2 ? "#a7bda0" : "#6d9180"}
            stroke="#35413a"
            strokeWidth="1.2"
          />
          <path
            d="M0 0l-9-22m4 12-7-2m6-5 4-3"
            stroke="#35413a"
            strokeWidth=".7"
          />
        </g>
      ))}
    </svg>
  );
}
export function CoastalWindow({ className = "", arched = false }) {
  return (
    <div
      className={`coastal-window ${arched ? "arched" : ""} ${className}`}
      aria-hidden="true"
    >
      <img src={asset(SCENERY_IMAGE)} alt="" />
      <div className="window-mullion vertical" />
      <div className="window-mullion horizontal" />
      <span className="window-sill" />
      <BotanicalSprig className="window-branch" />
    </div>
  );
}
export function StoryDivider() {
  return (
    <div className="story-divider" aria-hidden="true">
      <span />
      <svg viewBox="0 0 50 30">
        <path
          d="M24 25V13m0 6Q9 19 8 7q16-1 16 12m0 0Q39 18 40 5q-16 0-16 14"
          fill="#a7bda0"
          stroke="#35413a"
          strokeWidth="1.3"
        />
      </svg>
      <span />
    </div>
  );
}
