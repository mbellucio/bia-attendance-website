type SectionLabelProps = { children: string; className?: string };

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return <p className={"mb-3 text-[9px] font-semibold uppercase tracking-[.16em] text-[#b6c781] " + className}>{children}</p>;
}