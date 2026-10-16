"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type PeriodGroup = {
  year: string;
  periods: { key: string; label: string }[];
};

type AutoSubmitPeriodSelectProps = {
  groups: PeriodGroup[];
  activePeriod: string;
  disabled?: boolean;
};

export function AutoSubmitPeriodSelect({ groups, activePeriod, disabled = false }: AutoSubmitPeriodSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changePeriod(period: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("period", period);
    startTransition(() => router.replace(url.pathname + url.search + url.hash, { scroll: false }));
  }

  return <select
    id="period"
    name="period"
    className={isPending ? "period-select is-pending" : "period-select"}
    value={activePeriod}
    disabled={disabled}
    onChange={(event) => changePeriod(event.currentTarget.value)}
    aria-label="Record period"
    aria-busy={isPending}
  >
    {groups.length ? groups.map(({ year, periods }) => <optgroup key={year} label={year}>
      {periods.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
    </optgroup>) : <option value="">No event records</option>}
  </select>;
}