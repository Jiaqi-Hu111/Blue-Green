import { useRef, useEffect, useState, useId } from "react";
import { MATERIALS, OUTCOMES } from "../simulation";
import {
  TrailNetwork,
  SUBSTRATE_PATH,
  growthTarget,
  hashSeed,
} from "../growthModel";
import { asset } from "./Common";
export function GenerativeGrowth({ recipe, outcome, progress, seedKey }) {
  const id = useId().replaceAll(":", ""),
    canvas = useRef(null),
    scheduleRef = useRef(null),
    progressRef = useRef(progress),
    [fallback, setFallback] = useState(false);
  progressRef.current = progress;
  const seed = hashSeed(seedKey),
    composition = JSON.stringify(recipe);
  useEffect(() => {
    const node = canvas.current;
    let context, path, texture, network;
    try {
      context = node?.getContext("2d");
      if (!context || typeof Path2D === "undefined")
        throw Error("Canvas unavailable");
      path = new Path2D(SUBSTRATE_PATH);
      network = new TrailNetwork({ outcome, seed });
      texture = document.createElement("canvas");
      texture.width = network.width;
      texture.height = network.height;
    } catch {
      setFallback(true);
      return;
    }
    const ink = texture.getContext("2d"),
      pixels = ink?.createImageData(network.width, network.height);
    if (!ink || !pixels) {
      setFallback(true);
      return;
    }
    let frame = 0,
      lastTarget = -1,
      disposed = false;
    function paint() {
      const target = growthTarget(progressRef.current);
      if (target < network.iteration)
        network = new TrailNetwork({ outcome, seed });
      const done = network.advanceTo(target, target >= 240 ? Infinity : 8);
      if (target !== lastTarget || !done) {
        lastTarget = done ? target : -1;
        for (let i = 0; i < network.field.length; i++) {
          const at = i * 4;
          pixels.data[at] = 249;
          pixels.data[at + 1] = 242;
          pixels.data[at + 2] = 218;
          pixels.data[at + 3] = Math.min(
            185,
            Math.max(0, (network.veins[i] - 0.15) * 150),
          );
        }
        ink.putImageData(pixels, 0, 0);
        context.clearRect(0, 0, 400, 330);
        if (progressRef.current >= 20) {
          context.save();
          context.clip(path);
          context.drawImage(texture, 58, 66, 292, 213);
          context.restore();
        }
        node.dataset.iterations = String(network.iteration);
        node.dataset.coverage = String(network.coverage());
      }
      if (!disposed && !document.hidden && !done)
        frame = requestAnimationFrame(paint);
    }
    function visibility() {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(paint);
    }
    scheduleRef.current = visibility;
    document.addEventListener("visibilitychange", visibility);
    frame = requestAnimationFrame(paint);
    return () => {
      disposed = true;
      scheduleRef.current = null;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      context.clearRect(0, 0, 400, 330);
      texture.width = 0;
      texture.height = 0;
    };
  }, [seed, outcome, composition]);
  // A completed/skipped frame needs rendering even after the previous RAF loop stopped.
  useEffect(() => {
    scheduleRef.current?.();
    if (canvas.current)
      canvas.current.dataset.stage =
        progress < 20
          ? "preparation"
          : progress < 45
            ? "early"
            : progress < 80
              ? "network"
              : "assessment";
  }, [progress]);
  let offset = 68;
  return (
    <div
      className="generative-growth"
      role="img"
      aria-label={`${OUTCOMES[outcome]?.label || outcome}: mycelium-inspired generative visualisation`}
    >
      <svg viewBox="0 0 400 330" aria-hidden="true">
        <defs>
          <clipPath id={`substrate-${id}`}>
            <path d={SUBSTRATE_PATH} />
          </clipPath>
          {MATERIALS.map((m, i) => (
            <pattern
              id={`material-${id}-${m.id}`}
              key={m.id}
              width="180"
              height="180"
              patternUnits="userSpaceOnUse"
            >
              <image
                href={asset("images/illustrated-materials.png")}
                x={i % 2 ? -180 : 0}
                y={i > 1 ? -180 : 0}
                width="360"
                height="360"
                preserveAspectRatio="none"
              />
            </pattern>
          ))}
        </defs>
        <path
          d={SUBSTRATE_PATH}
          transform="translate(0 7)"
          fill="#b19165"
          stroke="#35413a"
          strokeWidth="1"
        />
        <g clipPath={`url(#substrate-${id})`}>
          <path d={SUBSTRATE_PATH} fill="#9e845f" />
          {MATERIALS.filter((m) => (recipe[m.id] || 0) > 0).map((m) => {
            const x = offset,
              width = (recipe[m.id] / 100) * 284;
            offset += width;
            return (
              <rect
                key={m.id}
                x={x}
                y="66"
                width={width + 1}
                height="215"
                fill={`url(#material-${id}-${m.id})`}
                opacity=".82"
              />
            );
          })}
        </g>
        <path
          d={SUBSTRATE_PATH}
          fill="none"
          stroke="#35413a"
          strokeWidth="1.2"
        />
      </svg>
      <canvas
        ref={canvas}
        width="400"
        height="330"
        className="network-canvas"
        data-testid="growth-network"
        aria-hidden="true"
      />
      {fallback && progress >= 20 && (
        <svg
          className="network-fallback"
          viewBox="0 0 400 330"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={`fallback-${id}`}>
              <path d={SUBSTRATE_PATH} />
            </clipPath>
          </defs>
          <g
            clipPath={`url(#fallback-${id})`}
            stroke="#f6efd9"
            fill="none"
            opacity={
              outcome === "failed"
                ? ".3"
                : outcome === "incomplete"
                  ? ".55"
                  : ".85"
            }
          >
            {Array.from(
              {
                length:
                  outcome === "failed" ? 5 : outcome === "incomplete" ? 13 : 28,
              },
              (_, i) => (
                <path
                  key={i}
                  d={`M200 170q${((i * 31) % 160) - 80} ${((i * 47) % 120) - 60} ${((i * 53) % 270) - 135} ${((i * 29) % 160) - 80}m-20 0l12-20m-5 6 20 3`}
                />
              ),
            )}
          </g>
        </svg>
      )}
      {fallback && (
        <span className="canvas-fallback-note">
          Static illustrative frame · Canvas unavailable
        </span>
      )}
    </div>
  );
}
