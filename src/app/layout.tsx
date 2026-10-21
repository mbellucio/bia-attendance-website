import type { Metadata } from "next";
import { Roboto_Slab, Stardos_Stencil } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { Notifications } from "@/components/providers/notifications";

const stardosStencil = Stardos_Stencil({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-bia-title",
  display: "swap",
});

const fieldSerif = Roboto_Slab({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-field-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brothers in Arms",
  description: "The home of the Brothers in Arms community.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fieldSerif.variable} ${stardosStencil.variable}`}>
      <body>{children}<Notifications /></body>
    </html>
  );
}
