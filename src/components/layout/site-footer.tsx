type SiteFooterProps = { variant?: "auth" | "member" };

function DiscordIcon() {
  return <svg viewBox="0 0 24 24" className="size-6 transition-colors group-hover:text-[#5865f2]" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M19.5 5.5c-1.3-.6-2.6-1-4-1.2l-.5 1a13 13 0 0 0-6 0l-.5-1a15 15 0 0 0-4 1.2C2 9.2 1.3 12.8 1.7 16.3a16 16 0 0 0 5 2.5l1.1-1.8c-.6-.2-1.2-.5-1.7-.8l.4-.3c3.3 1.5 6.9 1.5 10.1 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.8a16 16 0 0 0 5-2.5c.5-4.1-.8-7.7-3.9-10.8ZM8.7 14.2c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
  </svg>;
}

function YouTubeIcon() {
  return <svg viewBox="0 0 24 24" className="size-6 transition-colors group-hover:text-[#ff0033]" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M23.5 6.2a3.1 3.1 0 0 0-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5A3.1 3.1 0 0 0 .5 6.2 32 32 0 0 0 0 12s0 4 .5 5.8a3.1 3.1 0 0 0 2.2 2.2c1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5a3.1 3.1 0 0 0 2.2-2.2A32 32 0 0 0 24 12s0-4-.5-5.8Z" />
    <path fill="#121512" d="m9.6 15.5 6.2-3.5-6.2-3.5v7Z" />
  </svg>;
}

export function SiteFooter({ variant = "member" }: SiteFooterProps) {
  return <footer data-variant={variant} className="mt-auto border-t border-white/15 py-5 text-[#9ba294]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="m-0 text-[10px] tracking-wide">© 2026 BIA. All rights reserved.</p>
      <nav className="flex items-center gap-4" aria-label="Brothers in Arms social links">
        <a className="group inline-flex min-h-10 items-center gap-2 text-xs transition-colors hover:text-[#5865f2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5865f2]" href="https://discord.gg/y6gTUpg69V" target="_blank" rel="noopener noreferrer" aria-label="Join Brothers in Arms on Discord">
          <DiscordIcon /><span className="transition-colors group-hover:text-[#5865f2]">Discord</span>
        </a>
        <a className="group inline-flex min-h-10 items-center gap-2 text-xs transition-colors hover:text-[#ff0033] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff0033]" href="https://www.youtube.com/@BrothersInArmsArmaCommunity" target="_blank" rel="noopener noreferrer" aria-label="Brothers in Arms on YouTube">
          <YouTubeIcon /><span className="transition-colors group-hover:text-[#ff0033]">YouTube</span>
        </a>
      </nav>
    </div>
  </footer>;
}