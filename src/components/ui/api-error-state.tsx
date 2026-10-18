"use client";

import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { endpoints } from "@/lib/api/endpoints";
import { AppError } from "@/lib/errors/catalog";

type Props = { error: Error; onRetry: () => void };

export function ApiErrorState({ error, onRetry }: Props) {
  const signedOut = error instanceof AppError && error.status === 401;
  return <SiteShell>
    <SiteHeader variant="member" />
    <section className="my-8 border border-white/15 bg-[#1a1e1b] p-6" role="alert">
      <h1 className="text-xl font-semibold text-[#f3f1e8]">{signedOut ? "Please sign in again" : "Could not load your record"}</h1>
      <p className="my-4 text-sm text-[#c4c8bd]">{error.message}</p>
      {signedOut ? <a className="text-sm underline" href={endpoints.auth.steam}>Sign in through Steam</a>
        : <button className="border border-[#a8bc7a] px-4 py-2 text-sm text-[#f3f1e8]" type="button" onClick={onRetry}>Try again</button>}
    </section>
    <SiteFooter variant="member" />
  </SiteShell>;
}
