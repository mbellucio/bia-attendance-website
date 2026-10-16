"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

export function useAnimatedDialog(duration = 220) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof window.setTimeout> | undefined>(undefined);
  useBodyScrollLock(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current);
  }, []);

  const show = useCallback(() => {
    if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
    setClosing(false);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    if (!open || closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      dialogRef.current?.close();
      setOpen(false);
      setClosing(false);
      closeTimer.current = undefined;
    }, duration);
  }, [closing, duration, open]);

  return { dialogRef, open, closing, show, close };
}
