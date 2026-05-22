import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="group shrink-0 flex items-baseline gap-1.5">
          <span className="font-serif italic text-[1.4rem] leading-none tracking-tight text-ink">
            Blue Book
          </span>
          <span className="font-serif italic text-[1.4rem] leading-none tracking-tight text-bergen-600 group-hover:text-bergen-700 transition-colors">
            Bergen
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 text-sm text-slate-600 overflow-x-auto no-scrollbar">
          <NavLink href="/locate">Locate</NavLink>
          <NavLink href="/pin">Pin</NavLink>
          <NavLink href="/name">Name</NavLink>
          <NavLink href="/quiz">Quiz</NavLink>
          <NavLink href="/route">Route</NavLink>
          <NavLink href="/explore">Explore</NavLink>
          <NavLink href="/streets">Streets</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2.5 py-1.5 rounded-md hover:bg-slate-100 hover:text-ink transition-colors whitespace-nowrap"
    >
      {children}
    </Link>
  );
}
