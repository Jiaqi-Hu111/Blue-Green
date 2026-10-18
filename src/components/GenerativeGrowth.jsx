import { useRef, useEffect, useState, useId, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, Maximize2, RotateCcw } from "lucide-react";
import { MATERIALS, OUTCOMES } from "../simulation";
import {
  TrailNetwork,
  SUBSTRATE_PATH,
  growthTarget,
  hashSeed,
  visualQuality,
} from "../growthModel";
import { asset, Modal, Button } from "./Common";

const NetworkSurface = memo(function NetworkSurface({
  recipe,
  outcome,
  canvasRef,
  expanded = false,
  fallback,
  networkVisible,
}) {
  const id = useId().replaceAll(":", "");
  let offset = 68;
  return (
    <div
      className="generative-growth"
      role="img"
      aria-label={
        (OUTCOMES[outcome]?.label || outcome) +
        ": mycelium-inspired generative visualisation"
      }
    >
      <svg
        viewBox={expanded ? "45 60 312 225" : "0 0 400 330"}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={"substrate-" + id}>
            <path d={SUBSTRATE_PATH} />
          </clipPath>
          {MATERIALS.map((m, i) => (
            <pattern
              id={"material-" + id + m.id}
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
        />
        <g clipPath={"url(#substrate-" + id + ")"}>
          <path d={SUBSTRATE_PATH} fill="#364d40" />
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
                fill={"url(#material-" + id + m.id + ")"}
                opacity=".53"
              />
            );
          })}
        </g>
      </svg>
      <canvas
        ref={canvasRef}
        width={expanded ? 1000 : 800}
        height={expanded ? 721 : 660}
        className="network-canvas"
        data-testid={expanded ? "expanded-network" : "growth-network"}
        data-expanded={expanded}
        aria-hidden="true"
      />
      {fallback && networkVisible && (
        <svg
          className="network-fallback"
          viewBox={expanded ? "45 60 312 225" : "0 0 400 330"}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={"fallback-" + id}>
              <path d={SUBSTRATE_PATH} />
            </clipPath>
          </defs>
          <g
            clipPath={"url(#fallback-" + id + ")"}
            stroke="#f6efd9"
            strokeWidth=".8"
            fill="none"
            opacity={outcome === "failed" ? ".35" : ".75"}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                d={
                  "M45 " +
                  (75 + i * 18) +
                  "q35-22 70 0t70 0t70 0t70 0 M" +
                  (65 + i * 24) +
                  " 60q-20 28 0 56t0 56t0 56t0 56"
                }
              />
            ))}
          </g>
        </svg>
      )}
      <svg
        className="substrate-outline"
        viewBox={expanded ? "45 60 312 225" : "0 0 400 330"}
        aria-hidden="true"
      >
        <path
          d={SUBSTRATE_PATH}
          fill="none"
          stroke="#35413a"
          strokeWidth="1.2"
        />
      </svg>
      {fallback && (
        <span className="canvas-fallback-note">
          Static illustrative frame · Canvas unavailable
        </span>
      )}
    </div>
  );
});

