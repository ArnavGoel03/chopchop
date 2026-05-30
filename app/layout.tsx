import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://chop.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CHOP. — Kitchen tools made for the way you cook",
    template: "%s · CHOP.",
  },
  description:
    "The 5-blade chopper and a curated kitchen range. Pull, chop, done — prep in seconds.",
  openGraph: { type: "website", siteName: "CHOP." },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#FBF1E1",
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
