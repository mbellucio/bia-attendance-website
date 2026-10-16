import type { ReactNode } from "react";
import { BrandWordmark } from "@/components/ui/brand-wordmark";

type SiteHeaderProps = { variant?: "auth" | "member"; children?: ReactNode; status?: string };

export function SiteHeader({ variant = "member", children, status = "STEAM SECURE SIGN IN" }: SiteHeaderProps) {
  const member = variant === "member";
  return <header className={`${member ? "roster-topbar" : "topbar"} flex min-h-[76px] items-center justify-between gap-5 border-b border-white/10`}>
    <BrandWordmark variant={variant} />
    {children ?? <div className="topbar-status flex items-center gap-2"><span className="status-dot" />{status}</div>}
  </header>;
}
