/**
 * webAlert.ts
 * react-native-web's Alert.alert is a NO-OP — on the website every
 * confirmation, validation error and success dialog would silently vanish,
 * and alert buttons with onPress callbacks (e.g. "Registration submitted →
 * Got it!" which navigates home) would never fire.
 *
 * This module patches Alert.alert on web with a browser-native equivalent:
 *  - 0–1 buttons  → window.alert, then invoke the button's onPress
 *  - 2+  buttons  → window.confirm; OK triggers the primary (non-cancel)
 *                   button, Cancel triggers the cancel-style button
 *
 * Import once, as early as possible (done in app/_layout.tsx). Native
 * platforms are untouched.
 */

import { Alert, Platform, type AlertButton } from "react-native";

if (Platform.OS === "web" && typeof window !== "undefined") {
  Alert.alert = (
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ): void => {
    const text = [title, message].filter(Boolean).join("\n\n");

    // Simple notification — no choice to make
    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    // Choice dialog — map to confirm()
    const cancelBtn = buttons.find((b) => b.style === "cancel");
    const primaryBtn = buttons.find((b) => b !== cancelBtn) ?? buttons[0];
    const suffix = primaryBtn.text ? `\n\nPress OK to: ${primaryBtn.text}` : "";

    if (window.confirm(text + suffix)) {
      primaryBtn.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
  };
}

export {};
