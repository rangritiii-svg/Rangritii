import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE.name} — Mehandi Artist Booking`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf5ee",
    theme_color: "#8b1e3f",
    orientation: "portrait",
    categories: ["beauty", "lifestyle", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Find Artists",
        url: "/artists",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Pay for Booking",
        url: "/pay",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Join as Artist",
        url: "/join",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
