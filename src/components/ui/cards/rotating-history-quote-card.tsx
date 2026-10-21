"use client";

import { useEffect, useState } from "react";
import { ArrowTopRightOnSquareIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { wwiiQuotes } from "@/app/components/history/wwii-quotes";

export function RotatingHistoryQuoteCard() {
  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let disposed = false;
    const schedule = () => {
      timer = setTimeout(() => {
        if (disposed) return;
        setIndex((current) => (current + 1 + Math.floor(Math.random() * (wwiiQuotes.length - 1))) % wwiiQuotes.length);
        setTransition((current) => current + 1);
        schedule();
      }, 10_000 + Math.random() * 5_000);
    };
    schedule();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, []);

  const quote = wwiiQuotes[index];

  return (
    <article className="flex h-full min-h-40 flex-col overflow-hidden border border-white/20 bg-[#171a17]/95 shadow-lg shadow-black/40 backdrop-blur-md">
      <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
        <ChatBubbleLeftRightIcon className="size-4 text-[#c5d59a]" aria-hidden="true" />
        <p className="m-0 text-[9px] font-semibold uppercase tracking-[.18em] text-[#d2dfa9]">Dispatches from history</p>
        <span className="ml-auto text-[8px] uppercase tracking-[.14em] text-white/45">Sourced excerpts</span>
      </header>
      <div key={transition} className="quote-slide flex flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4" aria-live="polite" aria-atomic="true">
        <blockquote className="m-0 text-sm leading-relaxed text-[#f2f1e9] sm:text-base"><span aria-hidden="true">“</span>{quote.text}<span aria-hidden="true">”</span></blockquote>
        <footer className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 border-t border-white/10 pt-3">
          <div>
            <p className="m-0 text-[10px] font-semibold text-[#d2dfa9]">{quote.speaker}</p>
            <p className="m-0 mt-0.5 text-[9px] text-[#b8bcb2]">{quote.date} <span aria-hidden="true">·</span> {quote.place}</p>
          </div>
          <a className="inline-flex min-h-7 items-center gap-1 text-[9px] text-[#d2dfa9] underline decoration-white/25 underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8bc7a]" href={quote.sourceUrl} target="_blank" rel="noreferrer">
            {quote.sourceLabel}<ArrowTopRightOnSquareIcon className="size-3" aria-hidden="true" />
          </a>
        </footer>
      </div>
    </article>
  );
}
