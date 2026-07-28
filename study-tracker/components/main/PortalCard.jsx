const ACCENTS = {
  student: {
    border: "border-t-maroon",
    glow: "bg-[radial-gradient(ellipse_80%_70%_at_0%_110%,rgba(138,21,56,0.2)_0%,transparent_65%)]",
    eyebrow: "text-[rgba(220,80,100,0.85)]",
    pip: "bg-maroon shadow-[0_0_7px_#8A1538]",
    cta: "text-[rgba(220,80,100,0.85)]",
    arrowBg: "bg-maroon",
    arrowStroke: "#fff",
  },
  parent: {
    border: "border-t-gold",
    glow: "bg-[radial-gradient(ellipse_80%_70%_at_50%_110%,rgba(201,168,76,0.16)_0%,transparent_65%)]",
    eyebrow: "text-[rgba(201,168,76,0.85)]",
    pip: "bg-gold shadow-[0_0_7px_#C9A84C]",
    cta: "text-[rgba(201,168,76,0.85)]",
    arrowBg: "bg-gold",
    arrowStroke: "#1A0A10",
  },
  teacher: {
    border: "border-t-teal",
    glow: "bg-[radial-gradient(ellipse_80%_70%_at_100%_110%,rgba(76,140,125,0.22)_0%,transparent_65%)]",
    eyebrow: "text-[rgba(120,190,172,0.9)]",
    pip: "bg-teal shadow-[0_0_7px_#4C8C7D]",
    cta: "text-[rgba(120,190,172,0.9)]",
    arrowBg: "bg-teal",
    arrowStroke: "#0A1512",
  },
};

export default function PortalCard({ variant, eyebrow, title, cta, href }) {
  const a = ACCENTS[variant];

  return (
    <a
      href={href}
      className={`group relative flex flex-1 min-w-0 flex-col items-center overflow-hidden rounded-2xl border border-gray-200 border-t-2 p-8 text-center text-gray-900 no-underline transition-colors duration-300 hover:bg-gray-50 md:rounded-none md:first:rounded-l-2xl md:last:rounded-r-2xl md:[&+&]:border-l-0 ${a.border}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${a.glow}`}
      ></div>

      <div className={`mb-3.5 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] ${a.eyebrow}`}>
        <span className={`h-[5px] w-[5px] flex-shrink-0 rounded-full ${a.pip}`}></span>
        {eyebrow}
      </div>

      <h2 className="mb-6 flex-1 font-serif text-[clamp(19px,2.2vw,24px)] leading-[1.15]">
        {title}
      </h2>

      <span className={`relative inline-flex items-center gap-2.5 text-xs font-medium transition-all duration-200 group-hover:gap-3.5 ${a.cta}`}>
        {cta}
        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${a.arrowBg}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5h6M5.5 2.5L8 5l-2.5 2.5"
              stroke={a.arrowStroke}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </a>
  );
}