import type { ReactNode } from "react";

type SiteShellProps = { variant?: "auth" | "member"; children: ReactNode };

export function SiteShell({ variant = "member", children }: SiteShellProps) {
  return <main className={`${variant === "auth" ? "auth-shell" : "roster-shell"} min-h-svh w-full`}>{children}</main>;
}
