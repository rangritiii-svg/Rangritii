import React, { useEffect, useState } from "react";
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";

// Current installed app version
const CURRENT_VERSION = Constants.expoConfig?.version || "2.0.2";
const GITHUB_RELEASES_API = "https://api.github.com/repos/rangritiii-svg/RangRiti-app/releases/latest";

interface ReleaseInfo {
  tagName: string;
  name: string;
  notes: string;
  downloadUrl: string;
}

function parseVersion(vStr: string): number[] {
  const cleaned = vStr.replace(/^v/i, "").trim();
  return cleaned.split(".").map((n) => parseInt(n, 10) || 0);
}

function isNewerVersion(remoteTag: string, localVersion: string): boolean {
  const remote = parseVersion(remoteTag);
  const local = parseVersion(localVersion);
  const maxLen = Math.max(remote.length, local.length);

  for (let i = 0; i < maxLen; i++) {
    const r = remote[i] || 0;
    const l = local[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Only check for app updates on mobile devices or during active app runs
    const checkForUpdates = async () => {
      try {
        const response = await fetch(GITHUB_RELEASES_API, {
          headers: { Accept: "application/vnd.github.v3+json" },
        });
        if (!response.ok) return;

        const data = await response.json();
        const latestTag = data.tag_name;

        if (latestTag && isNewerVersion(latestTag, CURRENT_VERSION)) {
          const apkAsset = data.assets?.find((a: any) => a.name?.endsWith(".apk"));
          const downloadUrl =
            apkAsset?.browser_download_url ||
            `https://github.com/rangritiii-svg/RangRiti-app/releases/download/${latestTag}/RangRiti-${latestTag}.apk`;

          setReleaseInfo({
            tagName: latestTag,
            name: data.name || `RangRiti ${latestTag}`,
            notes: data.body || "Performance improvements & bug fixes.",
            downloadUrl,
          });
          setUpdateAvailable(true);
          setModalVisible(true);
        }
      } catch (err) {
        // Silent catch — update check failure shouldn't interrupt user flow
        console.log("Update check skipped/failed:", err);
      }
    };

    checkForUpdates();
  }, []);

  if (!updateAvailable || !releaseInfo) return null;

  const handleDownload = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch (_e) {}
    setDownloading(true);
    Linking.openURL(releaseInfo.downloadUrl).catch(() => {
      // Fallback to releases page
      Linking.openURL("https://github.com/rangritiii-svg/RangRiti-app/releases/latest").catch(() => {});
    });
    setTimeout(() => setDownloading(false), 3000);
  };

  const handleDismiss = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {}
    setModalVisible(false);
  };

  return (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={["#1A0A0E", "#4A1020"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={26} color="#C9932F" />
            </View>
            <Text style={styles.headerTitle}>New Update Available! 🚀</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>
                v{CURRENT_VERSION} ➔ {releaseInfo.tagName}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.updateTitle}>{releaseInfo.name}</Text>
            <Text style={styles.updateSubtitle}>
              A new version of RangRiti is ready with improvements, bug fixes, and new features.
            </Text>

            <TouchableOpacity
              style={styles.downloadBtnShadow}
              onPress={handleDownload}
              activeOpacity={0.85}
              disabled={downloading}
            >
              <LinearGradient
                colors={["#C9932F", "#A87525"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.downloadBtn}
              >
                {downloading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={styles.downloadBtnText}>Update Now (APK)</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.laterBtn} onPress={handleDismiss} activeOpacity={0.7}>
              <Text style={styles.laterBtnText}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26, 10, 14, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFF8F0",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#F5D0DC",
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(201, 147, 47, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(201, 147, 47, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontFamily: "Poppins_700Bold",
    color: "#FFF8F0",
    textAlign: "center",
  },
  versionBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(201, 147, 47, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(201, 147, 47, 0.4)",
  },
  versionBadgeText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#C9932F",
  },
  body: {
    padding: 20,
    alignItems: "center",
  },
  updateTitle: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#2A1020",
    marginBottom: 4,
    textAlign: "center",
  },
  updateSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#8A6070",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  downloadBtnShadow: {
    width: "100%",
    borderRadius: 14,
    shadowColor: "#C9932F",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  downloadBtnText: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#ffffff",
  },
  laterBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  laterBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: "#8A6070",
  },
});
