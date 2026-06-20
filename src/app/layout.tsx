import "./globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import PWA from "@/components/PWA";

export const metadata: Metadata = {
  title: "Asmar Coffee — POS",
  description: "POS · Inventory · Analytics · Asmar AI Assistant",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Asmar POS" },
  icons: { icon: "/icons/favicon-32.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#15131c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="overscroll-none">
        <Providers>{children}</Providers>
        <PWA />
      </body>
    </html>
  );
}
