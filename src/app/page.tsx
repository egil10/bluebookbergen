import Link from "next/link";
import {
  Crosshair,
  Type,
  Route as RouteIcon,
  ListOrdered,
  ArrowRight,
  MapPin,
  ListChecks,
  Compass,
} from "lucide-react";

const modes = [
  {
    href: "/locate",
    icon: Crosshair,
    title: "Locate the street",
    blurb:
      "We name a street, you click it on the map. We measure how close you got, in metres.",
  },
  {
    href: "/pin",
    icon: MapPin,
    title: "Pin the address",
    blurb:
      "An exact landmark — drop a pin on the spot. Scored on metres-from-truth, strict and unforgiving.",
  },
  {
    href: "/name",
    icon: Type,
    title: "Name the street",
    blurb:
      "A street lights up on the map. Type the name. Norwegian characters welcome, typos forgiven.",
  },
  {
    href: "/quiz",
    icon: ListChecks,
    title: "Multiple choice",
    blurb:
      "A street is highlighted. Pick its name from four options. Snackable and fast-paced.",
  },
  {
    href: "/route",
    icon: RouteIcon,
    title: "Plan the route",
    blurb:
      "Two random points in Bergen Sentrum — list the streets you would drive, in order.",
  },
  {
    href: "/explore",
    icon: Compass,
    title: "Explore the map",
    blurb:
      "Free-roam, toggle the street labels on and off, and learn the lay of the land.",
  },
  {
    href: "/streets",
    icon: ListOrdered,
    title: "Browse the streets",
    blurb:
      "Every street in our dataset, searchable. Click any to see it traced on the map.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl w-full px-5 py-12 flex-1">
      <section className="max-w-2xl">
        <p className="uppercase text-[11px] tracking-[0.18em] text-bergen-600 font-semibold">
          The Knowledge · Bergen edition
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-ink leading-[1.05]">
          Learn every street in Bergen.
        </h1>
        <p className="mt-5 text-slate-600 text-lg leading-relaxed">
          A practice ground inspired by the London cab drivers&apos; Knowledge.
          Over 3,200 streets pulled from OpenStreetMap, cross-checked against
          the kommune&apos;s 1,935-street gatetabell, and filterable by every
          one of the eight Bergen bydeler.
        </p>
        <div className="mt-7 flex gap-3 flex-wrap">
          <Link
            href="/locate"
            className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-bergen-700 transition-colors"
          >
            Start training
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium border border-slate-200 hover:border-slate-300 text-slate-700"
          >
            Explore the map
          </Link>
        </div>
      </section>

      <section className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-bergen-300 hover:shadow-soft transition-all flex gap-4"
          >
            <span className="grid place-items-center w-10 h-10 rounded-md bg-bergen-50 text-bergen-700 group-hover:bg-bergen-100">
              <m.icon size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-ink">{m.title}</h3>
                <ArrowRight
                  size={16}
                  className="text-slate-300 group-hover:text-bergen-600 transition-colors"
                />
              </div>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {m.blurb}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <footer className="mt-16 text-xs text-slate-400">
        Street data &copy; OpenStreetMap contributors, fetched via the Overpass API.
        Map tiles by CARTO. No tracking, no accounts, no scores leave your browser.
      </footer>
    </div>
  );
}