export function GenerativeGrowth({
  recipe,
  outcome,
  progress,
  seedKey,
  playing,
  onPlay,
  onReplay,
  replayToken = 0,
}) {
  const canvas = useRef(null),
    expandedCanvas = useRef(null),
    wake = useRef(null);
  const current = useRef({ progress, playing });
  const previous = useRef({ progress, playing });
  current.current = { progress, playing };
  const [fallback, setFallback] = useState(false),
    [expanded, setExpanded] = useState(false);
  const closeObservation = useCallback(() => setExpanded(false), []);
  const [quality] = useState(() =>
    visualQuality({
      width: window.innerWidth,
      memory: navigator.deviceMemory || 8,
    }),
  );
  const engineQuality = useRef(null);
  const seed = hashSeed(seedKey),
    composition = JSON.stringify(recipe);
  useEffect(() => {
    let network, path, texture, ink, pixels, visibility;
    try {
      if (!canvas.current?.getContext("2d") || typeof Path2D === "undefined")
        throw Error("Canvas unavailable");
      path = new Path2D(SUBSTRATE_PATH);
      network = new TrailNetwork({ outcome, seed, ...quality });
      if (!engineQuality.current) {
        // Calibrate once before the first visible field. Retain the chosen tier
        // across Replay/Expand; never resize or replace an established network.
        const samples = [];
        for (let i = 0; i < 8; i++) {
          const start = performance.now();
          network.step();
          if (i >= 4) samples.push(performance.now() - start);
        }
        const median = samples.sort((a, b) => a - b)[2];
        // Predict each tier from measured per-cell cost. A large desktop probe
        // can step down to 384/320 without unnecessarily jumping to 256.
        engineQuality.current =
          [
            quality,
            { width: 384, height: 264 },
            { width: 320, height: 224 },
            { width: 256, height: 176 },
          ].find(
            (tier) =>
              tier.width <= quality.width &&
              (median * tier.width * tier.height) / (quality.width * quality.height) <= 5,
          ) || { width: 256, height: 176 };
      }
      network = new TrailNetwork({ outcome, seed, ...engineQuality.current });
      texture = document.createElement("canvas");
      texture.width = network.width;
      texture.height = network.height;
      ink = texture.getContext("2d");
      pixels = ink?.createImageData(network.width, network.height);
      if (!pixels) throw Error("Canvas unavailable");
      visibility = new Float32Array(network.field.length);
      for (let i = 0; i < visibility.length; i++) {
        visibility[i] = network.visibilityAt(i);
        // Colour/habitat are constant for a run. Only alpha changes per frame.
        pixels.data[i * 4] = outcome === "unverified" ? 231 : 249;
        pixels.data[i * 4 + 1] = outcome === "unverified" ? 237 : 242;
        pixels.data[i * 4 + 2] = outcome === "unverified" ? 210 : 218;
      }
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    let frame = 0,
      disposed = false,
      lastTime = 0,
      debt = 0,
      force = true,
      painted = -1;
    let coverage = 0;
    let recoveryTarget = growthTarget(current.current.progress);
    const metrics = {
      stepMs: [],
      frameMs: [],
      workMs: [],
      quality: engineQuality.current,
      agents: network.count,
    };
    const remember = (list, value) => {
      if (list.length >= 600) list.shift();
      list.push(value);
    };
    function paint(now) {
      frame = 0;
      if (disposed || document.hidden) {
        lastTime = 0;
        return;
      }
      const { progress, playing } = current.current;
      const started = performance.now();
      if (lastTime && playing) remember(metrics.frameMs, now - lastTime);
      if (playing && progress >= 20)
        debt = Math.min(
          12,
          debt + (lastTime ? Math.min(100, now - lastTime) : 16.67) * 0.09,
        );
      else debt = 0;
      lastTime = now;
      let steps = 0;
      while (
        progress >= 20 &&
        (network.iteration < recoveryTarget || debt >= 1) &&
        steps < 12
      ) {
        const before = performance.now();
        network.step();
        remember(metrics.stepMs, performance.now() - before);
        debt = Math.max(0, debt - 1);
        steps++;
        if (performance.now() - started > 7) break;
      }
      if (painted !== network.iteration || force) {
        const reveal = Math.min(1, Math.max(0, (progress - 20) / 8));
        let covered = 0;
        for (let i = 0; i < network.field.length; i++) {
          const at = i * 4,
            value = network.field[i];
          if (value * visibility[i] > 1.5) covered++;
          // Reject weak background deposits instead of brightening/thickening ink.
          pixels.data[at + 3] =
            Math.max(0, (value - 0.85) / (value + 4)) *
            245 *
            reveal *
            visibility[i];
        }
        ink.putImageData(pixels, 0, 0);
        painted = network.iteration;
        coverage = covered / network.field.length;
      }
      for (const node of [canvas.current, expandedCanvas.current]) {
        if (!node) continue;
        // The laboratory is obscured by the modal. Paint one visible surface;
        // closing it repaints the lab from this same field without stepping.
        if (
          node === (expandedCanvas.current || canvas.current) &&
          (steps || force)
        ) {
          if (force) {
            // Match the visible surface rather than rasterising a 1000px image
            // for a 310px dialog. Keep the simulation field independently fine.
            const bounds = node.getBoundingClientRect();
            const ratio = Math.min(2, window.devicePixelRatio || 1);
            const width = Math.max(1, Math.round(bounds.width * ratio));
            const height = Math.max(1, Math.round(bounds.height * ratio));
            if (node.width !== width || node.height !== height) {
              node.width = width;
              node.height = height;
            }
          }
          const context = node.getContext("2d");
          const detail = node.dataset.expanded === "true";
          context.setTransform(1, 0, 0, 1, 0, 0);
          context.clearRect(0, 0, node.width, node.height);
          const sx = node.width / (detail ? 312 : 400),
            sy = node.height / (detail ? 225 : 330);
          context.setTransform(
            sx,
            0,
            0,
            sy,
            detail ? -45 * sx : 0,
            detail ? -60 * sy : 0,
          );
          context.save();
          context.clip(path);
          context.drawImage(texture, 58, 66, 292, 213);
          context.restore();
        }
        node.dataset.iterations = String(network.iteration);
        node.dataset.coverage = String(coverage);
        node.dataset.seed = String(seed);
        node.dataset.stage =
          progress < 20
            ? "preparation"
            : progress < 45
              ? "early"
              : progress < 80
                ? "network"
                : "assessment";
        node.__bluegreenMetrics = metrics;
      }
      force = false;
      remember(metrics.workMs, performance.now() - started);
      if (playing || network.iteration < recoveryTarget)
        frame = requestAnimationFrame(paint);
    }
    function schedule({ reconstruct = false, resetClock = false } = {}) {
      cancelAnimationFrame(frame);
      if (resetClock || document.hidden) lastTime = 0;
      force = true;
      if (reconstruct)
        recoveryTarget = Math.max(
          recoveryTarget,
          growthTarget(current.current.progress),
        );
      if (!document.hidden) frame = requestAnimationFrame(paint);
    }
    wake.current = schedule;
    const onVisibility = () => schedule({ resetClock: true });
    document.addEventListener("visibilitychange", onVisibility);
    const resize = () => schedule();
    window.addEventListener("resize", resize);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      wake.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      texture.width = 0;
      texture.height = 0;
    };
  }, [seed, outcome, composition, quality, replayToken]);
  // React updates only control/stage state; simulation steps and painting stay outside React.
  useEffect(() => {
    wake.current?.({
      reconstruct:
        progress >= 100 && previous.current.progress < 100 && !playing,
      resetClock: previous.current.playing !== playing,
    });
    previous.current = { progress, playing };
  }, [progress, playing]);
  useEffect(() => {
    wake.current?.();
  }, [expanded]);
  return (
    <div className="generative-observation">
      <NetworkSurface
        recipe={recipe}
        outcome={outcome}
        canvasRef={canvas}
        fallback={fallback}
        networkVisible={progress >= 20}
      />
      <button
        className="text-link expand-network"
        onClick={() => setExpanded(true)}
      >
        <Maximize2 size={14} />
        Expand Network
      </button>
      {expanded &&
        createPortal(
          <Modal
            title="Network Observation"
            onClose={closeObservation}
            className="network-observer"
          >
            <p className="observation-note">
              The same active network, seen closer. Physarum-inspired artwork;
              not measured fungal growth.
            </p>
            <div className="observation-surface">
              <NetworkSurface
                recipe={recipe}
                outcome={outcome}
                canvasRef={expandedCanvas}
                expanded
                fallback={fallback}
                networkVisible={progress >= 20}
              />
            </div>
            <div className="observation-controls">
              <Button secondary onClick={onPlay}>
                {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
                {playing ? "Pause" : "Play"}
              </Button>
              <Button secondary onClick={onReplay}>
                <RotateCcw size={16} />
                Replay
              </Button>
            </div>
            <Button onClick={closeObservation}>Return to Laboratory</Button>
          </Modal>,
          document.body,
        )}
    </div>
  );
}
