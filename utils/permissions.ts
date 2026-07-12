/**
 * permissions.ts
 * Central runtime-permission helpers for RangRiti.
 *
 * The golden rule the app follows: ALWAYS request the relevant permission and
 * confirm it is granted BEFORE opening the gallery / camera / GPS. If the user
 * has permanently denied a permission, we guide them to the system Settings
 * instead of silently failing.
 */

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Alert, Linking, Platform } from "react-native";

type Strings = { title: string; message: string };

function localized(isHindi: boolean, en: Strings, hi: Strings): Strings {
  return isHindi ? hi : en;
}

/**
 * Shows a "permission denied" alert with an option to open the app settings.
 * Used when a permission is blocked and can no longer be requested in-app.
 */
function showBlockedAlert(isHindi: boolean, { title, message }: Strings) {
  Alert.alert(
    title,
    message,
    [
      { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
      {
        text: isHindi ? "सेटिंग्स खोलें" : "Open Settings",
        onPress: () => {
          Linking.openSettings().catch(() => {});
        },
      },
    ],
    { cancelable: true }
  );
}

/**
 * Ensure we can read photos from the device gallery ("Storage" permission).
 * Requests the permission first; if it is not granted, tells the user why and
 * offers to open Settings. Returns true only when access is granted.
 */
export async function ensureMediaLibraryPermission(isHindi = false): Promise<boolean> {
  // Already granted?
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;

  // Ask (only possible if not permanently blocked)
  if (current.canAskAgain) {
    const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (asked.granted) return true;
  }

  showBlockedAlert(
    isHindi,
    localized(
      isHindi,
      {
        title: "Storage Permission Needed",
        message:
          "RangRiti needs access to your photos to upload images. Please enable Storage / Photos permission in Settings to continue.",
      },
      {
        title: "स्टोरेज अनुमति आवश्यक है",
        message:
          "तस्वीरें अपलोड करने के लिए रंगरीति को आपकी गैलरी तक पहुँच चाहिए। जारी रखने के लिए कृपया सेटिंग्स में स्टोरेज/फ़ोटो अनुमति चालू करें।",
      }
    )
  );
  return false;
}

/**
 * Ensure we can use the camera. Requests first, guides to Settings if blocked.
 */
export async function ensureCameraPermission(isHindi = false): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;

  if (current.canAskAgain) {
    const asked = await ImagePicker.requestCameraPermissionsAsync();
    if (asked.granted) return true;
  }

  showBlockedAlert(
    isHindi,
    localized(
      isHindi,
      {
        title: "Camera Permission Needed",
        message:
          "RangRiti needs camera access to take photos. Please enable the Camera permission in Settings to continue.",
      },
      {
        title: "कैमरा अनुमति आवश्यक है",
        message:
          "फ़ोटो लेने के लिए रंगरीति को कैमरा एक्सेस चाहिए। जारी रखने के लिए कृपया सेटिंग्स में कैमरा अनुमति चालू करें।",
      }
    )
  );
  return false;
}

/**
 * Ensure foreground (while-using-the-app) location permission for geo-tagging.
 */
export async function ensureLocationPermission(isHindi = false): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return true;

  if (current.canAskAgain) {
    const asked = await Location.requestForegroundPermissionsAsync();
    if (asked.granted) return true;
  }

  showBlockedAlert(
    isHindi,
    localized(
      isHindi,
      {
        title: "Location Permission Needed",
        message:
          "RangRiti needs your location to geo-tag your service area so nearby customers can find you. Please enable Location in Settings.",
      },
      {
        title: "स्थान अनुमति आवश्यक है",
        message:
          "आस-पास के ग्राहक आपको ढूँढ सकें, इसके लिए रंगरीति को आपके स्थान की आवश्यकता है। कृपया सेटिंग्स में लोकेशन चालू करें।",
      }
    )
  );
  return false;
}

/**
 * Fetch the device's current GPS coordinates (after ensuring permission).
 * Returns null if permission is denied or the location cannot be read.
 */
export async function getCurrentCoordinates(
  isHindi = false
): Promise<{ latitude: number; longitude: number; accuracy: number | null } | null> {
  const granted = await ensureLocationPermission(isHindi);
  if (!granted) return null;

  try {
    // Make sure location services (GPS) are switched on at the OS level.
    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) {
      Alert.alert(
        isHindi ? "GPS बंद है" : "Location is Off",
        isHindi
          ? "कृपया अपने फ़ोन की सेटिंग्स में GPS / लोकेशन सर्विस चालू करें और पुनः प्रयास करें।"
          : "Please turn on GPS / Location services in your phone settings and try again."
      );
      return null;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
    };
  } catch (e) {
    if (Platform.OS !== "web") console.warn("getCurrentCoordinates error:", e);
    Alert.alert(
      isHindi ? "स्थान प्राप्त नहीं हुआ" : "Could Not Get Location",
      isHindi
        ? "आपका स्थान प्राप्त करने में समस्या हुई। कृपया खुली जगह पर पुनः प्रयास करें।"
        : "We couldn't fetch your location. Please try again, ideally in an open area."
    );
    return null;
  }
}
