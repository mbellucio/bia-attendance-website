type SectionLabelProps = { children: string; className?: string };

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return <p className={`roster-eyebrow mb-3 text-[9px] font-medium uppercase tracking-[0.15em] text-[#aeb99c] ${className}`}>{children}</p>;
}
