import type { Metadata } from "next";
import { Bodoni_Moda, Manrope, Source_Serif_4 } from "next/font/google";

import "./globals.css";

const displayFont = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const bodyFont = Source_Serif_4({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const sansFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Chá de Casa Nova — Vitória & Felipe",
    template: "%s | Vitória & Felipe",
  },
  description: "Convite digital para celebrar o novo lar de Vitória e Felipe.",
  applicationName: "Chá de Casa Nova — Vitória & Felipe",
  referrer: "strict-origin-when-cross-origin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${displayFont.variable} ${bodyFont.variable} ${sansFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
