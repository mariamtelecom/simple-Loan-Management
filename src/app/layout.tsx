import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ঋণ ও সঞ্চয় ব্যবস্থাপনা সমিতি | Loan & Savings Management",
  description: "Next.js Custom CSS Microfinance Loan Management System with Passbook Ledger & Supabase PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${inter.variable} ${notoBengali.variable}`}>
      <body className="bengali-font">
        {children}
      </body>
    </html>
  );
}
