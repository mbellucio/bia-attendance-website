import type { ReactNode } from "react";
type PageHeadingProps = { eyebrow?: string; title: string; description?: string; className?: string; children?: ReactNode };
export function PageHeading({ eyebrow, title, description, className = "", children }: PageHeadingProps) {
  return <header className={"mb-6 " + className}>{eyebrow && <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.17em] text-[#a8bc7a]">{eyebrow}</p>}<div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="m-0 text-[clamp(30px,4vw,48px)] font-semibold leading-tight tracking-[-.055em] text-[#f4f2e9]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5a7]">{description}</p>}</div>{children}</div></header>;
}
