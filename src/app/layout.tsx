import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/app/providers";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "devroast",
  description: "Paste your code. Get roasted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="h-full font-sans">
        <AppProviders>
          <div className="min-h-full">
            <SiteHeader />
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
