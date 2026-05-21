"use client";

import dynamic from "next/dynamic";
import type { BergenMapProps } from "./Map";

const Inner = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center text-slate-400 text-sm bg-bergen-50">
      Loading map…
    </div>
  ),
});

export default function BergenMap(props: BergenMapProps) {
  return <Inner {...props} />;
}
