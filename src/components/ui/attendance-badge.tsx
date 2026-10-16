type AttendanceBadgeProps = { status: "granted" | "pending" | "denied" | "missed"; children: string; large?: boolean };

export function AttendanceBadge({ status, children, large = false }: AttendanceBadgeProps) {
  return <span className={`attendance-badge ${status}${large ? " large" : ""}`}>{children}</span>;
}
