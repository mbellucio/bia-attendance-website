import type { ReactNode } from "react";
import { SectionLabel } from "@/components/ui/section-label";

type EmptyStateProps = { label: string; title: string; children: ReactNode };

export function EmptyState({ label, title, children }: EmptyStateProps) {
  return <section className="empty-roster flex min-h-64 flex-col justify-center gap-3"><SectionLabel>{label}</SectionLabel><h2 className="m-0 text-2xl font-medium text-[#eff0e8]">{title}</h2><div className="max-w-lg text-xs leading-6 text-[#a8afa2]">{children}</div></section>;
}
