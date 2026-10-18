"use client";

import { toast } from "react-toastify";

const storageKey = "bia:notifications:v1";
export const notificationDuration = 5000;
type Notification = { id: string; message: string; expiresAt: number };

function readNotifications(): Notification[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Notification => Boolean(item && typeof item === "object"
      && typeof item.id === "string" && typeof item.message === "string"
      && typeof item.expiresAt === "number" && item.expiresAt > Date.now()));
  } catch {
    return [];
  }
}

function saveNotifications(items: Notification[]) {
  try { sessionStorage.setItem(storageKey, JSON.stringify(items)); } catch { /* Storage may be unavailable. */ }
}

function display(notification: Notification) {
  const remaining = notification.expiresAt - Date.now();
  if (remaining <= 0 || toast.isActive(notification.id)) return;
  toast.error(notification.message, {
    toastId: notification.id,
    autoClose: remaining,
    onClose: () => saveNotifications(readNotifications().filter((item) => item.id !== notification.id)),
  });
}

export function notifyError(message: string) {
  if (typeof window === "undefined") return;
  const pending = readNotifications();
  const id = `error:${message}`;
  if (pending.some((item) => item.id === id)) return;
  const notification = { id, message, expiresAt: Date.now() + notificationDuration };
  saveNotifications([...pending, notification]);
  display(notification);
}

export function restoreNotifications() {
  const pending = readNotifications();
  saveNotifications(pending);
  pending.forEach(display);
}
