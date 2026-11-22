import type { Metadata, Viewport } from "next";
import "@fontsource/rozha-one/400.css";
import "@fontsource/hind/400.css";
import "@fontsource/hind/500.css";
import "@fontsource/hind/600.css";
import "@fontsource/hind/700.css";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
import { SavedArtistsProvider } from "@/components/SavedArtistsProvider";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { SITE } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
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
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SavedArtistsProvider>{children}</SavedArtistsProvider>
        <InstallAppPrompt />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
