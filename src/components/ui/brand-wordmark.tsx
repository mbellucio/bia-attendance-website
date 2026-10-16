import Image from "next/image";
import Link from "next/link";

type BrandWordmarkProps = { variant?: "auth" | "member" };

export function BrandWordmark({ variant: _variant = "member" }: BrandWordmarkProps) {
  return <Link href="/" className="inline-flex shrink-0 items-center gap-3 text-[#f2f1ea]" aria-label="BIA Attendance home">
    <Image src="/BIA-BW-clean-2048.png" alt="" width={1038} height={1038} sizes="(max-width: 639px) 52px, (max-width: 767px) 60px, 76px" className="size-[52px] shrink-0 object-contain invert sm:size-[60px] md:size-[76px]" unoptimized />
    <span className="text-[10px] font-bold tracking-[.16em] sm:text-[11px] md:text-xs">BIA ATTENDANCE</span>
  </Link>;
}