"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Already running as the installed app? Never show the prompt.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Respect a recent dismissal (3 days)
    const dismissedTime = localStorage.getItem("rangritii_pwa_dismissed");
    if (dismissedTime && Date.now() - Number(dismissedTime) < 3 * 24 * 60 * 60 * 1000) {
      return;
    }
    setDismissed(false);

    const iosDevice = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIOS(iosDevice);

    // Android/Chrome fires this when the site qualifies for install
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("rangritii_pwa_dismissed", String(Date.now()));
  }

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up rounded-2xl border border-rani-200 bg-white/95 p-4 shadow-xl backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Rangritii app icon"
            className="h-11 w-11 shrink-0 rounded-xl shadow-sm"
          />
          <div>
            <p className="text-sm font-bold text-ink-900">Rangritii App Install Karo</p>
            <p className="text-xs text-ink-500">
              Website se hamesha synced — booking, payment, sab kuch app mein
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-ink-400 hover:bg-cream-100 hover:text-ink-700"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rani-700 py-2.5 text-xs font-bold text-white transition hover:bg-rani-800"
        >
          <Download className="h-4 w-4" /> Install Rangritii App
        </button>
      )}

      {isIOS && !deferredPrompt && (
        <div className="mt-3 rounded-xl bg-cream-100/80 p-2.5 text-[11px] leading-relaxed text-ink-700">
          <p className="flex items-center gap-1.5 font-semibold text-rani-800">
            <Share className="h-3.5 w-3.5 text-rani-700" /> iPhone par install karne ke liye:
          </p>
          <p className="mt-1 text-ink-600">
            Browser menu par <strong>Share</strong> icon tap karo, phir{" "}
            <strong>&apos;Add to Home Screen&apos;</strong> chuno.
          </p>
        </div>
      )}
    </div>
  );
}
