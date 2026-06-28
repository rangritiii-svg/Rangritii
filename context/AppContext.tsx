import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState, useMemo, useRef } from "react";
import { Language } from "@/constants/locale";
import {
  fetchArtists, saveArtist, updateArtist as fsUpdateArtist,
  fetchCustomers, saveCustomer, updateCustomer as fsUpdateCustomer,
  saveBooking, updateBooking as fsUpdateBooking,
  fetchAdminSettings, saveAdminSettings,
  subscribeToCustomerBookings, subscribeToArtistBookings, subscribeToAllBookings,
} from "@/firebase/firestoreService";

export interface ArtistPackage {
  id: string;
  nameEn: string;
  nameHi: string;
  descriptionEn: string;
  descriptionHi: string;
  price: number;
  durationHours: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  occasion: string;
}

export interface Artist {
  id: string;
  name: string;
  city: string;
  state: string;
  area: string;
  rating: number;
  reviewCount: number;
  styles: string[];
  minPrice: number;
  maxPrice: number;
  hourlyRate: number;
  experience: number;
  verified: boolean;
  bio: string;
  bioHi: string; // added for Hindi support
  availability: "Available" | "Busy";
  portfolioStyle: "bridal" | "arabic" | "traditional" | "modern";
  reviews: Review[];
  phone: string; // hidden from customers
  specialization: string;
  latitude: number;
  longitude: number;
  status: "Pending" | "Approved" | "Rejected" | "Blocked" | "NeedsDocuments";
  isActive: boolean;
  missingDocsReason?: string;
  packages: ArtistPackage[]; // added packages
  strikes: number; // added strikes tracking
  portfolioImages?: string[]; // custom portfolio images uploaded by artist
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  state: string;
  city: string;
  area: string;
  isActive: boolean;
  createdAt: string;
}

export interface CancellationPolicy {
  version: number;
  tier1Hours: number; // e.g. 24
  tier2Hours: number; // e.g. 6
  tier2RefundPercent: number; // e.g. 50 (50% to customer)
  tier2ArtistCompPercent: number; // e.g. 25 (25% to artist)
  tier3RefundPercent: number; // e.g. 0 (0% to customer)
  tier3ArtistCompPercent: number; // e.g. 50 (50% to artist)
}

export interface Booking {
  id: string;
  artistId: string;
  artistName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  occasion: string;
  price: number;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  paymentMethod: "online" | "cash" | "pending";
  paymentStatus: "paid" | "unpaid" | "commission_due";
  commissionAmount: number;
  paymentLink?: string;
  notes: string;
  createdAt: string;
  // Phase 2 props:
  commissionPercentApplied: number;
  policyApplied: CancellationPolicy;
  cancellationRefundAmount?: number;
  cancellationArtistComp?: number;
  cancellationInitiator?: "customer" | "artist";
  disputeReason?: string;
  disputeStatus?: "Open" | "Resolved";
  disputeRefundAmount?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: "user" | "artist";
  timestamp: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  state: string;
  city: string;
  area: string;
  role: "customer" | "artist" | "admin" | null;
}

export interface CommissionLog {
  id: string;
  timestamp: string;
  oldPercent: number;
  newPercent: number;
  dateEffective: string;
}

export interface PolicyLog {
  id: string;
  timestamp: string;
  policy: CancellationPolicy;
}

export interface AdminStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  totalArtists: number;
  totalCustomers: number;
  pendingApprovals: number;
}

// ── No mock data — all artists, customers, bookings come from Firebase Firestore ──

const MOCK_ARTIST_REPLIES = [
  "Thank you for reaching out! I'd love to create something beautiful for you.",
  "Of course! I'm available on that date. Let me know the occasion.",
  "My rates start from ₹2,500 depending on the design complexity.",
  "I'll send you portfolio photos. What style do you prefer?",
  "Thank you! Please book through the app to confirm your slot.",
];


export const ADMIN_UPI_ID = "rangritii.admin@upi";

const DEFAULT_POLICY: CancellationPolicy = {
  version: 1,
  tier1Hours: 24,
  tier2Hours: 6,
  tier2RefundPercent: 50,
  tier2ArtistCompPercent: 25,
  tier3RefundPercent: 0,
  tier3ArtistCompPercent: 50,
};

