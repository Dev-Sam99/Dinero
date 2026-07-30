import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "../components/ToastProvider";
import OfflineBanner from "../components/OfflineBanner";

export const metadata: Metadata = {
  title: "Dinero | Personal Expense Tracker",
  description: "Personal expense tracker passbook ledger PWA",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#10202b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#10202b] text-[#f2ece0] antialiased selection:bg-[#b8912f] selection:text-white">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
        <ToastProvider>
          <OfflineBanner />
          <main className="max-w-4xl lg:max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
