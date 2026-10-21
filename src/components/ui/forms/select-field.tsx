import type { SelectHTMLAttributes } from "react";
export type SelectOption = { value: string; label: string };
type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & { label: string; options: SelectOption[] };
export function SelectField({ label, options, className = "", ...props }: SelectFieldProps) {
  return <label className={"block " + className}><span className="sr-only">{label}</span><select {...props} aria-label={label} className="min-h-11 w-full cursor-pointer border border-white/10 bg-[#111512] px-3 text-sm text-[#e7e7dc] focus:border-[#a8bc7a]/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
