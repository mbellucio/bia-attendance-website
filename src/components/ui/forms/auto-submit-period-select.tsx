"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type PeriodGroup = {
  year: string;
  periods: { key: string; label: string }[];
};

type Props = { groups: PeriodGroup[]; activePeriod: string; disabled?: boolean };

export function AutoSubmitPeriodSelect({ groups, activePeriod, disabled = false }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const years = [...groups].sort((left, right) => Number(right.year) - Number(left.year));
  const selectedYear = activePeriod.slice(0, 4) || years[0]?.year || "";
  const months = [...(years.find(({ year }) => year === selectedYear)?.periods ?? [])]
    .sort((left, right) => right.key.localeCompare(left.key));
  const selectClass = "min-h-11 w-full border bg-[#202520] px-3 text-xs text-[#f1f0e9] outline-none transition "
    + (isPending ? "border-[#a8bc7a] opacity-60" : "border-white/25 focus:border-[#a8bc7a] focus:ring-2 focus:ring-[#a8bc7a]/30");
  const labelClass = "flex flex-col gap-2 text-[9px] font-semibold tracking-[.14em] text-[#afb4a8]";

  function changePeriod(period: string) {
    if (!period || period === activePeriod) return;
    const url = new URL(window.location.href);
    url.searchParams.set("period", period);
    startTransition(() => router.replace(url.pathname + url.search + url.hash, { scroll: false }));
  }

  function changeYear(year: string) {
    const periods = [...(years.find((group) => group.year === year)?.periods ?? [])]
      .sort((left, right) => right.key.localeCompare(left.key));
    const matchingMonth = periods.find(({ key }) => key.slice(5, 7) === activePeriod.slice(5, 7));
    changePeriod(matchingMonth?.key ?? periods[0]?.key ?? "");
  }

  return <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled || isPending} aria-busy={isPending}>
    <div className="grid grid-cols-[minmax(90px,1fr)_minmax(140px,1.5fr)] gap-3">
      <label htmlFor="period-year" className={labelClass}>YEAR
        <select id="period-year" name="year" className={selectClass} value={selectedYear} onChange={(event) => changeYear(event.currentTarget.value)}>
          {years.length ? years.map(({ year }) => <option key={year} value={year}>{year}</option>) : <option value="">No years</option>}
        </select>
      </label>
      <label htmlFor="period-month" className={labelClass}>MONTH
        <select id="period-month" name="month" className={selectClass} value={activePeriod} onChange={(event) => changePeriod(event.currentTarget.value)}>
          {months.length ? months.map(({ key, label }) => <option key={key} value={key}>{label}</option>) : <option value="">No months</option>}
        </select>
      </label>
    </div>
  </fieldset>;
}
