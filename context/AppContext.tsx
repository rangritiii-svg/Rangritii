import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react";
import { Language } from "@/constants/locale";

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

const MOCK_ARTISTS: Omit<Artist, "packages" | "strikes">[] = [
  {
    id: "a1", name: "Priya Sharma", city: "Mumbai", state: "Maharashtra", area: "Andheri West",
    rating: 4.9, reviewCount: 124, styles: ["Bridal", "Arabic"],
    minPrice: 3000, maxPrice: 15000, hourlyRate: 800, experience: 5, verified: true,
    bio: "Award-winning bridal mehndi artist with 5+ years of experience. Specializing in intricate bridal designs that tell a story.",
    bioHi: "5+ वर्षों के अनुभव के साथ पुरस्कार विजेता दुल्हन मेहंदी आर्टिस्ट। जटिल दुल्हन डिज़ाइनों में विशेषज्ञता जो एक कहानी बयां करती है।",
    availability: "Available", portfolioStyle: "bridal", phone: "+91 9876543210",
    specialization: "Bridal Mehndi Specialist",
    latitude: 19.1136, longitude: 72.8697,
    status: "Approved", isActive: true,
    reviews: [
      { id: "r1", userName: "Sneha P.", rating: 5, comment: "Absolutely stunning work! Priya did my bridal mehndi and it was beyond perfect.", date: "Dec 2024", occasion: "Wedding" },
    ],
  },
  {
    id: "a2", name: "Anjali Patel", city: "Delhi", state: "Delhi", area: "Karol Bagh",
    rating: 4.8, reviewCount: 89, styles: ["Arabic", "Modern"],
    minPrice: 2500, maxPrice: 12000, hourlyRate: 650, experience: 4, verified: true,
    bio: "Contemporary mehndi artist blending Arabic patterns with modern aesthetics.",
    bioHi: "आधुनिक सौंदर्यशास्त्र के साथ अरबी पैटर्न का मिश्रण करने वाली समकालीन मेहंदी आर्टिस्ट।",
    availability: "Available", portfolioStyle: "arabic", phone: "+91 9765432109",
    specialization: "Arabic & Modern Fusion",
    latitude: 28.6519, longitude: 77.1909,
    status: "Approved", isActive: true,
    reviews: [
      { id: "r4", userName: "Pooja S.", rating: 5, comment: "Anjali's Arabic designs are just wow!", date: "Jan 2025", occasion: "Wedding" },
    ],
  },
  {
    id: "a3", name: "Meera Joshi", city: "Jaipur", state: "Rajasthan", area: "Vaishali Nagar",
    rating: 4.7, reviewCount: 156, styles: ["Traditional", "Marwari"],
    minPrice: 1500, maxPrice: 8000, hourlyRate: 450, experience: 8, verified: true,
    bio: "Third-generation mehndi artist from Jaipur. Expert in traditional peacock and elephant motifs.",
    bioHi: "जयपुर की तीसरी पीढ़ी की मेहंदी आर्टिस्ट। पारंपरिक मोर और हाथी रूपांकनों में विशेषज्ञ।",
    availability: "Available", portfolioStyle: "traditional", phone: "+91 9654321098",
    specialization: "Traditional Marwari Mehndi",
    latitude: 26.9124, longitude: 75.7873,
    status: "Approved", isActive: true,
    reviews: [
      { id: "r6", userName: "Deepa N.", rating: 5, comment: "Authentic Marwari patterns. Meera ji is a true artist!", date: "Feb 2025", occasion: "Wedding" },
    ],
  },
  {
    id: "a4", name: "Fatima Khan", city: "Hyderabad", state: "Telangana", area: "Banjara Hills",
    rating: 4.9, reviewCount: 203, styles: ["Arabic", "Bridal", "Indo-Western"],
    minPrice: 3500, maxPrice: 18000, hourlyRate: 900, experience: 6, verified: true,
    bio: "Hyderabad's top bridal mehndi artist. Booked 6 months in advance for wedding season.",
    bioHi: "हैदराबाद की शीर्ष दुल्हन मेहंदी आर्टिस्ट। शादी के सीजन के लिए 6 महीने पहले से बुक।",
    availability: "Busy", portfolioStyle: "arabic", phone: "+91 9543210987",
    specialization: "Bridal & Arabic Fusion",
    latitude: 17.4126, longitude: 78.4484,
    status: "Approved", isActive: true,
    reviews: [
      { id: "r8", userName: "Zara B.", rating: 5, comment: "Fatima is a goddess with henna!", date: "Mar 2025", occasion: "Wedding" },
    ],
  },
  {
    id: "a5", name: "Kavitha Reddy", city: "Bangalore", state: "Karnataka", area: "Koramangala",
    rating: 4.6, reviewCount: 67, styles: ["Modern", "Minimal", "Indo-Western"],
    minPrice: 2000, maxPrice: 10000, hourlyRate: 550, experience: 3, verified: false,
    bio: "Modern mehndi artist specializing in minimalist and contemporary designs.",
    bioHi: "न्यूनतम और समकालीन डिज़ाइनों में विशेषज्ञता रखने वाली आधुनिक मेहंदी आर्टिस्ट।",
    availability: "Available", portfolioStyle: "modern", phone: "+91 9432109876",
    specialization: "Minimal & Modern Designs",
    latitude: 12.9352, longitude: 77.6245,
    status: "Approved", isActive: true,
    reviews: [
      { id: "r10", userName: "Tara S.", rating: 5, comment: "Love the minimalist style!", date: "Jan 2025", occasion: "Party" },
    ],
  },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Sneha Patel", phone: "+91 9876543211", state: "Maharashtra", city: "Mumbai", area: "Andheri West", isActive: true, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "c2", name: "Ritu Mehta", phone: "+91 9765432112", state: "Delhi", city: "Delhi", area: "Karol Bagh", isActive: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "c3", name: "Kavya Rao", phone: "+91 9654321113", state: "Rajasthan", city: "Jaipur", area: "Vaishali Nagar", isActive: false, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
];

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
  
  // Global simulated notification toast
  const [globalNotification, setGlobalNotification] = useState<{ visible: boolean; title: string; body: string; type: "info" | "success" | "warning" }>({
    visible: false,
    title: "",
    body: "",
    type: "info"
  });

  const triggerNotification = useCallback((title: string, body: string, type: "info" | "success" | "warning" = "info") => {
    setGlobalNotification({ visible: true, title, body, type });
    setTimeout(() => {
      setGlobalNotification((prev) => ({ ...prev, visible: false }));
    }, 6000);
  }, []);
  
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileStr, langStr, bookingsStr, favoritesStr, chatStr, artistsStr, customersStr, commPercentStr, commLogsStr, policyStr, policyLogsStr, passcodeStr] = await Promise.all([
          AsyncStorage.getItem("rangritii_profile"),
          AsyncStorage.getItem("rangritii_language"),
          AsyncStorage.getItem("rangritii_bookings"),
          AsyncStorage.getItem("rangritii_favorites"),
          AsyncStorage.getItem("rangritii_chat"),
          AsyncStorage.getItem("rangritii_artists"),
          AsyncStorage.getItem("rangritii_customers"),
          AsyncStorage.getItem("rangritii_comm_percent"),
          AsyncStorage.getItem("rangritii_comm_logs"),
          AsyncStorage.getItem("rangritii_policy"),
          AsyncStorage.getItem("rangritii_policy_logs"),
          AsyncStorage.getItem("rangritii_admin_passcode"),
        ]);
        
        if (profileStr) setUserProfileState(JSON.parse(profileStr));
        if (langStr) setLanguageState(langStr as Language);
        if (bookingsStr) setBookings(JSON.parse(bookingsStr));
        if (favoritesStr) setFavorites(JSON.parse(favoritesStr));
        if (chatStr) setChatMessages(JSON.parse(chatStr));
        if (passcodeStr) setAdminPasscode(passcodeStr);
        
        if (commPercentStr) setCommissionPercent(parseInt(commPercentStr));
        if (commLogsStr) setCommissionLogs(JSON.parse(commLogsStr));
        if (policyStr) setCancellationPolicy(JSON.parse(policyStr));
        if (policyLogsStr) setPolicyLogs(JSON.parse(policyLogsStr));

        if (artistsStr) {
          setArtists(JSON.parse(artistsStr));
        } else {
          // Initialize mock artists with default packages and strikes
          const initializedMocks = MOCK_ARTISTS.map(a => ({
            ...a,
            status: "Approved" as const,
            isActive: true,
            strikes: 0,
            packages: [
              {
                id: `p_${a.id}_1`,
                nameEn: "Bridal Full Hands",
                nameHi: "दुल्हन पूरे हाथ",
                descriptionEn: "Intricate bridal mehndi up to elbows",
                descriptionHi: "कोहनी तक सुंदर और विस्तृत दुल्हन मेहंदी",
                price: a.hourlyRate * 4,
                durationHours: 4
              },
              {
                id: `p_${a.id}_2`,
                nameEn: "Arabic Minimalist",
                nameHi: "अरेबिक न्यूनतम",
                descriptionEn: "Elegant back hand trailing patterns",
                descriptionHi: "हाथ के पीछे सुंदर अरेबिक डिज़ाइन बेल",
                price: a.hourlyRate * 2,
                durationHours: 2
              },
              {
                id: `p_${a.id}_3`,
                nameEn: "Full Day Package",
                nameHi: "पूरे दिन का पैकेज",
                descriptionEn: "Complete day booking for large functions/weddings (up to 8 hours)",
                descriptionHi: "बड़े कार्यक्रमों/शादियों के लिए पूरे दिन की बुकिंग (8 घंटे तक)",
                price: a.hourlyRate * 8,
                durationHours: 8
              }
            ]
          }));
          setArtists(initializedMocks);
          await AsyncStorage.setItem("rangritii_artists", JSON.stringify(initializedMocks));
        }

        if (customersStr) {
          setCustomers(JSON.parse(customersStr));
        } else {
          setCustomers(MOCK_CUSTOMERS);
          await AsyncStorage.setItem("rangritii_customers", JSON.stringify(MOCK_CUSTOMERS));
        }
      } catch (_e) {}
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
    
    setBookings((prev) => {
      const next = [newBooking, ...prev];
      AsyncStorage.setItem("rangritii_bookings", JSON.stringify(next)).catch(() => {});
      return next;
    });

    // Trigger booking request notification to admin
    setTimeout(() => {
      triggerNotification(
        "📋 New Booking Request!",
        `${bookingData.customerName} requested ${bookingData.artistName} for ${bookingData.occasion}. Admin action required.`,
        "info"
      );
    }, 500);

    return id;
  }, [commissionPercent, cancellationPolicy, triggerNotification]);

  const updateBookingStatus = useCallback((bookingId: string, status: Booking["status"], paymentMethod?: Booking["paymentMethod"]) => {
    setBookings((prev) => {
      const next = prev.map((b) => {
        if (b.id === bookingId) {
          if (status === "Confirmed") {
            // Trigger confirmation notification to artist
            setTimeout(() => {
              triggerNotification(
                "📅 Booking Confirmed!",
                `You have been booked by ${b.customerName} for ${b.occasion} on ${b.date}.`,
                "success"
              );
            }, 500);
          }
          return { ...b, status, ...(paymentMethod ? { paymentMethod } : {}) };
        }
        return b;
      });
      AsyncStorage.setItem("rangritii_bookings", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [triggerNotification]);

  const updatePaymentStatus = useCallback((bookingId: string, paymentStatus: Booking["paymentStatus"]) => {
    setBookings((prev) => {
      const next = prev.map((b) => b.id === bookingId ? { ...b, paymentStatus } : b);
      AsyncStorage.setItem("rangritii_bookings", JSON.stringify(next)).catch(() => {});
      return next;
    });
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
    setArtists((prev) => {
      const next = prev.map((a) =>
        a.id === artistId 
          ? { 
              ...a, 
              status, 
              strikes: status === "Approved" ? 0 : a.strikes, 
              ...(missingDocsReason ? { missingDocsReason } : {}) 
            } 
          : a
      );
      AsyncStorage.setItem("rangritii_artists", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleUserActiveStatus = useCallback((userId: string, isArtist: boolean) => {
    if (isArtist) {
      setArtists((prev) => {
        const next = prev.map((a) => a.id === userId ? { ...a, isActive: !a.isActive } : a);
        AsyncStorage.setItem("rangritii_artists", JSON.stringify(next)).catch(() => {});
        return next;
      });
    } else {
      setCustomers((prev) => {
        const next = prev.map((c) => c.id === userId ? { ...c, isActive: !c.isActive } : c);
        AsyncStorage.setItem("rangritii_customers", JSON.stringify(next)).catch(() => {});
        return next;
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
    setArtists((prev) => {
      const next = prev.map(a => a.id === artistId ? { ...a, packages: updatedPackages } : a);
      AsyncStorage.setItem("rangritii_artists", JSON.stringify(next)).catch(() => {});
      return next;
    });
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
      const next = [...prev, newCustomer];
      AsyncStorage.setItem("rangritii_customers", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateBookingPaymentLink = useCallback((bookingId: string, paymentLink: string) => {
    setBookings((prev) => {
      const next = prev.map((b) => b.id === bookingId ? { ...b, paymentLink } : b);
      AsyncStorage.setItem("rangritii_bookings", JSON.stringify(next)).catch(() => {});
      return next;
    });
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
  }, []);

  if (!loaded) return null;

  return (
    <AppContext.Provider value={{
      userProfile, setUserProfile, language, setLanguage, artists, customers, bookings, favorites, chatMessages,
      commissionPercent, commissionLogs, cancellationPolicy, policyLogs, updateCommissionPercent, updateCancellationPolicy,
      toggleFavorite, addBooking, updateBookingStatus, updatePaymentStatus, cancelBooking, raiseBookingDispute, resolveBookingDispute,
      sendMessage, getArtistById, getBookingById, getArtistBookings,
      updateArtistStatus, toggleUserActiveStatus, registerNewArtist, updateArtistPackages, addCustomer, updateBookingPaymentLink, adminStats,
      adminPasscode, updateAdminPasscode, globalNotification, triggerNotification,
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
