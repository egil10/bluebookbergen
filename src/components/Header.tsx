import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-8 h-8 rounded-md bg-bergen-700 text-white">
            <BookOpen size={16} strokeWidth={2} />
          </span>
          <span className="font-semibold tracking-tight text-ink">
            Blue Book <span className="text-bergen-600">Bergen</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-slate-600">
          <NavLink href="/locate">Locate</NavLink>
          <NavLink href="/name">Name</NavLink>
          <NavLink href="/route">Route</NavLink>
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
      className="px-3 py-1.5 rounded-md hover:bg-slate-100 hover:text-ink transition-colors"
    >
      {children}
    </Link>
  );
}
