import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "Seen — find what's good, near you, in Accra",
    template: "%s · Seen",
  },
  description:
    "Seen is the local discovery and paid-visibility layer for Ghana's mobile-first cities. Find cafés, salons, clinics and repair shops in Osu and East Legon — verified, mapped and open now.",
  applicationName: "Seen",
  keywords: [
    "Ghana",
    "Accra",
    "Osu",
    "East Legon",
    "local business discovery",
    "GhanaPostGPS",
    "mobile money",
    "Seen",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0B2E4A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GH">
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
