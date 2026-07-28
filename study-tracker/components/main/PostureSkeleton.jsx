"use client";

import { useEffect, useState } from "react";

// Focused pose: upright, both arms down
const FOCUSED = {
  h: { cx: 62, cy: 22 },
  su: { x1: 62, y1: 36, x2: 62, y2: 62 },
  sl: { x1: 62, y1: 62, x2: 62, y2: 102 },
  sh: { x1: 32, y1: 62, x2: 92, y2: 62 },
  lau: { x1: 32, y1: 62, x2: 20, y2: 88 },
  lal: { x1: 20, y1: 88, x2: 24, y2: 112 },
  rau: { x1: 92, y1: 62, x2: 104, y2: 88 },
  ral: { x1: 104, y1: 88, x2: 100, y2: 112 },
  hp: { x1: 44, y1: 102, x2: 80, y2: 102 },
  llu: { x1: 44, y1: 102, x2: 38, y2: 136 },
  lll: { x1: 38, y1: 136, x2: 34, y2: 156 },
  rlu: { x1: 80, y1: 102, x2: 86, y2: 136 },
  rll: { x1: 86, y1: 136, x2: 90, y2: 156 },
  dls: { cx: 32, cy: 62 },
  drs: { cx: 92, cy: 62 },
  dle: { cx: 20, cy: 88 },
  dre: { cx: 104, cy: 88 },
  dlw: { cx: 24, cy: 112 },
  drw: { cx: 100, cy: 112 },
  dlh: { cx: 44, cy: 102 },
  drh: { cx: 80, cy: 102 },
  dlk: { cx: 38, cy: 136 },
  drk: { cx: 86, cy: 136 },
  "gg-spine": { x1: 62, y1: 40, x2: 62, y2: 112 },
  "gg-la": { x1: 62, y1: 62, x2: 32, y2: 92 },
  "gg-ra": { x1: 62, y1: 62, x2: 92, y2: 92 },
};

const DISTRACTED = {
  h: { cx: 68, cy: 26 },
  su: { x1: 62, y1: 38, x2: 63, y2: 63 },
  sl: { x1: 63, y1: 63, x2: 62, y2: 103 },
  sh: { x1: 34, y1: 64, x2: 93, y2: 59 },
  lau: { x1: 34, y1: 64, x2: 22, y2: 92 },
  lal: { x1: 22, y1: 92, x2: 26, y2: 116 },
  rau: { x1: 93, y1: 59, x2: 110, y2: 34 },
  ral: { x1: 110, y1: 34, x2: 114, y2: 14 },
  hp: { x1: 44, y1: 103, x2: 80, y2: 103 },
  llu: { x1: 44, y1: 103, x2: 38, y2: 137 },
  lll: { x1: 38, y1: 137, x2: 34, y2: 157 },
  rlu: { x1: 80, y1: 103, x2: 86, y2: 137 },
  rll: { x1: 86, y1: 137, x2: 90, y2: 157 },
  dls: { cx: 34, cy: 64 },
  drs: { cx: 93, cy: 59 },
  dle: { cx: 22, cy: 92 },
  dre: { cx: 110, cy: 34 },
  dlw: { cx: 26, cy: 116 },
  drw: { cx: 114, cy: 14 },
  dlh: { cx: 44, cy: 103 },
  drh: { cx: 80, cy: 103 },
  dlk: { cx: 38, cy: 137 },
  drk: { cx: 86, cy: 137 },
  "gg-spine": { x1: 63, y1: 42, x2: 62, y2: 112 },
  "gg-la": { x1: 62, y1: 64, x2: 22, y2: 92 },
  "gg-ra": { x1: 62, y1: 59, x2: 110, y2: 34 },
};

const ACTIVE_COLOR = "#8A1538";
const DIM_COLOR = "rgba(0,0,0,0.18)";

const jointClass =
  "transition-all duration-[950ms] ease-[cubic-bezier(0.4,0,0.2,1)]";

export default function PostureSkeleton() {
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setFocused((f) => !f), 3400);
    return () => clearInterval(id);
  }, []);

  const pose = focused ? FOCUSED : DISTRACTED;
  const color = focused ? ACTIVE_COLOR : DIM_COLOR;

  return (
    <div className="relative mb-11 opacity-0 [animation-delay:440ms] animate-fadeUp">
      <div
        className={`absolute -top-[18px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.08em] transition-all duration-500 ${
          focused
            ? "border border-[rgba(138,21,56,0.45)] bg-[rgba(138,21,56,0.12)] text-[#8A1538]"
            : "border border-gray-200 bg-gray-100 text-gray-500"
        }`}
      >
        {focused ? "Focused" : "Distracted"}
      </div>
      <svg
        className="overflow-visible"
        width="124"
        height="162"
        viewBox="0 0 124 162"
        role="img"
        aria-label="Stick figure alternating between a focused posture and a distracted posture"
      >
        <line className={`fill-none stroke-[7px] opacity-[0.14] ${jointClass}`} style={{ stroke: color }} {...pose["gg-spine"]} />
        <line className={`fill-none stroke-[7px] opacity-[0.14] ${jointClass}`} style={{ stroke: color }} {...pose["gg-la"]} />
        <line className={`fill-none stroke-[7px] opacity-[0.14] ${jointClass}`} style={{ stroke: color }} {...pose["gg-ra"]} />

        <circle className={jointClass} style={{ fill: color }} r="14" {...pose.h} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.su} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.sl} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.sh} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.lau} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.lal} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.rau} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.ral} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.hp} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.llu} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.lll} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.rlu} />
        <line className={`fill-none stroke-2 ${jointClass}`} strokeLinecap="round" style={{ stroke: color }} {...pose.rll} />

        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.dls} />
        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.drs} />
        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.dle} />
        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.dre} />
        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.dlw} />
        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.drw} />
        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.dlh} />
        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.drh} />
        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.dlk} />
        <circle className={jointClass} style={{ fill: color }} r="3.5" {...pose.drk} />
      </svg>
    </div>
  );
}