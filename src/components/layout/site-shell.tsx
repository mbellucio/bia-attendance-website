import type { ReactNode } from "react";

type SiteShellProps = { variant?: "auth" | "member"; children: ReactNode };

export function SiteShell({ children }: SiteShellProps) {
  return <main className="relative mx-auto flex min-h-svh w-full max-w-[1600px] flex-col overflow-visible bg-[#121512] bg-[radial-gradient(ellipse_at_50%_-5%,rgba(102,121,79,.19),transparent_52%)] px-[clamp(20px,6.25vw,104px)] text-[#f2f1e9]">
    {children}
  </main>;
}