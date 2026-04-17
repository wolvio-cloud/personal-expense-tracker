import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Finance Control",
  description: "Personal cash flow tracking",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finance Control",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F4E78",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-nav">
          {children}
        </main>
        <BottomNav />
        <PWARegister />
      </body>
    </html>
  );
}
