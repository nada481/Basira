'use client'
import PostureSkeleton from "./PostureSkeleton";
import PortalCard from "./PortalCard";
import TrustBar from "./TrustBar";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-12 pt-20">
      <div className="pointer-events-none absolute -left-[120px] -top-[60px] h-[420px] w-[560px] animate-drift rounded-full bg-[rgba(138,21,56,0.15)] blur-[90px]"></div>
      <div className="pointer-events-none absolute -right-[100px] bottom-[60px] h-[360px] w-[440px] animate-driftSlow rounded-full bg-[rgba(201,168,76,0.12)] blur-[90px]"></div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[length:64px_64px]"></div>

      <div className="relative z-10 flex w-full max-w-[960px] flex-col items-center text-center">
        <div className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-gold opacity-0 [animation-delay:100ms] animate-fadeUp">
          AI-powered focus detection
        </div>

        <h1 className="mb-6 font-serif text-[clamp(42px,6.5vw,84px)] leading-none tracking-[-0.02em] text-gray-900 opacity-0 [animation-delay:200ms] animate-fadeUp">
          Know when focus
          <br />
          <span className="italic text-transparent [-webkit-text-stroke:1px_rgba(0,0,0,0.2)]">
            is{" "}
            <span className="text-maroon [-webkit-text-stroke:0px]">
              actually
            </span>{" "}
            happening.
          </span>
        </h1>

        <p className="mb-12 max-w-[460px] text-base font-light leading-[1.78] text-gray-600 opacity-0 [animation-delay:320ms] animate-fadeUp">
          Real-time posture detection. Zero video stored. Built for students,
          parents, and teachers.
        </p>

        <PostureSkeleton />

        <div
          id="portal"
          className="flex w-full max-w-[420px] flex-col gap-3 opacity-0 [animation-delay:580ms] animate-fadeUp md:max-w-[920px] md:flex-row md:gap-0"
        >
          <PortalCard
            variant="student"
            eyebrow="For students"
            title="Track your focus."
            cta="Start as Student"
            href="/child"
          />
          <PortalCard
            variant="parent"
            eyebrow="For parents"
            title="See real focus."
            cta="Start as Parent"
            href="/parent"
          />
          <PortalCard
            variant="teacher"
            eyebrow="For teachers"
            title="Monitor your class."
            cta="Start as Teacher"
            href="/teacher"
          />
        </div>

        
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 opacity-0 [animation-delay:1100ms] animate-fadeUp">
        
        <div className="h-7 w-px animate-spulse bg-gradient-to-b from-gray-400 to-transparent"></div>
      </div>
    </section>
  );
}