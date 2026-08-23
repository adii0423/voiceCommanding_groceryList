import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Voice Grocery — Simple Voice Shopping List",
  description: "A clean, voice-first grocery assistant with smart seasonal recommendations and multilingual support.",
};

export const viewport: Viewport = {
  themeColor: "#0078d4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} font-sans bg-[#faf9f8] text-[#201f1e] min-h-screen antialiased selection:bg-[#0078d4]/20 selection:text-[#201f1e]`}
      >
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
