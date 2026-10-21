type AttendanceBadgeProps = { status: "granted" | "pending" | "denied" | "missed"; children: string; large?: boolean };

const styles = {
  granted: "border-[#a4c389]/50 bg-[#537c40]/20 text-[#d5e7c5]",
  pending: "border-[#dfbe66]/50 bg-[#ab852c]/20 text-[#f3d97f]",
  denied: "border-[#d3836d]/50 bg-[#934230]/20 text-[#edb1a0]",
  missed: "border-[#db9168]/50 bg-[#a5552b]/20 text-[#f2b48e]",
};

export function AttendanceBadge({ status, children, large = false }: AttendanceBadgeProps) {
  return <span className={"inline-flex w-fit items-center border px-2 py-1.5 text-[8px] font-semibold uppercase tracking-[.12em] " + styles[status] + (large ? " px-3 py-2 text-[9px]" : "")}>{children}</span>;
}