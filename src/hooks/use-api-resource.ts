"use client";

import { useCallback, useEffect, useState } from "react";
import { network } from "@/lib/api/client";

type Resource<T> = { key: string; data: T | null; error: Error | null };

export function useApiResource<T>(url: string) {
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState<Resource<T> | null>(null);
  const key = `${url}:${attempt}`;
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    network.get<T>(url, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setResource({ key, data, error: null });
      },
      (cause: unknown) => {
        if (!controller.signal.aborted) {
          const error = cause instanceof Error ? cause : new Error("Could not load this record.");
          setResource({ key, data: null, error });
        }
      },
    );
    return () => controller.abort();
  }, [url, key]);

  const current = resource?.key === key ? resource : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !current, retry };
}
