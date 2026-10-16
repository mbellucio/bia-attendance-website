import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteShell } from "@/components/layout/site-shell";

function Block({ className = "" }: { className?: string }) {
  return <span className={"block animate-pulse bg-white/[.09] " + className} aria-hidden="true" />;
}

export function PortalSkeleton() {
  return <SiteShell>
    <SiteHeader variant="auth" />
    <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center gap-8 py-12" role="status" aria-label="Loading sign-in page">
      <div className="space-y-5"><Block className="h-3 w-32" /><Block className="h-20 w-[min(620px,90%)] sm:h-24" /><Block className="h-4 w-[min(480px,85%)]" /><Block className="h-3 w-56" /></div>
      <div className="flex flex-wrap items-center gap-6 border-t border-white/15 pt-4"><Block className="h-[52px] w-[280px] bg-[#506846]/50" /><Block className="h-8 w-72" /></div>
    </div>
    <SiteFooter variant="auth" /><span className="sr-only">Loading roster portal…</span>
  </SiteShell>;
}

export function LoginPanelSkeleton() {
  return <section className="w-full border-t border-white/20 pt-4" role="status" aria-label="Loading sign-in options" aria-busy="true">
    <Block className="mb-4 h-3 w-28" /><div className="flex flex-wrap items-center gap-6"><Block className="h-[52px] w-full max-w-[280px] bg-[#506846]/50" /><Block className="h-8 w-full max-w-sm" /></div>
    <span className="sr-only">Loading Steam sign-in…</span>
  </section>;
}

export function DashboardSkeleton() {
  return <SiteShell>
    <SiteHeader variant="member"><div className="flex gap-4"><Block className="h-3 w-20" /><Block className="h-8 w-16" /></div></SiteHeader>
    <section className="-mx-[clamp(20px,6.25vw,104px)] border-b border-white/10 bg-[#202820] px-[clamp(20px,7.45vw,124px)] py-8" aria-hidden="true"><Block className="mb-4 h-3 w-48" /><Block className="h-16 w-72 max-w-full" /><Block className="mt-4 h-4 w-96 max-w-full" /><Block className="mt-5 h-8 w-44" /></section>
    <div className="flex flex-col gap-6 py-7" role="status" aria-label="Loading attendance calendar" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><Block className="mb-3 h-3 w-40" /><Block className="h-10 w-56" /></div><Block className="h-10 w-56" /></div>
      <div className="overflow-hidden border border-white/15 bg-[#1a1e1b]"><div className="flex justify-between border-b border-white/10 p-5"><Block className="h-8 w-44" /><Block className="h-4 w-64 max-w-[45%]" /></div><div className="grid grid-cols-7">{Array.from({ length: 35 }, (_, i) => <Block key={i} className="h-20 border-b border-r border-white/10 sm:h-24" />)}</div></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Block key={i} className="h-28 border-t-[3px] border-[#6a874f] bg-[#1c211d]" />)}</div>
      <span className="sr-only">Loading your attendance…</span>
    </div>
    <SiteFooter variant="member" />
  </SiteShell>;
}

export function EventSkeleton() {
  return <SiteShell>
    <SiteHeader variant="member"><Block className="h-3 w-32" /></SiteHeader>
    <div className="py-7" role="status" aria-label="Loading event details" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-7"><div className="space-y-3"><Block className="h-3 w-40" /><Block className="h-12 w-80 max-w-full" /><Block className="h-4 w-52" /></div><Block className="h-8 w-40" /></div>
      <div className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Block key={i} className="h-28 border-t-[3px] border-[#6a874f] bg-[#1c211d]" />)}</div>
      <section className="border border-white/15 bg-[#1a1e1b] p-5 sm:p-7"><Block className="mb-6 h-5 w-56" /><div className="space-y-4">{Array.from({ length: 3 }, (_, i) => <Block key={i} className="h-16 border-b border-white/10" />)}</div></section>
      <span className="sr-only">Loading event connection history…</span>
    </div>
    <SiteFooter variant="member" />
  </SiteShell>;
}
