import { useRef, useEffect, useState, useId, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, Maximize2, RotateCcw } from "lucide-react";
import { MATERIALS, OUTCOMES } from "../simulation";
import {
  ColonisationNetwork,
  SUBSTRATE_BOUNDS,
  GROWTH_DURATION_MS,
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
  const observed = useRef({ progress, at: 0 });
  if (observed.current.progress !== progress)
    observed.current = { progress, at: performance.now() };
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
  const seed = hashSeed(seedKey),
    composition = JSON.stringify(recipe);
  useEffect(() => {
    let network, path, texture, ink, pixels;
    try {
      if (!canvas.current?.getContext("2d") || typeof Path2D === "undefined")
        throw Error("Canvas unavailable");
      path = new Path2D(SUBSTRATE_PATH);
      network = new ColonisationNetwork({ outcome, seed, ...quality });
      texture = document.createElement("canvas");
      texture.width = network.width;
      texture.height = network.height;
      ink = texture.getContext("2d");
      pixels = ink?.createImageData(network.width, network.height);
      if (!pixels) throw Error("Canvas unavailable");
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    let frame = 0,
      disposed = false,
      lastTime = 0,
      force = true,
      painted = -1;
    let coverage = 0;
    let recoveryTarget = growthTarget(current.current.progress);
    const metrics = {
      stepMs: [],
      frameMs: [],
      workMs: [],
      quality,
      tips: 0,
      segments: 0,
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
      // Interpolate between the parent's 100ms progress updates. This advances
      // filament generation, never overlay opacity. Pause keeps the exact ink.
      const interpolation = playing && observed.current.at
        ? Math.min(100, now - observed.current.at) * 100 / GROWTH_DURATION_MS : 0;
      const target = playing
        ? Math.max(recoveryTarget, growthTarget(progress + interpolation))
        : recoveryTarget;
      lastTime = now;
      let steps = 0;
      while (network.iteration < target && steps < 16) {
        const before = performance.now();
        network.step();
        remember(metrics.stepMs, performance.now() - before);
        steps++;
        if (performance.now() - started > 7) break;
      }
      // A paused checkpoint/Skip is reconstructed in short slices but presented
      // atomically. Reduced-motion users never get an unsolicited fast replay.
      const recovering = !playing && network.iteration < recoveryTarget;
      let textureChanged = false;
      if (!recovering && (painted !== network.iteration || force)) {
        textureChanged = true;
        const changed = network.dirtyCount;
        for (let entry = 0; entry < changed; entry++) {
          const i = network.dirty[entry];
          network.dirtyFlags[i] = 0;
          const value = network.field[i], at = i * 4;
          // Early structural fibres stay above softer, slightly warmer infill.
          // This is alpha compositing of two accumulated filament layers.
          const spine = value ? network.backbone[i] / value : 0;
          pixels.data[at] = 236 + 18 * spine;
          pixels.data[at + 1] = 235 + 14 * spine;
          pixels.data[at + 2] = 215 + 16 * spine;
          pixels.data[at + 3] = value * 255;
        }
        // The retained RGBA image only needs changes for newly grown fibres.
        if (changed) ink.putImageData(pixels, 0, 0);
        network.dirtyCount = 0;
        painted = network.iteration;
        coverage = network.coverage();
        metrics.tips = network.tips.length;
        metrics.segments = network.segments;
      }
      for (const node of [canvas.current, expandedCanvas.current]) {
        if (!node) continue;
        // The laboratory is obscured by the modal. Paint one visible surface;
        // closing it repaints the lab from this same field without stepping.
        if (
          node === (expandedCanvas.current || canvas.current) &&
          (textureChanged || force)
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
          context.drawImage(texture, SUBSTRATE_BOUNDS.x, SUBSTRATE_BOUNDS.y,
            SUBSTRATE_BOUNDS.width, SUBSTRATE_BOUNDS.height);
          context.restore();
        }
        node.dataset.iterations = String(network.iteration);
        node.dataset.coverage = String(coverage);
        node.dataset.seed = String(seed);
        node.dataset.stage =
          progress < 15
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
      if ((playing && network.iteration < growthTarget(100)) || network.iteration < recoveryTarget)
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
    const onVisibility = () => {
      observed.current.at = performance.now();
      schedule({ resetClock: true });
    };
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
    if (previous.current.playing !== playing)
      observed.current.at = performance.now();
    wake.current?.({
      reconstruct: progress >= 100,
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
        networkVisible={progress > 0}
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
              The same accumulated filaments, seen closer. Stylised colonisation;
              not measured fungal growth.
            </p>
            <div className="observation-surface">
              <NetworkSurface
                recipe={recipe}
                outcome={outcome}
                canvasRef={expandedCanvas}
                expanded
                fallback={fallback}
                networkVisible={progress > 0}
              />
            </div>
            <div className="observation-controls">
              <Button secondary onClick={onPlay} disabled={progress >= 100}>
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
