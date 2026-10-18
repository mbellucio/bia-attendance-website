"use client";

import { useEffect } from "react";
import { notifyError } from "@/lib/notifications";

export function ErrorNotification({ message }: { message: string }) {
  useEffect(() => { notifyError(message); }, [message]);
  return null;
}
