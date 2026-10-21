import Image from "next/image";
import { ArrowUpRightIcon, NewspaperIcon } from "@heroicons/react/24/outline";

export function OperationCompassNewsCard() {
  return (
    <article className="flex h-full w-full flex-col overflow-hidden border border-white/20 bg-[#171a17]/90 shadow-lg shadow-black/30 backdrop-blur-sm">
      <div className="relative h-16 overflow-hidden sm:h-24">
        <Image
          src="/images/sidbarani.PNG"
          alt="Soldiers advancing across the desert during the Battle of Sidi Barrani"
          fill
          sizes="(max-width: 639px) 94vw, 380px"
          className="object-cover object-[center_62%] grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171a17]/90 via-black/5 to-transparent" aria-hidden="true" />
        <p className="absolute bottom-2 left-3 flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[.16em] text-[#d2dfa9]">
          <NewspaperIcon className="size-3.5" aria-hidden="true" /> From the archives
        </p>
      </div>
      <div className="flex flex-1 flex-col px-3 py-2.5">
        <p className="m-0 text-[10px] font-medium tracking-[.12em] text-[#c5d59a]/75">1940—41</p>
        <h2 className="mt-1 line-clamp-2 text-sm font-medium leading-snug tracking-tight text-[#f2f1e9] sm:text-base">Operation Compass: The Battle of Sidi Barrani</h2>
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-[#c1c4b9]">The opening stages of the Western Desert campaign, revisited through the history behind the operation.</p>
        <a className="mt-auto inline-flex min-h-9 items-center justify-center gap-1.5 self-end border border-[#a8bc7a] bg-[#506846]/40 px-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[#f2f1e9] transition-colors hover:bg-[#506846]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8bc7a]" href="https://www.worldhistory.org/Operation_Compass/" target="_blank" rel="noreferrer">
          Read more <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

