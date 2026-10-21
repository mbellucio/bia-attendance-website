import Link from "next/link";
type NavigationLinkProps = { href: string; children: string; active?: boolean; className?: string };
export function NavigationLink({ href, children, active = false, className = "" }: NavigationLinkProps) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={"cursor-pointer text-center text-[8px] font-semibold tracking-[.1em] transition-colors hover:text-[#a8bc7a] sm:text-[9px] " + (active ? "text-[#a8bc7a]" : "text-[#d9dcd2]") + " " + className}>{children}</Link>;
}
