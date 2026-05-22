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
  Sparkles,
} from "lucide-react";

const modes = [
  {
    href: "/locate",
    icon: Crosshair,
    title: "Locate the street",
    blurb:
      "We name a street, you click where it is. Scored in metres-from-truth.",
  },
  {
    href: "/pin",
    icon: MapPin,
    title: "Pin the address",
    blurb:
      "An exact landmark. Drop a pin on the spot — strict, unforgiving.",
  },
  {
    href: "/name",
    icon: Type,
    title: "Name the street",
    blurb:
      "A street lights up. Type the name — typos forgiven, Norwegian welcome.",
  },
  {
    href: "/quiz",
    icon: ListChecks,
    title: "Multiple choice",
    blurb:
      "Street highlighted, four options. Snackable, fast-paced, auto-next.",
  },
  {
    href: "/route",
    icon: RouteIcon,
    title: "Plan the route",
    blurb:
      "A → B across town. List the streets you'd drive, against OSRM ground truth.",
  },
  {
    href: "/explore",
    icon: Compass,
    title: "Explore the map",
    blurb:
      "Free-roam. Switch basemaps, search the index, fly to any street.",
  },
  {
    href: "/streets",
    icon: ListOrdered,
    title: "Browse the streets",
    blurb:
      "Every street in our dataset, filterable by bydel, traced on the map.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl w-full px-5 py-10 md:py-14 flex-1 animate-fade-up">
      <section className="max-w-2xl">
        <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass shadow-sm text-[11px] uppercase tracking-[0.18em] text-bergen-700 font-medium">
          <Sparkles size={12} />
          The Knowledge · Bergen edition
        </p>
        <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight text-ink leading-[1.02]">
          Learn every street{" "}
          <span className="bg-gradient-to-r from-bergen-700 via-bergen-500 to-bergen-700 bg-clip-text text-transparent">
            in Bergen.
          </span>
        </h1>
        <p className="mt-5 text-slate-600 text-lg leading-relaxed">
          A practice ground inspired by the London cab drivers&apos; Knowledge.
          Over 3,200 streets pulled straight from OpenStreetMap,
          cross-checked against the kommune&apos;s 1,935-street register,
          filterable down to a single bydel.
        </p>
        <div className="mt-7 flex gap-3 flex-wrap">
          <Link
            href="/locate"
            className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-bergen-700 transition-all shadow-pill hover:shadow-soft"
          >
            Start training
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium glass shadow-sm hover:shadow-soft text-slate-700 transition-all"
          >
            Explore the map
          </Link>
        </div>
      </section>

      <section className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {modes.map((m, i) => (
          <Link
            key={m.href}
            href={m.href}
            style={{ animationDelay: `${i * 40}ms` }}
            className="group glass shadow-glass rounded-2xl p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all flex gap-4 animate-fade-up"
          >
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-bergen-50 to-white text-bergen-700 group-hover:from-bergen-100 group-hover:to-bergen-50 transition-colors shadow-sm">
              <m.icon size={18} strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-ink">{m.title}</h3>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-slate-300 group-hover:text-bergen-600 group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {m.blurb}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <footer className="mt-12 md:mt-16 text-xs text-slate-400">
        Street data &copy; OpenStreetMap contributors via Overpass · Bergen
        gatetabell from Bergen kommune · Map tiles by CARTO, OSM, Esri ·
        Routing by OSRM. No tracking, no accounts, no scores leave your
        browser.
      </footer>
    </div>
  );
}
