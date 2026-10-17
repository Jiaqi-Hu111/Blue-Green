import { useRef, useState, useEffect, useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Plus, Minus, Info, Check, Move, RotateCw, Leaf } from "lucide-react";
import { MATERIALS } from "../simulation";
import { asset, Button } from "./Common";
import { CoastalWindow, BotanicalSprig } from "./Illustrations";
export function LaboratoryScene({ children, variant = "", className = "" }) {
  return (
    <div className={`laboratory-scene ${variant} ${className}`}>
      <CoastalWindow className="scene-window" />
      <div className="scene-architecture" aria-hidden="true">
        <BotanicalSprig className="edge-sprig" />
        <div className="wooden-worktop" />
      </div>
      {children}
    </div>
  );
}
export function MaterialTexture({ material, className = "", style = {} }) {
  return (
    <span
      className={`material-texture ${className}`}
      style={{
        backgroundImage: `url(${asset("images/illustrated-materials.png")})`,
        backgroundPosition: material.position,
        ...style,
      }}
    />
  );
}
export function IngredientJar({
  material,
  onAdd,
  onInfo,
  vesselRef,
  onDrag,
  onMiss,
  explore = false,
}) {
  const gesture = useRef(null);
  const [active, setActive] = useState(false);
  function down(e) {
    if (explore) return;
    if (e.button !== 0) return;
    gesture.current = { x: e.clientX, y: e.clientY, dragged: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(true);
  }
  function move(e) {
    if (!gesture.current) return;
    const g = gesture.current;
    if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8) g.dragged = true;
    if (g.dragged) {
      const r = vesselRef.current?.getBoundingClientRect();
      onDrag?.({
        id: material.id,
        x: e.clientX,
        y: e.clientY,
        over:
          !!r &&
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom,
      });
    }
  }
  function up(e) {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    setActive(false);
    onDrag?.(null);
    if (!g.dragged) {
      onAdd(material.id);
      return;
    }
    const r = vesselRef.current?.getBoundingClientRect();
    if (
      r &&
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom
    )
      onAdd(material.id);
    else onMiss?.();
  }
  return (
    <div className={`ingredient-jar ${active ? "picked" : ""}`}>
      <button
        className={`jar-grab ${explore ? "explore-jar" : ""}`}
        aria-label={
          explore ? `Learn about ${material.name}` : `Add ${material.name}`
        }
        aria-describedby={!explore ? "jar-instructions" : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          gesture.current = null;
          setActive(false);
          onDrag?.(null);
        }}
        onClick={(e) => {
          if (explore) onInfo(material);
          else if (e.detail === 0) onAdd(material.id);
        }}
      >
        <div className="jar-lid" />
        <div className="jar-glass">
          <MaterialTexture material={material} />
          <span className="jar-shine" />
          <div className="jar-sticker">
            <Leaf size={12} />
            <span>{material.name}</span>
          </div>
        </div>
        <span className="jar-caption">
          {explore ? "DISCOVER" : "ADD TO RECIPE"}
        </span>
      </button>
      {!explore && (
        <button
          className="jar-info"
          aria-label={`About ${material.name}`}
          onClick={() => onInfo(material)}
        >
          <Info size={14} />
        </button>
      )}
    </div>
  );
}
export function IngredientTray({ portions, recipe, onEdit }) {
  return (
    <div className="ingredient-tray">
      <div className="tray-heading">
        <span className="eyebrow">YOUR RECIPE</span>
        <span className="total-percent">
          {Object.keys(recipe).length ? "100%" : "EMPTY VESSEL"}
        </span>
      </div>
      {!Object.keys(recipe).length ? (
        <div className="tray-empty">
          <p>Your vessel is empty.</p>
          <p>Drag an ingredient into the vessel to begin.</p>
        </div>
      ) : (
        <>
          <div className="tray-portions">
            {MATERIALS.filter((m) => Object.hasOwn(portions, m.id)).map((m) => (
              <div className="portion-row" key={m.id}>
                <MaterialTexture material={m} className="portion-thumbnail" />
                <div className="portion-name">
                  <strong>{m.name}</strong>
                </div>
                <span className="portion-percentage">{recipe[m.id] || 0}%</span>
              </div>
            ))}
          </div>
          <p className="fine-print">
            {Object.values(recipe).filter((n) => n > 0).length >= 2
              ? "Ready to Mix"
              : "Choose at least two ingredients with positive shares."}
          </p>
          <Button secondary onClick={onEdit}>
            Edit Recipe
          </Button>
        </>
      )}
    </div>
  );
}
export function MixingVessel({
  vesselRef,
  recipe,
  mixing,
  progress,
  onStir,
  over = false,
  dropKey = 0,
  portionCount = 0,
  autoMixing = false,
}) {
  const gesture = useRef(null),
    [swirl, setSwirl] = useState(0);
  const id = useId().replaceAll(":", "");
  const hasIngredients = Object.keys(recipe).length > 0;
  function pointerAngle(e) {
    const r = e.currentTarget.getBoundingClientRect(),
      x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height * 0.52;
    return { angle: Math.atan2(y, x), radius: Math.hypot(x, y) };
  }
  function down(e) {
    if (!mixing || progress >= 1) return;
    const p = pointerAngle(e);
    gesture.current = { ...p, travel: 0, max: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!gesture.current) return;
    const p = pointerAngle(e),
      last = gesture.current;
    let delta = p.angle - last.angle;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    gesture.current = { ...p, travel: last.travel, max: last.max };
    if (p.radius < 25 || last.radius < 25 || Math.abs(delta) > 0.9) return;
    const travel = last.travel + delta;
    const maximum = Math.max(last.max, Math.abs(travel));
    gesture.current = { ...p, travel, max: maximum };
    setSwirl((s) => s + (delta * 180) / Math.PI);
    if (maximum > last.max) onStir(maximum - last.max);
  }
  return (
    <div
      className={`vessel-zone ${over ? "drop-active" : ""} ${mixing && progress < 1 ? "stirring" : ""} ${progress >= 1 ? "blended" : ""}`}
      ref={vesselRef}
      data-testid="mixing-vessel"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => (gesture.current = null)}
      onPointerCancel={() => (gesture.current = null)}
    >
      <div className="vessel-halo" />
      {mixing && progress < 1 && (
        <svg className="swirl-lines" viewBox="0 0 340 300" aria-hidden="true">
          <path
            d="M71 132q-28-21 10-31m-10 2 10-2-4 11M272 135q28-19-8-32m10 5-10-5 0 10"
            fill="none"
            stroke="#548e87"
            strokeWidth="1.6"
            strokeDasharray="4 4"
          />
        </svg>
      )}
      <svg className="vessel-glass" viewBox="0 0 340 300" aria-hidden="true">
        <defs>
          <linearGradient id={`glass-${id}`} x1="0" x2="1">
            <stop stopColor="#b3d9c6" stopOpacity=".2" />
            <stop offset=".4" stopColor="#daf1e4" stopOpacity=".02" />
            <stop offset="1" stopColor="#ccf4dc" stopOpacity=".25" />
          </linearGradient>
        </defs>
        <ellipse
          cx="170"
          cy="55"
          rx="129"
          ry="35"
          fill="#b4d4cd"
          fillOpacity=".16"
          stroke="#35413a"
          strokeOpacity=".85"
          strokeWidth="2"
        />
        <path
          d="M41 55C34 97 42 238 105 256Q170 280 235 256C298 238 306 97 299 55Q170 119 41 55"
          fill={`url(#glass-${id})`}
          stroke="#35413a"
          strokeOpacity=".85"
          strokeWidth="1.3"
        />
        <path
          d="M62 86Q55 190 97 235M274 89Q287 160 260 218"
          fill="none"
          stroke="#f6fff5"
          strokeOpacity=".3"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <ellipse
          cx="170"
          cy="258"
          rx="66"
          ry="9"
          fill="#acc6a5"
          fillOpacity=".12"
        />
        <path
          d="M89 262Q170 249 251 262L251 285Q170 300 89 285Z"
          fill="#b88b61"
          stroke="#35413a"
          strokeWidth="1.6"
        />
        {Array.from({ length: 20 }, (_, i) => (
          <path
            key={i}
            d={`M${94 + i * 8} 264l${i % 2 ? 2 : -1} 19`}
            stroke="#705a41"
            strokeWidth=".8"
            opacity=".6"
          />
        ))}
        <ellipse cx="170" cy="286" rx="81" ry="8" fill="#a77c62" />
        <ellipse
          cx="170"
          cy="55"
          rx="129"
          ry="35"
          fill="none"
          stroke="#548e87"
          strokeOpacity={mixing ? ".85" : ".2"}
          strokeWidth={mixing ? "4" : "1"}
          strokeDasharray={`${progress * 560} 560`}
          transform="rotate(180 170 55)"
        />
      </svg>
      {hasIngredients && (
        <div
          className="vessel-materials"
          style={{
            height: portionCount
              ? `${Math.min(135, 40 + portionCount * 13)}px`
              : undefined,
            transform: `rotate(${mixing ? (autoMixing ? progress * 720 : swirl) : 0}deg)`,
          }}
        >
          <div
            className={`blend-surface ${progress >= 1 ? "complete" : ""}`}
            style={{ background: progress >= 1 ? "#9d8763" : undefined }}
          >
            {MATERIALS.filter((m) => (recipe[m.id] || 0) > 0).map((m) => (
              <MaterialTexture
                key={m.id}
                material={m}
                className="vessel-layer"
                style={{ flex: recipe[m.id] || 0.01 }}
              />
            ))}
          </div>
          {Array.from({ length: 28 }, (_, i) => {
            let cumulative = 0;
            const q = ((i + 0.5) / 28) * 100;
            const m =
              MATERIALS.find((m) => {
                cumulative += recipe[m.id] || 0;
                return cumulative >= q;
              }) || MATERIALS[0];
            return (
              <i
                key={i}
                className="substrate-speck"
                style={{
                  background: m.tone,
                  left: `${12 + ((i * 29) % 76)}%`,
                  top: `${15 + ((i * 17) % 70)}%`,
                  transform: `rotate(${i * 19}deg)`,
                }}
              />
            );
          })}
        </div>
      )}
      {hasIngredients && dropKey > 0 && (
        <div className="falling-portions" key={dropKey} aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${30 + i * 5}%`,
                animationDelay: `${i * 0.025}s`,
              }}
            />
          ))}
        </div>
      )}
      {mixing && progress < 1 && (
        <div
          className="stirring-spoon"
          style={{
            transform: `translateX(-50%) rotate(${autoMixing ? Math.sin(progress * 12) * 18 : swirl / 3}deg)`,
          }}
          aria-hidden="true"
        />
      )}
      <span className="vessel-label">
        {over
          ? "RELEASE TO ADD"
          : progress >= 1
            ? "SUBSTRATE / BLENDED"
            : mixing
              ? `${Math.round(progress * 100)}% BLENDED`
              : hasIngredients
                ? "YOUR SUBSTRATE"
                : "DROP A PORTION HERE"}
      </span>
    </div>
  );
}
export function StirringInteraction({
  mixing,
  progress,
  onBegin,
  onAuto,
  canMix,
  autoMixing,
}) {
  return (
    <div className="stirring-instructions">
      {progress >= 1 ? (
        <>
          <span className="blended-badge">
            <Check size={15} /> Beautifully blended!
          </span>
          <p>Your substrate is ready.</p>
        </>
      ) : mixing ? (
        <>
          <h3>Give it a swirl!</h3>
          <p>Draw two circles inside the vessel.</p>
          <Button secondary onClick={onAuto} disabled={autoMixing}>
            {autoMixing ? "Blending…" : "Auto Mix"}
            <RotateCw size={16} />
          </Button>
        </>
      ) : (
        <>
          <p>
            {canMix
              ? "Your ingredients are ready to meet."
              : "Collect at least two different materials."}
          </p>
          <Button onClick={onBegin} disabled={!canMix}>
            Mix Ingredients
            <RotateCw size={17} />
          </Button>
        </>
      )}
    </div>
  );
}
