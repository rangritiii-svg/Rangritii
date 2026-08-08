import { ScrollViewStyleReset } from "expo-router/html";
import React from "react";

/**
 * Custom HTML shell for the static web export (expo-router).
 * This wraps every page of the RangRiti website — SEO metadata, social-share
 * (Open Graph) tags, geo signals for local search, and JSON-LD structured
 * data for search engines & AI assistants (GEO) all live here.
 *
 * Route-specific titles are added per-screen with <Head> from "expo-router/head".
 */

const SITE_URL = "https://rangritii.vercel.app";
const SITE_NAME = "RangRiti";
const TITLE = "RangRiti — Book Verified Mehndi Artists in Rajasthan | रंगरीति";
const DESCRIPTION =
  "RangRiti (रंगरीति) is India's mehndi artist marketplace. Discover verified bridal, Arabic and traditional mehndi (henna) artists across all 41 districts of Rajasthan — view portfolios, compare hourly rates, chat and book online with UPI or cash payment.";

// ── JSON-LD structured data (SEO + GEO: readable by Google, Bing & AI engines) ──
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: "रंगरीति",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description: DESCRIPTION,
      areaServed: {
        "@type": "State",
        name: "Rajasthan",
        containedInPlace: { "@type": "Country", name: "India" },
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: ["en-IN", "hi-IN"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#business`,
      name: "RangRiti — Mehndi Artist Booking",
      image: `${SITE_URL}/og-image.png`,
      url: SITE_URL,
      priceRange: "₹₹",
      address: {
        "@type": "PostalAddress",
        addressRegion: "Rajasthan",
        addressCountry: "IN",
      },
      geo: { "@type": "GeoCoordinates", latitude: 26.9124, longitude: 75.7873 },
      areaServed: "Rajasthan, India",
      makesOffer: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Bridal Mehndi (दुल्हन मेहंदी)" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Arabic Mehndi" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Traditional Rajasthani Mehndi" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Festival & Party Henna" } },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I book a mehndi artist on RangRiti?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sign up as a customer (mobile number or Google account), browse verified mehndi artists near you on the map, compare portfolios and hourly rates, then send a booking request for your preferred date and time slot. Pay online via UPI or in cash.",
          },
        },
        {
          "@type": "Question",
          name: "Which cities does RangRiti cover?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "RangRiti covers all 41 districts of Rajasthan including Jaipur, Jodhpur, Udaipur, Kota, Ajmer, Bikaner and Alwar, with artists geo-tagged so you can find the nearest one.",
          },
        },
        {
          "@type": "Question",
          name: "Are the mehndi artists verified?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — every artist submits government ID and bank documents and is manually approved by the RangRiti team before appearing in search results.",
          },
        },
        {
          "@type": "Question",
          name: "What is the cancellation policy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Cancel 24 hours or more before the session for a full refund. Later cancellations follow a tiered refund policy shown at booking time.",
          },
        },
      ],
    },
  ],
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* ── SEO ── */}
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta
          name="keywords"
          content="mehndi artist, mehndi artist near me, mehandi, henna artist, bridal mehndi, dulhan mehndi, Arabic mehndi, Rajasthan, Jaipur, Jodhpur, Udaipur, book mehndi artist online, mehndi booking app, रंगरीति, मेहंदी आर्टिस्ट, मेहंदी बुकिंग"
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta name="theme-color" content="#E8849E" />
        <meta name="application-name" content={SITE_NAME} />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* ── GEO signals for local search (Rajasthan, India) ── */}
        <meta name="geo.region" content="IN-RJ" />
        <meta name="geo.placename" content="Jaipur, Rajasthan, India" />
        <meta name="geo.position" content="26.9124;75.7873" />
        <meta name="ICBM" content="26.9124, 75.7873" />

        {/* ── Open Graph (WhatsApp / Facebook share preview) ── */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:locale:alternate" content="hi_IN" />

        {/* ── Twitter / X card ── */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        {/* ── Structured data (JSON-LD) for search engines & AI assistants ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
      <body>
        {/* Static fallback content for non-JavaScript crawlers & AI engines (GEO) */}
        <noscript>
          <main>
            <h1>RangRiti (रंगरीति) — Book Verified Mehndi Artists in Rajasthan</h1>
            <p>
              RangRiti is India&apos;s mehndi artist marketplace covering all 41 districts of
              Rajasthan — Jaipur, Jodhpur, Udaipur, Kota, Ajmer, Bikaner, Alwar and more.
              Browse portfolios of verified bridal, Arabic and traditional mehndi (henna)
              artists, compare hourly rates, chat with artists and book online. Pay by UPI
              or cash. Artists are geo-tagged so you can find the nearest one to you.
            </p>
            <ul>
              <li><a href="/auth/customer-login">Customer login / sign up (Google login supported)</a></li>
              <li><a href="/auth/artist-login">Mehndi artist login</a></li>
              <li><a href="/auth/artist-register">Register as a mehndi artist</a></li>
            </ul>
            <p>This website requires JavaScript for the full interactive experience.</p>
          </main>
        </noscript>
        {children}
      </body>
    </html>
  );
}
