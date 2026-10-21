"use client";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { InputHTMLAttributes } from "react";
type SearchBarProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string };
export function SearchBar({ label, className = "", ...props }: SearchBarProps) {
  return <label className={"relative block " + className}><span className="sr-only">{label}</span><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#90988b]" aria-hidden="true" /><input {...props} type="search" aria-label={label} className="min-h-11 w-full border border-white/10 bg-[#111512] py-2 pl-10 pr-3 text-sm text-[#f3f1e8] placeholder:text-[#788073] focus:border-[#a8bc7a]/70 focus:outline-none disabled:opacity-60" /></label>;
}
