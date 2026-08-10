import type { Metadata, Viewport } from "next";
import { Fraunces, Karla } from "next/font/google";
import { SavedArtistsProvider } from "@/components/SavedArtistsProvider";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { SITE } from "@/lib/config";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — Book Mehandi Artists Near You`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b1e3f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${karla.variable}`}>
        <SavedArtistsProvider>{children}</SavedArtistsProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
