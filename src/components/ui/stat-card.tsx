type StatCardProps = { label: string; value: string | number; className?: string };

export function StatCard({ label, value, className = "" }: StatCardProps) {
  return <article className={`flex min-h-[100px] flex-col justify-between bg-[#191e18] px-5 py-4 ${className}`}><span>{label}</span><strong>{value}</strong></article>;
}
