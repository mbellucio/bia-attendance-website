"use client";

import { useEffect, type CSSProperties } from "react";
import { Slide, ToastContainer } from "react-toastify";
import { notificationDuration, restoreNotifications } from "@/lib/notifications";

const style = {
  "--toastify-color-dark": "#202520",
  "--toastify-text-color-dark": "#f3f1e8",
  "--toastify-font-family": "inherit",
} as CSSProperties;

export function Notifications() {
  useEffect(() => restoreNotifications(), []);
  return <ToastContainer
    position="bottom-right"
    autoClose={notificationDuration}
    pauseOnHover={false}
    pauseOnFocusLoss={false}
    closeOnClick
    theme="dark"
    transition={Slide}
    style={style}
    aria-label="Notifications"
  />;
}
