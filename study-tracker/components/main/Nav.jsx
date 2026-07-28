'use client'
export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[200] flex h-[60px] items-center justify-between border-b border-gray-200 bg-white/90 px-12 backdrop-blur-xl">
      <a
        href="/"
        className="flex items-center gap-2.5 font-serif text-lg text-gray-900 no-underline"
      >
        <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-gold shadow-[0_0_10px_#C9A84C]"></span>
        Basira
      </a>
      <div className="flex items-center gap-8">
        <a
          href="#portal"
          className="rounded-full bg-[#8B1A4A] px-5 py-2 text-xs font-medium text-white no-underline transition-opacity hover:opacity-80"
        >
          Get started
        </a>
      </div>
    </nav>
  );
}