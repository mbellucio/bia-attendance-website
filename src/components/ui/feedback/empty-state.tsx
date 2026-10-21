import type { ReactNode } from "react";
import { SectionLabel } from "@/components/ui/layout/section-label";

type EmptyStateProps = { label: string; title: string; children: ReactNode };

export function EmptyState({ label, title, children }: EmptyStateProps) {
  return <section className="flex min-h-64 flex-col justify-center gap-3 py-8 text-[#b4b9ad]">
    <SectionLabel>{label}</SectionLabel>
    <h2 className="m-0 text-2xl font-medium text-[#f3f1e8]">{title}</h2>
    <div className="max-w-lg text-xs leading-6 text-[#b4b9ad]">{children}</div>
  </section>;
}