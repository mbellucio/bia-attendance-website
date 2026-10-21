import Link from "next/link";
export type BreadcrumbItem = { label: string; href?: string };
type BreadcrumbsProps = { items: BreadcrumbItem[]; className?: string };
export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return <nav className={"mb-5 flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[.13em] " + className} aria-label="Breadcrumb">{items.map((item, index) => <span key={item.label} className="contents">{index > 0 && <span className="text-[#65705d]" aria-hidden="true">/</span>}{item.href ? <Link className="text-[#aeb5a7] transition-colors hover:text-[#a8bc7a]" href={item.href}>{item.label}</Link> : <span className="text-[#a8bc7a]" aria-current="page">{item.label}</span>}</span>)}</nav>;
}
