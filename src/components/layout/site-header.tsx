import type { ReactNode } from "react";
import { BrandWordmark } from "@/components/ui/brand-wordmark";

type SiteHeaderProps = { variant?: "auth" | "member"; children?: ReactNode; status?: string };

export function SiteHeader({ variant = "member", children, status = "STEAM SECURE SIGN IN" }: SiteHeaderProps) {
  return <header className="relative z-10 -ml-[calc(50vw-50%)] flex w-screen min-h-[76px] items-center justify-between gap-4 border-b border-[#91a978]/40 bg-[#0d100e] px-[clamp(20px,6.25vw,104px)] sm:min-h-[84px] md:min-h-[104px]">
    <BrandWordmark variant={variant} />
    {children ?? <div className="flex items-center gap-2 text-[9px] font-semibold tracking-[.14em] text-[#d4d6ca]"><span className="size-1.5 rounded-full bg-[#a8bc7a] shadow-[0_0_12px_rgba(168,188,122,.35)]" />{status}</div>}
  </header>;
}
