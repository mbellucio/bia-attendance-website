import Image from "next/image";
import Link from "next/link";

type BrandWordmarkProps = { variant?: "auth" | "member" };

export function BrandWordmark({ variant = "member" }: BrandWordmarkProps) {
  return <Link href="/" className="wordmark inline-flex items-center gap-3" aria-label="BIA Attendance home">
    <Image src="/BIA-BW-clean-2048.png" alt="" width={1038} height={1038} sizes="48px" className="brand-logo" unoptimized />
    <span className="wordmark-text font-semibold tracking-[0.16em]">BIA <span>{variant === "member" ? "FIELD ROSTER" : "ATTENDANCE"}</span></span>
  </Link>;
}
