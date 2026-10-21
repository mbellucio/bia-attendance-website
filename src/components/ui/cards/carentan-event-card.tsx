"use client";

import Image from "next/image";
import { CalendarDaysIcon, MapPinIcon, UsersIcon } from "@heroicons/react/24/outline";

export function CarentanEventCard({ eventTime }: { eventTime: string }) {
  return (
    <article className="overflow-hidden border border-white/25 bg-[#171a17]/90 shadow-lg shadow-black/30 backdrop-blur-sm">
      <div className="relative h-32 overflow-hidden sm:h-56">
        <Image
          src="/images/cover&wounded_scene.png"
          alt="Covering fire and a wounded soldier during the Battle of Carentan"
          fill
          sizes="(max-width: 768px) 90vw, 740px"
          className="object-cover object-[center_58%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171a17]/90 via-black/5 to-transparent" aria-hidden="true" />
        <p className="absolute bottom-2 left-4 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.18em] text-[#d2dfa9]">
          <CalendarDaysIcon className="size-4" aria-hidden="true" /> Featured operation
        </p>
      </div>
      <div className="px-3 py-2 sm:px-5 sm:py-4">
        <h2 className="m-0 text-xl font-medium tracking-tight text-[#f2f1e9] sm:text-2xl">Battle of Carentan</h2>
        <p className="mt-1.5 flex items-center gap-2 text-xs text-[#c5c9bd]">
          <MapPinIcon className="size-4 shrink-0 text-[#a8bc7a]" aria-hidden="true" /> Normandy, France <span className="text-white/30">/</span> Arma 3
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#d2dfa9]">
          <span className="inline-flex items-center gap-1.5"><CalendarDaysIcon className="size-3.5" aria-hidden="true" />{eventTime}</span>
          <span className="inline-flex items-center gap-1.5"><UsersIcon className="size-3.5" aria-hidden="true" />Slots 67 / 82</span>
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.18em] text-[#a8bc7a]">Featured mission <span className="ml-1 text-[#a7aa9f]">· WW2 Co-op</span></p>
          <button type="button" aria-label="Join Battle of Carentan (placeholder)" className="inline-flex min-h-9 shrink-0 items-center justify-center border border-[#a8bc7a] bg-[#506846]/40 px-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[#f2f1e9] transition-colors hover:bg-[#506846]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8bc7a]">
            Join now
          </button>
        </div>
      </div>
    </article>
  );
}
