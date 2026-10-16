import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIA Attendance | Field Roster",
  description: "Review your BIA event attendance and connection records.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
