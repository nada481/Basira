"use client";
const ITEMS = [
  "No video stored",
  "All inference on-device",
  "Privacy-first AI",
];

export default function TrustBar() {
  return (
    <div className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-[rgba(240,235,232,0.07)] opacity-0 [animation-delay:720ms] animate-fadeUp md:max-w-[920px] md:flex-row md:rounded-t-none">
      {ITEMS.map((item) => (
        <div
          key={item}
          className="flex flex-1 items-center justify-center gap-1.5 border-b border-[rgba(240,235,232,0.07)] px-2.5 py-3 text-[11px] text-[rgba(240,235,232,0.42)] last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
        >
          <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[rgba(240,235,232,0.22)]"></span>
          {item}
        </div>
      ))}
    </div>
  );
}