import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useRef, useState } from "react";
import {
  Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity,
  useWindowDimensions, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";

/**
 * RangRiti landing page — the public face of the website AND the app's
 * welcome screen. Marketplace-style layout (hero → stats → styles →
 * how-it-works → features → artist CTA → testimonials → FAQ → footer),
 * responsive from phones to wide desktop, bilingual EN/हिंदी.
 */

const MAROON = "#4A1020";
const DARK = "#1A0A0E";
const GOLD = "#C9932F";
const GOLD_DARK = "#A87525";
const PINK = "#E8849E";
const PINK_LIGHT = "#F9AABF";
const BLUSH = "#FDEDF3";
const CREAM = "#FFF8F0";
const INK = "#2A1020";
const MUTED = "#8A6070";

// Android APK download link shown on the website. The APK is published on the
// PUBLIC releases-only repo (the main code repo is private, so its releases
// aren't visible to visitors). Upload new versions with:
//   gh release create vX.Y.Z RangRiti-vX.Y.Z.apk --repo rangritiii-svg/RangRiti-app
const APP_DOWNLOAD_URL = "https://github.com/rangritiii-svg/RangRiti-app/releases/latest";
const IS_WEB = Platform.OS === "web";

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useApp();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const isHindi = language === "hi_IN";
  const isWide = width >= 900;
  const isTablet = width >= 640 && width < 900;

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tap = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {} };

  const goCustomer = () => { tap(); router.push("/auth/customer-login"); };
  const goArtist = () => { tap(); router.push("/auth/artist-login"); };
  const goRegister = () => { tap(); router.push("/auth/artist-register"); };
  const toggleLang = async () => { tap(); await setLanguage(isHindi ? "en_IN" : "hi_IN"); };
  const downloadApp = () => { tap(); Linking.openURL(APP_DOWNLOAD_URL).catch(() => {}); };

  const STYLES_DATA = [
    {
      img: require("@/assets/images/bridal_style.png"),
      en: "Bridal Mehndi", hi: "दुल्हन मेहंदी",
      subEn: "Full-hand wedding classics", subHi: "शादी के लिए फुल-हैंड डिज़ाइन",
    },
    {
      img: require("@/assets/images/arabic_style.png"),
      en: "Arabic Mehndi", hi: "अरेबिक मेहंदी",
      subEn: "Bold, free-flowing patterns", subHi: "बोल्ड और स्टाइलिश पैटर्न",
    },
    {
      img: require("@/assets/images/hero_banner.png"),
      en: "Traditional Rajasthani", hi: "पारंपरिक राजस्थानी",
      subEn: "Marwari & festival designs", subHi: "मारवाड़ी और त्योहार डिज़ाइन",
    },
  ];

  const STEPS = [
    {
      icon: "magnify" as const,
      en: "Browse & Compare", hi: "देखें और चुनें",
      subEn: "Explore verified artists near you — portfolios, ratings and transparent hourly rates.",
      subHi: "अपने पास के वेरिफाइड आर्टिस्ट देखें — पोर्टफोलियो, रेटिंग और साफ़-साफ़ रेट।",
    },
    {
      icon: "calendar-heart" as const,
      en: "Book Your Slot", hi: "स्लॉट बुक करें",
      subEn: "Pick your date & time, send a request and chat with the artist in-app.",
      subHi: "अपनी तारीख़ और समय चुनें, रिक्वेस्ट भेजें और ऐप में ही बात करें।",
    },
    {
      icon: "hand-heart" as const,
      en: "Pay & Celebrate", hi: "पेमेंट करें और जश्न मनाएँ",
      subEn: "Pay securely by UPI or cash after the service. Full refund on 24h+ cancellations.",
      subHi: "UPI या कैश से सुरक्षित पेमेंट। 24 घंटे पहले कैंसिल पर पूरा रिफंड।",
    },
  ];

  const FEATURES = [
    {
      icon: "shield-check" as const,
      en: "100% Verified Artists", hi: "100% वेरिफाइड आर्टिस्ट",
      subEn: "Every artist submits government ID and is manually approved before going live.",
      subHi: "हर आर्टिस्ट की ID जाँच के बाद ही प्रोफ़ाइल लाइव होती है।",
    },
    {
      icon: "map-marker-radius" as const,
      en: "Nearest Artist First", hi: "सबसे पास वाले पहले",
      subEn: "Artists are geo-tagged — see real distance from you on a live map.",
      subHi: "आर्टिस्ट जियो-टैग्ड हैं — मैप पर असली दूरी देखें।",
    },
    {
      icon: "qrcode-scan" as const,
      en: "Secure UPI Payments", hi: "सुरक्षित UPI पेमेंट",
      subEn: "Pay online via UPI with admin-verified confirmation, or simply pay cash.",
      subHi: "UPI से ऑनलाइन पेमेंट या सीधा कैश — आपकी मर्ज़ी।",
    },
    {
      icon: "translate" as const,
      en: "English + हिंदी", hi: "English + हिंदी",
      subEn: "The whole experience works in both languages — switch anytime.",
      subHi: "पूरा ऐप दोनों भाषाओं में — कभी भी बदलें।",
    },
  ];

  const TESTIMONIALS = [
    {
      quote: isHindi
        ? "शादी से एक हफ्ते पहले बुक किया — पोर्टफोलियो देखकर चुनना बहुत आसान था। मेहंदी सबको बहुत पसंद आई!"
        : "Booked a week before my wedding — choosing from real portfolios made it so easy. Everyone loved the mehndi!",
      name: isHindi ? "दुल्हन, जयपुर" : "A bride from Jaipur",
      icon: "flower" as const,
    },
    {
      quote: isHindi
        ? "करवा चौथ पर घर बैठे आर्टिस्ट मिल गई — रेट पहले से पता था, कोई मोल-भाव नहीं।"
        : "Found an artist for Karva Chauth without leaving home — rates were upfront, no haggling.",
      name: isHindi ? "ग्राहक, जोधपुर" : "A customer from Jodhpur",
      icon: "heart" as const,
    },
    {
      quote: isHindi
        ? "आर्टिस्ट के तौर पर अब मुझे हर महीने नई बुकिंग मिलती हैं — पेमेंट भी समय पर।"
        : "As an artist I now get new bookings every month — and payouts on time.",
      name: isHindi ? "मेहंदी आर्टिस्ट, उदयपुर" : "A mehndi artist from Udaipur",
      icon: "palette" as const,
    },
  ];

  const FAQS = [
    {
      q: isHindi ? "बुकिंग कैसे करें?" : "How do I book a mehndi artist?",
      a: isHindi
        ? "साइन अप करें (मोबाइल नंबर या Google से), अपने पास के आर्टिस्ट देखें, पोर्टफोलियो और रेट तुलना करें, फिर अपनी तारीख़ के लिए रिक्वेस्ट भेजें।"
        : "Sign up with your mobile number or Google account, browse artists near you, compare portfolios and rates, then send a booking request for your date.",
    },
    {
      q: isHindi ? "कौन-कौन से शहर कवर हैं?" : "Which cities are covered?",
      a: isHindi
        ? "राजस्थान के सभी 41 ज़िले — जयपुर, जोधपुर, उदयपुर, कोटा, अजमेर, बीकानेर, अलवर और बाकी सब।"
        : "All 41 districts of Rajasthan — Jaipur, Jodhpur, Udaipur, Kota, Ajmer, Bikaner, Alwar and more.",
    },
    {
      q: isHindi ? "क्या आर्टिस्ट भरोसेमंद हैं?" : "Are the artists verified?",
      a: isHindi
        ? "हाँ — हर आर्टिस्ट सरकारी ID जमा करता है और टीम की मंज़ूरी के बाद ही दिखता है।"
        : "Yes — every artist submits government ID and bank documents and is manually approved by our team before appearing in search.",
    },
    {
      q: isHindi ? "कैंसिल करने पर रिफंड?" : "What if I cancel?",
      a: isHindi
        ? "सेशन से 24+ घंटे पहले कैंसिल करने पर पूरा रिफंड। उसके बाद टियर के हिसाब से रिफंड मिलता है।"
        : "Cancel 24+ hours before the session for a full refund. Later cancellations follow a fair tiered refund policy shown at booking.",
    },
  ];

  const H = (en: string, hi: string) => (isHindi ? hi : en);

  return (
    <View style={styles.root}>
      <Head>
        <title>RangRiti — Book Verified Mehndi Artists in Rajasthan | रंगरीति</title>
        <meta
          name="description"
          content="Welcome to RangRiti — connect with talented, verified mehndi artists for weddings, festivals and special occasions across Rajasthan. Login as a customer or artist to get started."
        />
      </Head>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }}>

        {/* ───────────────────────── TOP NAV ───────────────────────── */}
        <View style={[styles.nav, { paddingTop: (Platform.OS === "web" ? 14 : insets.top + 10) }]}>
          <View style={[styles.section, styles.navInner]}>
            <View style={styles.brandRow}>
              <View style={styles.brandLogo}>
                <MaterialCommunityIcons name="flower" size={22} color={GOLD} />
              </View>
              <Text style={styles.brandName}>RangRiti</Text>
              <Text style={styles.brandHindi}>रंगरीति</Text>
            </View>

            <View style={styles.navRight}>
              <TouchableOpacity style={styles.langChip} onPress={toggleLang} activeOpacity={0.8}>
                <MaterialCommunityIcons name="translate" size={14} color={CREAM} />
                <Text style={styles.langChipText}>{isHindi ? "English" : "हिंदी"}</Text>
              </TouchableOpacity>
              {isWide || isTablet ? (
                <TouchableOpacity style={styles.navGhostBtn} onPress={goArtist} activeOpacity={0.8}>
                  <Text style={styles.navGhostText}>{H("Artist Login", "आर्टिस्ट लॉगिन")}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.navCta} onPress={goCustomer} activeOpacity={0.85}>
                <Text style={styles.navCtaText}>{H("Login / Sign Up", "लॉगिन / साइन अप")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ───────────────────────── HERO ───────────────────────── */}
        <LinearGradient
          colors={[DARK, MAROON, "#6E1830"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={[styles.section, isWide && styles.heroRow]}>
            {/* Copy */}
            <View style={[styles.heroCopy, isWide && { flex: 1.1, paddingRight: 40 }]}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="star-four-points" size={12} color={GOLD} />
                <Text style={styles.heroBadgeText}>
                  {H("Rajasthan's Mehndi Marketplace", "राजस्थान का मेहंदी मार्केटप्लेस")}
                </Text>
              </View>

              <Text style={[styles.heroTitle, (isWide || isTablet) && { fontSize: 44, lineHeight: 56 }]}>
                {H("Beautiful mehndi,", "ख़ूबसूरत मेहंदी,")}{"\n"}
                <Text style={{ color: GOLD }}>{H("booked in minutes", "मिनटों में बुक")}</Text>
              </Text>

              <Text style={styles.heroSub}>
                {H(
                  "Discover verified bridal, Arabic & traditional mehndi artists near you. Compare portfolios & rates, chat, and book for weddings, Karva Chauth, Teej, Diwali & Eid.",
                  "अपने पास की वेरिफाइड दुल्हन, अरेबिक और पारंपरिक मेहंदी आर्टिस्ट खोजें। पोर्टफोलियो और रेट देखें, बात करें, और शादी, करवा चौथ, तीज, दिवाली व ईद के लिए बुक करें।"
                )}
              </Text>

              <View style={styles.heroCtaRow}>
                <TouchableOpacity onPress={goCustomer} activeOpacity={0.9} style={styles.heroCtaShadow}>
                  <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroCtaPrimary}>
                    <Ionicons name="search" size={18} color="#fff" />
                    <Text style={styles.heroCtaPrimaryText}>{H("Find an Artist", "आर्टिस्ट खोजें")}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroCtaSecondary} onPress={goRegister} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="palette-outline" size={18} color={PINK_LIGHT} />
                  <Text style={styles.heroCtaSecondaryText}>{H("I'm a Mehndi Artist", "मैं मेहंदी आर्टिस्ट हूँ")}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.trustRow}>
                {[
                  { icon: "check-decagram" as const, en: "Verified artists", hi: "वेरिफाइड आर्टिस्ट" },
                  { icon: "map-marker-check" as const, en: "41 districts", hi: "41 ज़िले" },
                  { icon: "qrcode" as const, en: "UPI & cash", hi: "UPI और कैश" },
                ].map((t, i) => (
                  <View key={i} style={styles.trustChip}>
                    <MaterialCommunityIcons name={t.icon} size={13} color={GOLD} />
                    <Text style={styles.trustChipText}>{H(t.en, t.hi)}</Text>
                  </View>
                ))}
              </View>

              {/* Android app download — website only */}
              {IS_WEB && (
                <TouchableOpacity style={styles.downloadPill} onPress={downloadApp} activeOpacity={0.85}>
                  <Ionicons name="logo-android" size={16} color="#3DDC84" />
                  <Text style={styles.downloadPillText}>
                    {H("Download the Android App", "एंड्रॉइड ऐप डाउनलोड करें")}
                  </Text>
                  <Ionicons name="download-outline" size={14} color={GOLD} />
                </TouchableOpacity>
              )}
            </View>

            {/* Visual */}
            <View style={[styles.heroVisual, isWide && { flex: 0.9 }]}>
              <View style={styles.heroImageWrap}>
                <Image source={require("@/assets/images/hero_banner.png")} style={styles.heroImage} resizeMode="cover" />
                <LinearGradient colors={["transparent", "rgba(26,10,14,0.65)"]} style={StyleSheet.absoluteFill} />
                <View style={styles.heroImageLabel}>
                  <MaterialCommunityIcons name="flower" size={14} color={GOLD} />
                  <Text style={styles.heroImageLabelText}>{H("Bridal · Arabic · Traditional", "दुल्हन · अरेबिक · पारंपरिक")}</Text>
                </View>
              </View>

              {/* Floating cards */}
              <View style={[styles.floatCard, styles.floatCardTop]}>
                <View style={styles.floatIconWrap}>
                  <Ionicons name="star" size={14} color="#fff" />
                </View>
                <View>
                  <Text style={styles.floatTitle}>{H("Rated & Reviewed", "रेटिंग और रिव्यू")}</Text>
                  <Text style={styles.floatSub}>{H("Real customer feedback", "असली ग्राहकों की राय")}</Text>
                </View>
              </View>
              <View style={[styles.floatCard, styles.floatCardBottom]}>
                <View style={[styles.floatIconWrap, { backgroundColor: "#16A34A" }]}>
                  <Ionicons name="location" size={14} color="#fff" />
                </View>
                <View>
                  <Text style={styles.floatTitle}>{H("Near You", "आपके पास")}</Text>
                  <Text style={styles.floatSub}>{H("Live distance on map", "मैप पर लाइव दूरी")}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ───────────────────────── STATS STRIP ───────────────────────── */}
        <View style={styles.statsStrip}>
          <View style={[styles.section, styles.statsInner]}>
            {[
              { big: "41", en: "Districts of Rajasthan", hi: "राजस्थान के ज़िले" },
              { big: "100%", en: "ID-verified artists", hi: "ID-वेरिफाइड आर्टिस्ट" },
              { big: "24h", en: "Full-refund window", hi: "फुल रिफंड विंडो" },
              { big: "2", en: "Languages — EN & हिंदी", hi: "भाषाएँ — EN और हिंदी" },
            ].map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={styles.statBig}>{s.big}</Text>
                <Text style={styles.statSmall}>{H(s.en, s.hi)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ───────────────────────── POPULAR STYLES ───────────────────────── */}
        <View style={[styles.section, styles.block]}>
          <Text style={styles.kicker}>{H("POPULAR STYLES", "लोकप्रिय स्टाइल")}</Text>
          <Text style={styles.blockTitle}>{H("Every occasion, every style", "हर मौके के लिए, हर स्टाइल")}</Text>
          <View style={[styles.stylesRow, !isWide && !isTablet && { flexDirection: "column" }]}>
            {STYLES_DATA.map((s, i) => (
              <TouchableOpacity key={i} style={styles.styleCard} onPress={goCustomer} activeOpacity={0.9}>
                <Image source={s.img} style={styles.styleImg} resizeMode="cover" />
                <LinearGradient colors={["transparent", "rgba(26,10,14,0.85)"]} style={StyleSheet.absoluteFill} />
                <View style={styles.styleCardBody}>
                  <Text style={styles.styleCardTitle}>{H(s.en, s.hi)}</Text>
                  <Text style={styles.styleCardSub}>{H(s.subEn, s.subHi)}</Text>
                  <View style={styles.styleCardCta}>
                    <Text style={styles.styleCardCtaText}>{H("View artists", "आर्टिस्ट देखें")}</Text>
                    <Ionicons name="arrow-forward" size={13} color={GOLD} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ───────────────────────── HOW IT WORKS ───────────────────────── */}
        <View style={styles.softBand}>
          <View style={[styles.section, styles.block]}>
            <Text style={styles.kicker}>{H("HOW IT WORKS", "कैसे काम करता है")}</Text>
            <Text style={styles.blockTitle}>{H("Booked in 3 simple steps", "सिर्फ़ 3 आसान स्टेप")}</Text>
            <View style={[styles.stepsRow, !isWide && { flexDirection: "column" }]}>
              {STEPS.map((s, i) => (
                <View key={i} style={styles.stepCard}>
                  <View style={styles.stepNumWrap}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  <View style={styles.stepIconWrap}>
                    <MaterialCommunityIcons name={s.icon} size={26} color={MAROON} />
                  </View>
                  <Text style={styles.stepTitle}>{H(s.en, s.hi)}</Text>
                  <Text style={styles.stepSub}>{H(s.subEn, s.subHi)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ───────────────────────── WHY RANGRITI ───────────────────────── */}
        <View style={[styles.section, styles.block]}>
          <Text style={styles.kicker}>{H("WHY RANGRITI", "रंगरीति ही क्यों")}</Text>
          <Text style={styles.blockTitle}>{H("Trust, built into every booking", "हर बुकिंग में भरोसा")}</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureCard, { width: isWide ? "23.5%" : isTablet ? "48%" : "100%" }]}>
                <View style={styles.featureIconWrap}>
                  <MaterialCommunityIcons name={f.icon} size={24} color={GOLD} />
                </View>
                <Text style={styles.featureTitle}>{H(f.en, f.hi)}</Text>
                <Text style={styles.featureSub}>{H(f.subEn, f.subHi)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ───────────────────────── ARTIST CTA BAND ───────────────────────── */}
        <LinearGradient colors={[GOLD, "#8B6914"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.artistBand}>
          <View style={[styles.section, isWide && { flexDirection: "row", alignItems: "center", gap: 40 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.artistBandKicker}>{H("FOR MEHNDI ARTISTS", "मेहंदी आर्टिस्ट के लिए")}</Text>
              <Text style={styles.artistBandTitle}>
                {H("Turn your art into income", "अपने हुनर को कमाई बनाइए")}
              </Text>
              <Text style={styles.artistBandSub}>
                {H(
                  "Create your free profile, upload your portfolio, set your own hourly rate and start receiving bookings from customers across Rajasthan.",
                  "फ्री प्रोफ़ाइल बनाइए, पोर्टफोलियो अपलोड कीजिए, अपना रेट खुद तय कीजिए और पूरे राजस्थान से बुकिंग पाइए।"
                )}
              </Text>
              <View style={styles.artistPerksRow}>
                {[
                  H("Free to join", "जुड़ना फ्री"),
                  H("Your own rates", "रेट आपके"),
                  H("Direct payouts", "सीधा पेमेंट"),
                ].map((p, i) => (
                  <View key={i} style={styles.artistPerk}>
                    <Ionicons name="checkmark-circle" size={14} color="#FFF8F0" />
                    <Text style={styles.artistPerkText}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.artistBandBtn} onPress={goRegister} activeOpacity={0.9}>
              <MaterialCommunityIcons name="palette" size={18} color={GOLD_DARK} />
              <Text style={styles.artistBandBtnText}>{H("Register as an Artist — Free", "आर्टिस्ट रजिस्ट्रेशन — फ्री")}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ───────────────────────── TESTIMONIALS ───────────────────────── */}
        <View style={[styles.section, styles.block]}>
          <Text style={styles.kicker}>{H("HAPPY FACES", "खुश चेहरे")}</Text>
          <Text style={styles.blockTitle}>{H("Loved by brides & artists alike", "दुल्हनों और आर्टिस्ट — दोनों की पसंद")}</Text>
          <View style={[styles.testiRow, !isWide && { flexDirection: "column" }]}>
            {TESTIMONIALS.map((t, i) => (
              <View key={i} style={styles.testiCard}>
                <View style={styles.testiStars}>
                  {[...Array(5)].map((_, s) => (
                    <Ionicons key={s} name="star" size={14} color={GOLD} />
                  ))}
                </View>
                <Text style={styles.testiQuote}>"{t.quote}"</Text>
                <View style={styles.testiWho}>
                  <View style={styles.testiAvatar}>
                    <MaterialCommunityIcons name={t.icon} size={16} color={MAROON} />
                  </View>
                  <Text style={styles.testiName}>{t.name}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ───────────────────────── FAQ ───────────────────────── */}
        <View style={styles.softBand}>
          <View style={[styles.section, styles.block, { maxWidth: 760 }]}>
            <Text style={styles.kicker}>FAQ</Text>
            <Text style={styles.blockTitle}>{H("Questions? Answered.", "सवाल? जवाब हाज़िर।")}</Text>
            {FAQS.map((f, i) => (
              <TouchableOpacity
                key={i}
                style={styles.faqCard}
                onPress={() => { tap(); setOpenFaq(openFaq === i ? null : i); }}
                activeOpacity={0.85}
              >
                <View style={styles.faqHead}>
                  <Text style={styles.faqQ}>{f.q}</Text>
                  <Ionicons name={openFaq === i ? "chevron-up" : "chevron-down"} size={18} color={MUTED} />
                </View>
                {openFaq === i && <Text style={styles.faqA}>{f.a}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ───────────────────────── FINAL CTA ───────────────────────── */}
        <LinearGradient colors={[MAROON, DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.finalCta}>
          <View style={[styles.section, { alignItems: "center" }]}>
            <MaterialCommunityIcons name="flower" size={36} color={GOLD} />
            <Text style={styles.finalCtaTitle}>
              {H("Your celebration deserves the best hands", "आपके जश्न के लिए सबसे अच्छे हाथ")}
            </Text>
            <Text style={styles.finalCtaSub}>
              {H("Join RangRiti today — it takes less than a minute.", "आज ही रंगरीति से जुड़ें — बस एक मिनट लगेगा।")}
            </Text>
            <View style={styles.finalCtaRow}>
              <TouchableOpacity onPress={goCustomer} activeOpacity={0.9} style={styles.heroCtaShadow}>
                <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroCtaPrimary}>
                  <Ionicons name="person" size={17} color="#fff" />
                  <Text style={styles.heroCtaPrimaryText}>{H("Book an Artist", "आर्टिस्ट बुक करें")}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroCtaSecondary} onPress={goRegister} activeOpacity={0.85}>
                <MaterialCommunityIcons name="palette-outline" size={17} color={PINK_LIGHT} />
                <Text style={styles.heroCtaSecondaryText}>{H("Join as an Artist", "आर्टिस्ट बनकर जुड़ें")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* ───────────────────────── FOOTER ───────────────────────── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={[styles.section, isWide && { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }]}>
            <View style={{ marginBottom: isWide ? 0 : 20 }}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="flower" size={20} color={GOLD} />
                <Text style={[styles.brandName, { fontSize: 18 }]}>RangRiti</Text>
                <Text style={styles.brandHindi}>रंगरीति</Text>
              </View>
              <Text style={styles.footerTag}>
                {H("India's mehndi artist marketplace — made with ❤️ in Rajasthan.", "भारत का मेहंदी आर्टिस्ट मार्केटप्लेस — राजस्थान में ❤️ से बना।")}
              </Text>
            </View>
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={goCustomer}><Text style={styles.footerLink}>{H("Customer Login", "ग्राहक लॉगिन")}</Text></TouchableOpacity>
              <TouchableOpacity onPress={goArtist}><Text style={styles.footerLink}>{H("Artist Login", "आर्टिस्ट लॉगिन")}</Text></TouchableOpacity>
              <TouchableOpacity onPress={goRegister}><Text style={styles.footerLink}>{H("Become an Artist", "आर्टिस्ट बनें")}</Text></TouchableOpacity>
              {IS_WEB && (
                <TouchableOpacity onPress={downloadApp} style={styles.footerDownloadBtn}>
                  <Ionicons name="logo-android" size={15} color="#3DDC84" />
                  <Text style={styles.footerDownloadText}>{H("Download Android App", "एंड्रॉइड ऐप डाउनलोड करें")}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={[styles.section, styles.footerBottom]}>
            <Text style={styles.footerFine}>
              © 2026 RangRiti · {H("By continuing you agree to our Terms of Service & Privacy Policy", "आगे बढ़ने पर आप हमारी शर्तों और गोपनीयता नीति से सहमत हैं")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  section: { width: "100%", maxWidth: 1120, alignSelf: "center", paddingHorizontal: 20 },

  /* Nav */
  nav: { backgroundColor: DARK, paddingBottom: 14 },
  navInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandLogo: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(201,147,47,0.15)", borderWidth: 1, borderColor: "rgba(201,147,47,0.45)", alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 20, fontFamily: "Poppins_700Bold", color: CREAM, letterSpacing: 0.5 },
  brandHindi: { fontSize: 12, fontFamily: "Poppins_500Medium", color: GOLD, marginTop: 2 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  langChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(255,248,240,0.35)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  langChipText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: CREAM },
  navGhostBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  navGhostText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: PINK_LIGHT },
  navCta: { backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  navCtaText: { fontSize: 13, fontFamily: "Poppins_700Bold", color: "#fff" },

  /* Hero */
  hero: { paddingVertical: 40 },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroCopy: { marginBottom: 28 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(201,147,47,0.14)", borderWidth: 1, borderColor: "rgba(201,147,47,0.4)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 18 },
  heroBadgeText: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: GOLD, letterSpacing: 0.8 },
  heroTitle: { fontSize: 32, lineHeight: 42, fontFamily: "Poppins_700Bold", color: CREAM, marginBottom: 14 },
  heroSub: { fontSize: 14, lineHeight: 23, fontFamily: "Poppins_400Regular", color: "rgba(253,248,241,0.82)", marginBottom: 24, maxWidth: 560 },
  heroCtaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 22 },
  heroCtaShadow: { borderRadius: 14, shadowColor: GOLD, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  heroCtaPrimary: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14 },
  heroCtaPrimaryText: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#fff" },
  heroCtaSecondary: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1.5, borderColor: "rgba(249,170,191,0.5)" },
  heroCtaSecondaryText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: PINK_LIGHT },
  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  trustChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,248,240,0.08)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  trustChipText: { fontSize: 11.5, fontFamily: "Poppins_500Medium", color: "rgba(253,248,241,0.9)" },
  downloadPill: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginTop: 16, borderWidth: 1.2, borderColor: "rgba(61,220,132,0.45)", backgroundColor: "rgba(61,220,132,0.08)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  downloadPillText: { fontSize: 12.5, fontFamily: "Poppins_600SemiBold", color: CREAM },

  heroVisual: { position: "relative" },
  heroImageWrap: { borderRadius: 24, overflow: "hidden", aspectRatio: 4 / 3, borderWidth: 1.5, borderColor: "rgba(201,147,47,0.35)" },
  heroImage: { width: "100%", height: "100%" },
  heroImageLabel: { position: "absolute", bottom: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(26,10,14,0.65)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  heroImageLabelText: { fontSize: 11, fontFamily: "Poppins_500Medium", color: CREAM },
  floatCard: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  floatCardTop: { top: -14, right: 6 },
  floatCardBottom: { bottom: -14, left: 6 },
  floatIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  floatTitle: { fontSize: 12, fontFamily: "Poppins_700Bold", color: INK },
  floatSub: { fontSize: 10, fontFamily: "Poppins_400Regular", color: MUTED },

  /* Stats */
  statsStrip: { backgroundColor: DARK, borderTopWidth: 1, borderTopColor: "rgba(201,147,47,0.25)", paddingVertical: 22 },
  statsInner: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", rowGap: 18 },
  statItem: { alignItems: "center", minWidth: 140 },
  statBig: { fontSize: 26, fontFamily: "Poppins_700Bold", color: GOLD },
  statSmall: { fontSize: 11.5, fontFamily: "Poppins_500Medium", color: "rgba(253,248,241,0.75)", textAlign: "center", marginTop: 2 },

  /* Generic blocks */
  block: { paddingVertical: 48 },
  kicker: { fontSize: 12, fontFamily: "Poppins_700Bold", color: GOLD_DARK, letterSpacing: 2, marginBottom: 8, textAlign: "center" },
  blockTitle: { fontSize: 26, lineHeight: 34, fontFamily: "Poppins_700Bold", color: INK, textAlign: "center", marginBottom: 32 },
  softBand: { backgroundColor: BLUSH },

  /* Styles gallery */
  stylesRow: { flexDirection: "row", gap: 16, justifyContent: "center", flexWrap: "wrap" },
  styleCard: { flexGrow: 1, flexBasis: 280, maxWidth: 420, aspectRatio: 4 / 3.4, borderRadius: 20, overflow: "hidden", position: "relative" },
  styleImg: { width: "100%", height: "100%" },
  styleCardBody: { position: "absolute", left: 16, right: 16, bottom: 14 },
  styleCardTitle: { fontSize: 19, fontFamily: "Poppins_700Bold", color: "#fff" },
  styleCardSub: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.85)", marginTop: 2 },
  styleCardCta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  styleCardCtaText: { fontSize: 12.5, fontFamily: "Poppins_600SemiBold", color: GOLD },

  /* Steps */
  stepsRow: { flexDirection: "row", gap: 16, justifyContent: "center" },
  stepCard: { flex: 1, minWidth: 240, backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#F5D0DC", position: "relative" },
  stepNumWrap: { position: "absolute", top: 14, right: 16, width: 26, height: 26, borderRadius: 13, backgroundColor: BLUSH, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 13, fontFamily: "Poppins_700Bold", color: PINK },
  stepIconWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: BLUSH, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  stepTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", color: INK, marginBottom: 8, textAlign: "center" },
  stepSub: { fontSize: 12.5, lineHeight: 19, fontFamily: "Poppins_400Regular", color: MUTED, textAlign: "center" },

  /* Features */
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" },
  featureCard: { backgroundColor: "#fff", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "#F5D0DC" },
  featureIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(201,147,47,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  featureTitle: { fontSize: 14.5, fontFamily: "Poppins_700Bold", color: INK, marginBottom: 6 },
  featureSub: { fontSize: 12, lineHeight: 18, fontFamily: "Poppins_400Regular", color: MUTED },

  /* Artist band */
  artistBand: { paddingVertical: 44 },
  artistBandKicker: { fontSize: 11, fontFamily: "Poppins_700Bold", color: "rgba(255,248,240,0.85)", letterSpacing: 2, marginBottom: 8 },
  artistBandTitle: { fontSize: 26, lineHeight: 34, fontFamily: "Poppins_700Bold", color: "#fff", marginBottom: 10 },
  artistBandSub: { fontSize: 13.5, lineHeight: 21, fontFamily: "Poppins_400Regular", color: "rgba(255,248,240,0.9)", maxWidth: 560, marginBottom: 16 },
  artistPerksRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 8 },
  artistPerk: { flexDirection: "row", alignItems: "center", gap: 6 },
  artistPerkText: { fontSize: 12.5, fontFamily: "Poppins_600SemiBold", color: "#FFF8F0" },
  artistBandBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFF8F0", borderRadius: 14, paddingHorizontal: 22, paddingVertical: 15, alignSelf: "flex-start", marginTop: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  artistBandBtnText: { fontSize: 14.5, fontFamily: "Poppins_700Bold", color: GOLD_DARK },

  /* Testimonials */
  testiRow: { flexDirection: "row", gap: 16, justifyContent: "center" },
  testiCard: { flex: 1, minWidth: 250, backgroundColor: "#fff", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "#F5D0DC" },
  testiStars: { flexDirection: "row", gap: 2, marginBottom: 12 },
  testiQuote: { fontSize: 13, lineHeight: 21, fontFamily: "Poppins_400Regular", color: INK, fontStyle: "italic", marginBottom: 16 },
  testiWho: { flexDirection: "row", alignItems: "center", gap: 10 },
  testiAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: BLUSH, alignItems: "center", justifyContent: "center" },
  testiName: { fontSize: 12.5, fontFamily: "Poppins_600SemiBold", color: MUTED },

  /* FAQ */
  faqCard: { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 10, borderWidth: 1, borderColor: "#F5D0DC" },
  faqHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontFamily: "Poppins_600SemiBold", color: INK },
  faqA: { fontSize: 12.5, lineHeight: 20, fontFamily: "Poppins_400Regular", color: MUTED, marginTop: 10 },

  /* Final CTA */
  finalCta: { paddingVertical: 52 },
  finalCtaTitle: { fontSize: 24, lineHeight: 32, fontFamily: "Poppins_700Bold", color: CREAM, textAlign: "center", marginTop: 14, marginBottom: 8, maxWidth: 640 },
  finalCtaSub: { fontSize: 13.5, fontFamily: "Poppins_400Regular", color: "rgba(253,248,241,0.8)", textAlign: "center", marginBottom: 24 },
  finalCtaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },

  /* Footer */
  footer: { backgroundColor: DARK, paddingTop: 36 },
  footerTag: { fontSize: 12.5, fontFamily: "Poppins_400Regular", color: "rgba(253,248,241,0.6)", marginTop: 10, maxWidth: 380, lineHeight: 19 },
  footerLinks: { gap: 10 },
  footerLink: { fontSize: 13.5, fontFamily: "Poppins_600SemiBold", color: PINK_LIGHT },
  footerDownloadBtn: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4, borderWidth: 1, borderColor: "rgba(61,220,132,0.4)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start" },
  footerDownloadText: { fontSize: 12.5, fontFamily: "Poppins_600SemiBold", color: "#3DDC84" },
  footerBottom: { borderTopWidth: 1, borderTopColor: "rgba(253,248,241,0.12)", marginTop: 28, paddingTop: 18 },
  footerFine: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "rgba(253,248,241,0.45)", textAlign: "center" },
});
