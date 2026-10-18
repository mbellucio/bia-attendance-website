import type { Metadata } from "next";
import { Roboto_Slab } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { Notifications } from "@/components/providers/notifications";

const fieldSerif = Roboto_Slab({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-field-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BIA Attendance | Field Roster",
  description: "Review your BIA event attendance and connection records.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fieldSerif.variable}>
      <body>{children}<Notifications /></body>
    </html>
  );
}
