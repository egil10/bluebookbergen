"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/quiz", label: "Quiz" },
  { href: "/locate", label: "Locate" },
  { href: "/pin", label: "Pin" },
  { href: "/name", label: "Name" },
  { href: "/route", label: "Route" },
  { href: "/explore", label: "Explore" },
  { href: "/streets", label: "Streets" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <div className="shrink-0 px-3 pt-3 md:pt-4 z-30">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-1.5 px-4 py-2 rounded-full glass shadow-pill hover:shadow-soft transition-all"
        >
          <span className="font-serif italic text-[1.15rem] leading-none tracking-tight text-ink">
            Blue Book
          </span>
          <span className="font-serif italic text-[1.15rem] leading-none tracking-tight text-bergen-600 group-hover:text-bergen-700 transition-colors">
            Bergen
          </span>
        </Link>
        <nav className="glass shadow-pill rounded-full p-1 flex items-center gap-0.5 text-sm overflow-x-auto no-scrollbar">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "px-3 py-1.5 rounded-full whitespace-nowrap transition-colors " +
                  (active
                    ? "bg-ink text-white shadow-sm"
                    : "text-slate-600 hover:text-ink hover:bg-white/60")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
