import { ScrollViewStyleReset } from "expo-router/html";
import React from "react";

/**
 * Custom HTML shell for the static web export (expo-router).
 * This wraps every page of the RangRiti website — set SEO metadata,
 * social-share (Open Graph) tags and mobile-web polish here.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* SEO */}
        <title>RangRiti — Book Mehndi Artists in Rajasthan</title>
        <meta
          name="description"
          content="RangRiti (रंगरीति) — India's premier mehndi artist marketplace. Discover verified bridal, Arabic and traditional mehndi artists across all districts of Rajasthan, view portfolios, and book online."
        />
        <meta
          name="keywords"
          content="mehndi artist, mehandi, henna, bridal mehndi, Rajasthan, Jaipur, book mehndi artist, रंगरीति, मेहंदी"
        />
        <meta name="theme-color" content="#E8849E" />

        {/* Open Graph (WhatsApp / Facebook share preview) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="RangRiti" />
        <meta property="og:title" content="RangRiti — Book Mehndi Artists in Rajasthan" />
        <meta
          property="og:description"
          content="Discover verified mehndi artists near you. View portfolios, compare rates and book online — bridal, Arabic, traditional and more."
        />
        <meta property="og:image" content="/assets/og-image.png" />

        {/* Twitter card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RangRiti — Book Mehndi Artists in Rajasthan" />
        <meta
          name="twitter:description"
          content="Discover verified mehndi artists near you. View portfolios, compare rates and book online."
        />

        {/* Disable body scrolling on web so ScrollView components work as on native */}
        <ScrollViewStyleReset />

        {/* Base page styling while the app bundle loads */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { height: 100%; }
              body { overflow: hidden; background-color: #FFF5F8; }
              #root { display: flex; height: 100%; flex: 1; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
