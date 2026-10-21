"use client";

import { DepthParallaxScene } from "./parallax/depth-parallax-scene";
import { CarentanEventCard } from "@/components/ui/cards/carentan-event-card";
import { OperationCompassNewsCard } from "@/components/ui/cards/operation-compass-news-card";
import { RotatingHistoryQuoteCard } from "@/components/ui/cards/rotating-history-quote-card";

export function HomepageFeatureShowcase({ eventTime }: { eventTime: string }) {
  return <section className="relative w-full" aria-label="Brothers in Arms community highlights">
    <DepthParallaxScene />

    <div className="absolute left-1/2 top-[5%] z-20 flex w-[92%] -translate-x-1/2 items-center justify-center gap-3 sm:gap-5">
      <span className="h-px w-8 bg-[#c5d59a]/80 shadow-[0_0_10px_rgba(197,213,154,.5)] sm:w-16" aria-hidden="true" />
      <h1 className="bia-title m-0 text-center text-[clamp(21px,5.2vw,66px)] uppercase leading-none tracking-[.08em] text-[#f1f1e9] drop-shadow-[0_3px_18px_rgba(0,0,0,.85)]">Brothers in Arms</h1>
      <span className="h-px w-8 bg-[#c5d59a]/80 shadow-[0_0_10px_rgba(197,213,154,.5)] sm:w-16" aria-hidden="true" />
    </div>

    <div className="absolute left-1/2 top-[17%] z-20 flex w-[min(94vw,760px)] -translate-x-1/2 flex-col gap-2 sm:top-[19%] sm:gap-3">
      <CarentanEventCard eventTime={eventTime} />

      <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-3">
        <OperationCompassNewsCard />
        <RotatingHistoryQuoteCard />
      </div>
    </div>
  </section>;
}
