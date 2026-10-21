import Link from "next/link";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/actions/button";
import { NavigationLink } from "@/components/ui/navigation/navigation-link";

type MemberNavigationProps = { active: "dashboard" | "attendance" | "admin"; isAdmin?: boolean };

export function MemberNavigation({ active, isAdmin = false }: MemberNavigationProps) {
  return <nav className="flex items-center gap-3 sm:gap-5 md:gap-8" aria-label="Member navigation">
    <NavigationLink href="/player-dashboard" active={active === "dashboard"}>MY DASHBOARD</NavigationLink>
    <NavigationLink href="/attendance" active={active === "attendance"}>ATTENDANCE</NavigationLink>
    {isAdmin && <NavigationLink href="/admin-panel" active={active === "admin"}>ADMIN PANEL</NavigationLink>}
    <form action={signOut}><Button variant="signOut" className="min-h-9 px-2 py-2 text-[8px] sm:px-3 sm:text-[9px]" type="submit">SIGN OUT</Button></form>
  </nav>;
}
