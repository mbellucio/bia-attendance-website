type StatCardProps = { label: string; value: string | number; className?: string };

export function StatCard({ label, value, className = "" }: StatCardProps) {
  return <article className={"flex min-h-[112px] flex-col justify-between border-t-[3px] border-[#6a874f] bg-[#1c211d] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,.16)] sm:px-5 " + className}>
    <span className="text-[9px] font-semibold tracking-[.13em] text-[#b7bcb0]">{label}</span>
    <strong className="text-3xl font-semibold leading-none text-[#a8bc7a]">{value}</strong>
  </article>;
}