type SiteFooterProps = { variant?: "auth" | "member" };

export function SiteFooter({ variant = "member" }: SiteFooterProps) {
  const member = variant === "member";
  return <footer className="flex min-h-14 items-center justify-between gap-4 border-t border-white/15 py-3 text-[8px] uppercase tracking-[.14em] text-[#9ba294]">
    <span>BIA ATTENDANCE {member ? "/ PERSONNEL RECORD" : "PORTAL"}</span>
    <span>{member ? "AUTHORIZED MEMBER VIEW" : "YOUR ACCOUNT. YOUR ROSTER."}</span>
  </footer>;
}