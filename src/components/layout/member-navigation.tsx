import Link from "next/link";
import { signOut } from "@/app/actions";

type MemberNavigationProps = { active: "dashboard" | "attendance" };

const linkClass = "text-center text-[8px] font-semibold tracking-[.1em] transition-colors hover:text-[#a8bc7a] sm:text-[9px]";

export function MemberNavigation({ active }: MemberNavigationProps) {
  return <nav className="flex items-center gap-3 sm:gap-5 md:gap-8" aria-label="Member navigation">
    <Link className={linkClass + (active === "dashboard" ? " text-[#a8bc7a]" : " text-[#d9dcd2]")} href="/player-dashboard" aria-current={active === "dashboard" ? "page" : undefined}>MY DASHBOARD</Link>
    <Link className={linkClass + (active === "attendance" ? " text-[#a8bc7a]" : " text-[#d9dcd2]")} href="/attendance" aria-current={active === "attendance" ? "page" : undefined}>ATTENDANCE</Link>
    <form action={signOut}><button className="border border-white/35 bg-transparent px-2 py-2 text-[8px] font-semibold tracking-[.1em] text-[#f1f0e9] transition-colors hover:border-[#a8bc7a] hover:bg-[#a8bc7a] hover:text-[#171914] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8bc7a] sm:px-3 sm:text-[9px]" type="submit">SIGN OUT</button></form>
  </nav>;
}