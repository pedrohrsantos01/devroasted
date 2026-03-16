import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { AppProviders } from "@/app/providers";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  ),
  title: "devroast",
  description: "Paste your code. Get roasted.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  "use cache";

  cacheLife("max");

  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="h-full font-sans">
        <Suspense fallback={null}>
          <AppProviders>
            <div className="min-h-full">
              <SiteHeader />
              {children}
            </div>
          </AppProviders>
        </Suspense>
      </body>
    </html>
  );
}
