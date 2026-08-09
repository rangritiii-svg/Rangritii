import React, { useEffect, useRef, useState } from "react";

/**
 * ProximityMap — WEB implementation.
 *
 * Renders a real interactive map on the website using Leaflet +
 * OpenStreetMap tiles (100% free, no API key). Leaflet is loaded once at
 * runtime from the unpkg CDN so nothing heavy is added to the app bundle
 * and the native app is untouched (it uses ProximityMap.tsx with
 * react-native-maps).
 *
 * Shows the customer's location plus one tappable pin per geo-tagged
 * artist; clicking a pin selects the artist in the Discover screen.
 */

interface ProximityMapProps {
  userCoords: { latitude: number; longitude: number } | null;
  nearbyArtists: any[];
  selectedArtistId: string | null;
  handlePinPress: (artistId: string) => void;
  cityColors: Record<string, string>;
  styles: any;
}

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = LEAFLET_CSS;
      document.head.appendChild(css);
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => {
      leafletPromise = null;
      reject(new Error("Failed to load map library"));
    };
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function ProximityMap({
  userCoords,
  nearbyArtists,
  selectedArtistId,
  handlePinPress,
  cityColors,
}: ProximityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const didFitRef = useRef(false);
  // Flips once Leaflet has initialised so the marker effect re-runs even if
  // the artist data arrived before the map finished loading
  const [mapReady, setMapReady] = useState(false);

  // Keep latest callback without re-creating markers on every render
  const pinPressRef = useRef(handlePinPress);
  pinPressRef.current = handlePinPress;

  // Initialise the map once
  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const center: [number, number] = userCoords
          ? [userCoords.latitude, userCoords.longitude]
          : [26.9124, 75.7873]; // Jaipur fallback

        const map = L.map(containerRef.current, {
          center,
          zoom: 11,
          scrollWheelZoom: false, // don't hijack page scroll — zoom via buttons
          attributionControl: true,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        markerLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setMapReady(true);
      })
      .catch(() => {
        /* Map library blocked/offline — the artist list below still works */
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerLayerRef.current = null;
        didFitRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw / redraw markers whenever data changes
  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();

    // Customer's own location — blue pulse dot
    if (userCoords) {
      const youIcon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([userCoords.latitude, userCoords.longitude], { icon: youIcon, zIndexOffset: 500 })
        .addTo(layer)
        .bindTooltip("You", { direction: "top", offset: [0, -10] });
    }

    const geoArtists = nearbyArtists.filter(
      (a) => a.latitude != null && a.longitude != null
    );

    geoArtists.forEach((artist) => {
      const isSelected = artist.id === selectedArtistId;
      const color = cityColors[artist.city] || "#C9932F";
      const initials = escapeHtml(
        String(artist.name || "?")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      );
      const size = isSelected ? 40 : 32;

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid ${isSelected ? "#1A0A0E" : "#fff"};box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-family:Poppins,sans-serif;font-weight:700;font-size:${isSelected ? 14 : 11}px;color:#fff;cursor:pointer;">${initials}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([artist.latitude, artist.longitude], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(layer);

      const distanceText =
        artist.distance != null ? ` · ${Number(artist.distance).toFixed(1)} km` : "";
      marker.bindTooltip(`${escapeHtml(artist.name)}${distanceText}`, {
        direction: "top",
        offset: [0, -size / 2 - 4],
      });

      marker.on("click", () => pinPressRef.current(artist.id));
    });

    // Fit all pins in view once (first time data arrives)
    if (!didFitRef.current && (geoArtists.length > 0 || userCoords)) {
      const points = geoArtists.map((a) => [a.latitude, a.longitude]);
      if (userCoords) points.push([userCoords.latitude, userCoords.longitude]);
      if (points.length > 1) {
        map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
      }
      didFitRef.current = true;
    }
  }, [nearbyArtists, selectedArtistId, userCoords, cityColors, mapReady]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        overflow: "hidden",
        background: "#DDE8F0",
        zIndex: 0,
      }}
    />
  );
}
