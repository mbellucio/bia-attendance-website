import type { ButtonHTMLAttributes, ReactNode } from "react";
type ButtonVariant = "primary" | "secondary" | "ghost" | "signOut" | "danger";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; leadingIcon?: ReactNode; align?: "center" | "start" };
const variants: Record<ButtonVariant, string> = {
  primary: "border border-[#a8bc7a] bg-[#506846]/35 text-[#e2e8d5] hover:bg-[#506846]/60",
  secondary: "border border-white/15 text-[#e7e7dc] hover:bg-white/5",
  ghost: "border border-transparent text-[#aeb5a7] hover:bg-white/10 hover:text-white",
  signOut: "border border-white/35 bg-transparent text-[#f1f0e9] hover:border-[#a8bc7a] hover:bg-[#a8bc7a] hover:text-[#171914]",
  danger: "border border-[#e3a090]/60 bg-[#934230]/15 text-[#edb1a0] hover:bg-[#934230]/30",
};
export function Button({ variant = "secondary", leadingIcon, align = "center", className = "", children, ...props }: ButtonProps) {
  return <button {...props} className={"inline-flex min-h-10 cursor-pointer items-center " + (align === "start" ? "justify-start" : "justify-center") + " gap-2 px-4 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8bc7a] disabled:cursor-not-allowed disabled:opacity-50 " + variants[variant] + " " + className}>{leadingIcon}{children}</button>;
}