interface AppContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  artists: Artist[];
  customers: Customer[];
  bookings: Booking[];
  favorites: string[];
  chatMessages: Record<string, ChatMessage[]>;
  commissionPercent: number;
  commissionLogs: CommissionLog[];
  cancellationPolicy: CancellationPolicy;
  policyLogs: PolicyLog[];
  updateCommissionPercent: (newVal: number) => Promise<void>;
  updateCancellationPolicy: (policy: CancellationPolicy) => Promise<void>;
  toggleFavorite: (artistId: string) => void;
  addBooking: (booking: Omit<Booking, "id" | "createdAt" | "commissionAmount" | "commissionPercentApplied" | "policyApplied">) => string;
  updateBookingStatus: (bookingId: string, status: Booking["status"], paymentMethod?: Booking["paymentMethod"]) => void;
  updatePaymentStatus: (bookingId: string, paymentStatus: Booking["paymentStatus"]) => void;
  cancelBooking: (bookingId: string, initiator: "customer" | "artist") => void;
  raiseBookingDispute: (bookingId: string, reason: string) => void;
  resolveBookingDispute: (bookingId: string, refundCustomer: boolean) => void;
  sendMessage: (artistId: string, text: string) => void;
  getArtistById: (id: string) => Artist | undefined;
  getBookingById: (id: string) => Booking | undefined;
  getArtistBookings: (artistId: string) => Booking[];
  updateArtistStatus: (artistId: string, status: Artist["status"], missingDocsReason?: string) => void;
  toggleUserActiveStatus: (userId: string, isArtist: boolean) => void;
  registerNewArtist: (artist: Omit<Artist, "id" | "rating" | "reviewCount" | "reviews" | "status" | "isActive" | "latitude" | "longitude" | "packages" | "strikes">) => string;
  updateArtistPackages: (artistId: string, packages: ArtistPackage[]) => void;
  addCustomer: (customer: Omit<Customer, "id" | "isActive" | "createdAt">) => void;
  updateBookingPaymentLink: (bookingId: string, paymentLink: string) => void;
  adminStats: AdminStats;
  adminPasscode: string;
  updateAdminPasscode: (newPasscode: string) => Promise<void>;
  adminUpiId: string;
  adminQrCodeUrl: string;
  updateAdminUpiId: (newUpi: string) => Promise<void>;
  updateAdminQrCodeUrl: (newQrUrl: string) => Promise<void>;
  adminPhone: string;
  adminEmail: string;
  updateAdminPhone: (phone: string) => Promise<void>;
  updateAdminEmail: (email: string) => Promise<void>;
  globalNotification: { visible: boolean; title: string; body: string; type: "info" | "success" | "warning" };
  triggerNotification: (title: string, body: string, type?: "info" | "success" | "warning") => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfileState] = useState<UserProfile>({ name: "", phone: "", state: "", city: "", area: "", role: null });
  const [language, setLanguageState] = useState<Language>("en_IN");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [artists, setArtists] = useState<Artist[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Platform settings states
  const [commissionPercent, setCommissionPercent] = useState<number>(15);
  const [commissionLogs, setCommissionLogs] = useState<CommissionLog[]>([]);
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>(DEFAULT_POLICY);
  const [policyLogs, setPolicyLogs] = useState<PolicyLog[]>([]);
  const [adminPasscode, setAdminPasscode] = useState<string>("000000");
  const [adminUpiId, setAdminUpiId] = useState<string>("rangritii.admin@upi");
  const [adminQrCodeUrl, setAdminQrCodeUrl] = useState<string>("");
  const [adminPhone, setAdminPhone] = useState<string>("+91 99999 88888");
  const [adminEmail, setAdminEmail] = useState<string>("support@rangritii.com");

  // Global notification toast
  const [globalNotification, setGlobalNotification] = useState<{ visible: boolean; title: string; body: string; type: "info" | "success" | "warning" }>({
    visible: false, title: "", body: "", type: "info"
  });
  const triggerNotification = useCallback((title: string, body: string, type: "info" | "success" | "warning" = "info") => {
    setGlobalNotification({ visible: true, title, body, type });
    setTimeout(() => setGlobalNotification((prev) => ({ ...prev, visible: false })), 6000);
  }, []);

  const [loaded, setLoaded] = useState(false);

  // ── Load from Firestore + AsyncStorage on startup ──────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [profileStr, langStr, favoritesStr, chatStr, commPercentStr, commLogsStr, policyStr, policyLogsStr, passcodeStr, upiIdStr, qrUrlStr, phoneStr, emailStr] = await Promise.all([
          AsyncStorage.getItem("rangritii_profile"),
          AsyncStorage.getItem("rangritii_language"),
          AsyncStorage.getItem("rangritii_favorites"),
          AsyncStorage.getItem("rangritii_chat"),
          AsyncStorage.getItem("rangritii_comm_percent"),
          AsyncStorage.getItem("rangritii_comm_logs"),
          AsyncStorage.getItem("rangritii_policy"),
          AsyncStorage.getItem("rangritii_policy_logs"),
          AsyncStorage.getItem("rangritii_admin_passcode"),
          AsyncStorage.getItem("rangritii_admin_upi"),
          AsyncStorage.getItem("rangritii_admin_qr"),
          AsyncStorage.getItem("rangritii_admin_phone"),
          AsyncStorage.getItem("rangritii_admin_email"),
        ]);

        if (profileStr) setUserProfileState(JSON.parse(profileStr));
        if (langStr) setLanguageState(langStr as Language);
        if (favoritesStr) setFavorites(JSON.parse(favoritesStr));
        if (chatStr) setChatMessages(JSON.parse(chatStr));
        if (passcodeStr) setAdminPasscode(passcodeStr);
        if (upiIdStr) setAdminUpiId(upiIdStr);
        if (qrUrlStr) setAdminQrCodeUrl(qrUrlStr);
        if (phoneStr) setAdminPhone(phoneStr);
        if (emailStr) setAdminEmail(emailStr);
        if (commPercentStr) setCommissionPercent(parseInt(commPercentStr));
        if (commLogsStr) setCommissionLogs(JSON.parse(commLogsStr));
        if (policyStr) setCancellationPolicy(JSON.parse(policyStr));
        if (policyLogsStr) setPolicyLogs(JSON.parse(policyLogsStr));

        // Load admin settings from Firestore (passcode, commission override, UPI ID, QR code, contact details)
        const adminSettings = await fetchAdminSettings();
        if (adminSettings) {
          if (adminSettings.passcode) setAdminPasscode(adminSettings.passcode);
          if (adminSettings.commissionPercent) setCommissionPercent(adminSettings.commissionPercent);
          if (adminSettings.upiId) setAdminUpiId(adminSettings.upiId);
          if (adminSettings.qrCodeUrl) setAdminQrCodeUrl(adminSettings.qrCodeUrl);
          if (adminSettings.phone) setAdminPhone(adminSettings.phone);
          if (adminSettings.email) setAdminEmail(adminSettings.email);
        }

        // Load artists from Firestore (real data only — no mock data)
        const firestoreArtists = await fetchArtists();
        setArtists(firestoreArtists as Artist[]);

        // Load customers from Firestore
        const firestoreCustomers = await fetchCustomers();
        setCustomers(firestoreCustomers as Customer[]);

      } catch (_e) { console.warn("AppContext load error:", _e); }
      setLoaded(true);
    };
    load();
  }, []);

  const setUserProfile = useCallback(async (partial: Partial<UserProfile>) => {
    setUserProfileState((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem("rangritii_profile", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem("rangritii_language", lang).catch(() => {});
  }, []);

  const updateCommissionPercent = useCallback(async (newVal: number) => {
    setCommissionPercent((oldVal) => {
      const logEntry: CommissionLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        oldPercent: oldVal,
        newPercent: newVal,
        dateEffective: new Date().toLocaleDateString(),
      };
      setCommissionLogs((prevLogs) => {
        const nextLogs = [logEntry, ...prevLogs];
        AsyncStorage.setItem("rangritii_comm_logs", JSON.stringify(nextLogs)).catch(() => {});
        return nextLogs;
      });
      AsyncStorage.setItem("rangritii_comm_percent", newVal.toString()).catch(() => {});
      return newVal;
    });
  }, []);

  const updateCancellationPolicy = useCallback(async (policy: CancellationPolicy) => {
    const nextPolicy = { ...policy, version: policy.version + 1 };
    setCancellationPolicy(nextPolicy);
    await AsyncStorage.setItem("rangritii_policy", JSON.stringify(nextPolicy)).catch(() => {});
    
    const logEntry: PolicyLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      policy: nextPolicy,
    };
    setPolicyLogs((prev) => {
      const next = [logEntry, ...prev];
      AsyncStorage.setItem("rangritii_policy_logs", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((artistId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(artistId) ? prev.filter((id) => id !== artistId) : [...prev, artistId];
      AsyncStorage.setItem("rangritii_favorites", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const addBooking = useCallback((bookingData: Omit<Booking, "id" | "createdAt" | "commissionAmount" | "commissionPercentApplied" | "policyApplied">): string => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const commAmt = Math.round(bookingData.price * (commissionPercent / 100));
    
    const newBooking: Booking = {
      ...bookingData,
      id,
      createdAt: new Date().toISOString(),
      commissionPercentApplied: commissionPercent,
      commissionAmount: commAmt,
      policyApplied: cancellationPolicy,
      paymentStatus: "unpaid",
    };
    
    setBookings((prev) => [newBooking, ...prev]);

    // Save to Firestore (cloud) so artist and admin can see it
    saveBooking(id, newBooking).catch((e) => console.warn("saveBooking error:", e));

    // Trigger booking request notification to customer
    setTimeout(() => {
      const isHindi = language === "hi_IN";
      triggerNotification(
        isHindi ? "💖 बुकिंग अनुरोध प्राप्त हुआ!" : "💖 Booking Request Received!",
        isHindi 
          ? `धन्यवाद! ${bookingData.artistName} के साथ आपका बुकिंग अनुरोध जमा हो गया है।`
          : `Thank you! Your booking request with ${bookingData.artistName} has been submitted.`,
        "success"
      );
    }, 500);

    return id;
  }, [commissionPercent, cancellationPolicy, triggerNotification, language]);

  const updateBookingStatus = useCallback((bookingId: string, status: Booking["status"], paymentMethod?: Booking["paymentMethod"]) => {
    setBookings((prev) => {
      const next = prev.map((b) => {
        if (b.id === bookingId) {
          if (status === "Confirmed") {
            setTimeout(() => {
              const isHindi = language === "hi_IN";
              const isArtist = userProfile.role === "artist";
              const isAdmin = userProfile.role === "admin";
              
              let title = isHindi ? "📅 बुकिंग की पुष्टि हो गई!" : "📅 Booking Confirmed!";
              let body = "";
              
              if (isArtist) {
                body = isHindi 
                  ? `आपको ${b.customerName} द्वारा ${b.occasion} के लिए ${b.date} को बुक किया गया है।`
                  : `You have been booked by ${b.customerName} for ${b.occasion} on ${b.date}.`;
              } else if (isAdmin) {
                body = isHindi
                  ? `${b.customerName} की ${b.artistName} के साथ बुकिंग की पुष्टि हो गई है।`
                  : `${b.customerName}'s booking with ${b.artistName} is confirmed.`;
              } else {
                // Customer
                title = isHindi ? "🎉 बुकिंग की पुष्टि हो गई!" : "🎉 Booking Confirmed!";
                body = isHindi
                  ? `बुक करने के लिए धन्यवाद! ${b.artistName} के साथ आपका सत्र सुनिश्चित हो गया है।`
                  : `Thank you for booking! Your session with ${b.artistName} has been confirmed.`;
              }

              triggerNotification(title, body, "success");
            }, 500);
          }
          return { ...b, status, ...(paymentMethod ? { paymentMethod } : {}) };
        }
        return b;
      });
      return next;
    });
    // Sync status update to Firestore
    const updates: any = { status };
    if (paymentMethod) updates.paymentMethod = paymentMethod;
    fsUpdateBooking(bookingId, updates).catch((e) => console.warn("updateBookingStatus Firestore error:", e));
  }, [triggerNotification, language, userProfile.role]);

  const updatePaymentStatus = useCallback((bookingId: string, paymentStatus: Booking["paymentStatus"]) => {
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, paymentStatus } : b));
    fsUpdateBooking(bookingId, { paymentStatus }).catch((e) => console.warn("updatePaymentStatus Firestore error:", e));
  }, []);

  const cancelBooking = useCallback((bookingId: string, initiator: "customer" | "artist") => {
    setBookings((prev) => {
      const next = prev.map((b) => {
        if (b.id !== bookingId) return b;
        
        let refund = b.price;
        let artistComp = 0;
        
        if (initiator === "customer") {
          // Calculate cancellation policy windows
          const bookingDate = new Date(b.date + " " + b.startTime.replace(" PM", " PM").replace(" AM", " AM"));
          const now = new Date();
          const diffMs = bookingDate.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          
          const policy = b.policyApplied;
          if (diffHours >= policy.tier1Hours) {
            // Tier 1: 100% refund, 0 compensation to artist
            refund = b.price;
            artistComp = 0;
          } else if (diffHours >= policy.tier2Hours) {
            // Tier 2: 50% refund, 25% artist compensation, platform keeps commission
            refund = Math.round(b.price * (policy.tier2RefundPercent / 100));
            artistComp = Math.round(b.price * (policy.tier2ArtistCompPercent / 100));
          } else {
            // Tier 3: 0% refund, 50% artist compensation, platform keeps commission
            refund = Math.round(b.price * (policy.tier3RefundPercent / 100));
            artistComp = Math.round(b.price * (policy.tier3ArtistCompPercent / 100));
          }
        } else {
          // Artist cancelled: 100% refund to customer
          refund = b.price;
          artistComp = 0;
          
          // Increment strikes for the artist
          setArtists((prevArtists) => {
            const nextArtists = prevArtists.map(a => {
              if (a.id !== b.artistId) return a;
              const nextStrikes = (a.strikes || 0) + 1;
              return { ...a, strikes: nextStrikes, status: nextStrikes >= 3 ? ("Blocked" as const) : a.status };
            });
            AsyncStorage.setItem("rangritii_artists", JSON.stringify(nextArtists)).catch(() => {});
            return nextArtists;
          });
        }

        // Net payout amount
        const netPayout = b.status === "Completed" ? (b.price - b.commissionAmount) : artistComp;

        return {
          ...b,
          status: "Cancelled" as const,
          cancellationInitiator: initiator,
          cancellationRefundAmount: refund,
          cancellationArtistComp: artistComp,
          payoutAmount: netPayout,
          paymentStatus: initiator === "customer" && refund < b.price ? ("commission_due" as const) : ("unpaid" as const),
        };
      });
      AsyncStorage.setItem("rangritii_bookings", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const raiseBookingDispute = useCallback((bookingId: string, reason: string) => {
    setBookings((prev) => {
      const next = prev.map((b) =>
        b.id === bookingId
          ? { ...b, disputeReason: reason, disputeStatus: "Open" as const }
          : b
      );
      AsyncStorage.setItem("rangritii_bookings", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resolveBookingDispute = useCallback((bookingId: string, refundCustomer: boolean) => {
    setBookings((prev) => {
      const next = prev.map((b) => {
        if (b.id !== bookingId) return b;
        
        let refundAmt = 0;
        let payStatus = b.paymentStatus;
        if (refundCustomer) {
          refundAmt = b.price + b.commissionAmount; // total paid refund
          payStatus = "unpaid" as const;
        }
        
        return {
          ...b,
          disputeStatus: "Resolved" as const,
          disputeRefundAmount: refundAmt,
          status: refundCustomer ? ("Cancelled" as const) : b.status,
          paymentStatus: payStatus,
        };
      });
      AsyncStorage.setItem("rangritii_bookings", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const sendMessage = useCallback((artistId: string, text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), text, senderId: "user", timestamp: new Date().toISOString() };
    setChatMessages((prev) => {
      const withUser = [...(prev[artistId] ?? []), userMsg];
      const artistReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: MOCK_ARTIST_REPLIES[Math.floor(Math.random() * MOCK_ARTIST_REPLIES.length)],
        senderId: "artist",
        timestamp: new Date(Date.now() + 2000).toISOString(),
      };
      setTimeout(() => {
        setChatMessages((prev2) => {
          const next = { ...prev2, [artistId]: [...(prev2[artistId] ?? []), artistReply] };
          AsyncStorage.setItem("rangritii_chat", JSON.stringify(next)).catch(() => {});
          return next;
        });
      }, 1500);
      const next = { ...prev, [artistId]: withUser };
      AsyncStorage.setItem("rangritii_chat", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const getArtistById = useCallback((id: string) => artists.find((a) => a.id === id), [artists]);
  const getBookingById = useCallback((id: string) => bookings.find((b) => b.id === id), [bookings]);
  const getArtistBookings = useCallback((artistId: string) => bookings.filter((b) => b.artistId === artistId), [bookings]);

  const updateArtistStatus = useCallback((artistId: string, status: Artist["status"], missingDocsReason?: string) => {
    const updates: any = { status };
    if (status === "Approved") updates.strikes = 0;
    if (missingDocsReason) updates.missingDocsReason = missingDocsReason;
    setArtists((prev) => prev.map((a) =>
      a.id === artistId ? { ...a, ...updates } : a
    ));
    fsUpdateArtist(artistId, updates).catch((e) => console.warn("updateArtistStatus Firestore error:", e));
  }, []);

  const toggleUserActiveStatus = useCallback((userId: string, isArtist: boolean) => {
    if (isArtist) {
      setArtists((prev) => {
        const updated = prev.map((a) => a.id === userId ? { ...a, isActive: !a.isActive } : a);
        const artist = updated.find(a => a.id === userId);
        if (artist) fsUpdateArtist(userId, { isActive: artist.isActive }).catch(() => {});
        return updated;
      });
    } else {
      setCustomers((prev) => {
        const updated = prev.map((c) => c.id === userId ? { ...c, isActive: !c.isActive } : c);
        const customer = updated.find(c => c.id === userId);
        if (customer) fsUpdateCustomer(userId, { isActive: customer.isActive }).catch(() => {});
        return updated;
      });
    }
  }, []);

  const registerNewArtist = useCallback((artistData: Omit<Artist, "id" | "rating" | "reviewCount" | "reviews" | "status" | "isActive" | "latitude" | "longitude" | "packages" | "strikes">) => {
    const id = "a" + (Date.now() + Math.round(Math.random() * 1000)).toString().substring(8);
    const newArtist: Artist = {
      ...artistData,
      id,
      rating: 5.0,
      reviewCount: 0,
      reviews: [],
      status: "Pending",
      isActive: true,
      latitude: 19.1 + Math.random() * 0.1,
      longitude: 72.8 + Math.random() * 0.1,
      strikes: 0,
      packages: [
        {
          id: `p_${id}_1`,
          nameEn: "Bridal Full Hands",
          nameHi: "दुल्हन पूरे हाथ",
          descriptionEn: "Intricate bridal mehndi up to elbows",
          descriptionHi: "कोहनी तक सुंदर और विस्तृत दुल्हन मेहंदी",
          price: artistData.hourlyRate * 4,
          durationHours: 4
        },
        {
          id: `p_${id}_2`,
          nameEn: "Arabic Minimalist",
          nameHi: "अरेबिक न्यूनतम",
          descriptionEn: "Elegant back hand trailing patterns",
          descriptionHi: "हाथ के पीछे सुंदर अरेबिक डिज़ाइन बेल",
          price: artistData.hourlyRate * 2,
          durationHours: 2
        },
        {
          id: `p_${id}_3`,
          nameEn: "Full Day Package",
          nameHi: "पूरे दिन का पैकेज",
          descriptionEn: "Complete day booking for large functions/weddings (up to 8 hours)",
          descriptionHi: "बड़े कार्यक्रमों/शादियों के लिए पूरे दिन की बुकिंग (8 घंटे तक)",
          price: artistData.hourlyRate * 8,
          durationHours: 8
        }
      ]
    };
    setArtists((prev) => {
      const next = [...prev, newArtist];
      AsyncStorage.setItem("rangritii_artists", JSON.stringify(next)).catch(() => {});
      return next;
    });
    return id;
  }, []);

  const updateArtistPackages = useCallback((artistId: string, updatedPackages: ArtistPackage[]) => {
    setArtists((prev) => prev.map(a => a.id === artistId ? { ...a, packages: updatedPackages } : a));
    fsUpdateArtist(artistId, { packages: updatedPackages }).catch((e) => console.warn("updateArtistPackages Firestore error:", e));
  }, []);

  const addCustomer = useCallback((customerData: Omit<Customer, "id" | "isActive" | "createdAt">) => {
    setCustomers((prev) => {
      if (prev.some(c => c.phone === customerData.phone)) return prev;
      const id = "c" + (Date.now() + Math.round(Math.random() * 1000)).toString().substring(8);
      const newCustomer: Customer = {
        ...customerData,
        id,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      // Save to Firestore so admin can see new customers
      saveCustomer(id, newCustomer).catch((e) => console.warn("addCustomer Firestore error:", e));
      return [...prev, newCustomer];
    });
  }, []);

  const updateBookingPaymentLink = useCallback((bookingId: string, paymentLink: string) => {
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, paymentLink } : b));
    fsUpdateBooking(bookingId, { paymentLink }).catch((e) => console.warn("updateBookingPaymentLink Firestore error:", e));
  }, []);

  const adminStats: AdminStats = useMemo(() => ({
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === "Confirmed" || b.status === "Completed").length,
    pendingBookings: bookings.filter(b => b.status === "Pending").length,
    totalRevenue: bookings.filter(b => b.status === "Confirmed" || b.status === "Completed").reduce((s, b) => s + b.price, 0),
    totalCommission: bookings.filter(b => b.status === "Confirmed" || b.status === "Completed").reduce((s, b) => s + b.commissionAmount, 0),
    pendingCommission: bookings.filter(b => b.paymentStatus === "commission_due").reduce((s, b) => s + b.commissionAmount, 0),
    totalArtists: artists.length,
    totalCustomers: customers.length,
    pendingApprovals: artists.filter(a => a.status === "Pending").length,
  }), [bookings, artists, customers]);

  const updateAdminPasscode = useCallback(async (newPasscode: string) => {
    setAdminPasscode(newPasscode);
    await AsyncStorage.setItem("rangritii_admin_passcode", newPasscode);
    // Sync to Firestore so it persists across devices
    saveAdminSettings({ passcode: newPasscode }).catch((e) => console.warn("updateAdminPasscode Firestore error:", e));
  }, []);

  const updateAdminUpiId = useCallback(async (newUpi: string) => {
    setAdminUpiId(newUpi);
    await AsyncStorage.setItem("rangritii_admin_upi", newUpi);
    saveAdminSettings({ upiId: newUpi }).catch((e) => console.warn("updateAdminUpiId Firestore error:", e));
  }, []);

  const updateAdminQrCodeUrl = useCallback(async (newQrUrl: string) => {
    setAdminQrCodeUrl(newQrUrl);
    await AsyncStorage.setItem("rangritii_admin_qr", newQrUrl);
    saveAdminSettings({ qrCodeUrl: newQrUrl }).catch((e) => console.warn("updateAdminQrCodeUrl Firestore error:", e));
  }, []);

  const updateAdminPhone = useCallback(async (newPhone: string) => {
    setAdminPhone(newPhone);
    await AsyncStorage.setItem("rangritii_admin_phone", newPhone);
    saveAdminSettings({ phone: newPhone }).catch((e) => console.warn("updateAdminPhone Firestore error:", e));
  }, []);

  const updateAdminEmail = useCallback(async (newEmail: string) => {
    setAdminEmail(newEmail);
    await AsyncStorage.setItem("rangritii_admin_email", newEmail);
    saveAdminSettings({ email: newEmail }).catch((e) => console.warn("updateAdminEmail Firestore error:", e));
  }, []);

  if (!loaded) return null;

  return (
    <AppContext.Provider value={{
      userProfile, setUserProfile, language, setLanguage, artists, customers, bookings, favorites, chatMessages,
      commissionPercent, commissionLogs, cancellationPolicy, policyLogs, updateCommissionPercent, updateCancellationPolicy,
      toggleFavorite, addBooking, updateBookingStatus, updatePaymentStatus, cancelBooking, raiseBookingDispute, resolveBookingDispute,
      sendMessage, getArtistById, getBookingById, getArtistBookings,
      updateArtistStatus, toggleUserActiveStatus, registerNewArtist, updateArtistPackages, addCustomer, updateBookingPaymentLink, adminStats,
      adminPasscode, updateAdminPasscode,
      adminUpiId, adminQrCodeUrl, updateAdminUpiId, updateAdminQrCodeUrl,
      adminPhone, adminEmail, updateAdminPhone, updateAdminEmail,
      globalNotification, triggerNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
