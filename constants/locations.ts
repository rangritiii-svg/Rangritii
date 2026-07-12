/**
 * locations.ts
 * Single source of truth for state → city/district lists used across the app
 * (customer login, artist registration, search filters, etc.).
 *
 * Rajasthan is RangRiti's primary market, so it lists all 41 official
 * districts (as per the Government of Rajasthan reorganisation effective 2025).
 * Other states keep their major cities so the app still works nationwide.
 */

// All 41 districts of Rajasthan (official list, 2025), sorted alphabetically.
export const RAJASTHAN_DISTRICTS: string[] = [
  "Ajmer",
  "Alwar",
  "Balotra",
  "Banswara",
  "Baran",
  "Barmer",
  "Beawar",
  "Bharatpur",
  "Bhilwara",
  "Bikaner",
  "Bundi",
  "Chittorgarh",
  "Churu",
  "Dausa",
  "Deeg",
  "Dholpur",
  "Didwana-Kuchaman",
  "Dungarpur",
  "Hanumangarh",
  "Jaipur",
  "Jaisalmer",
  "Jalore",
  "Jhalawar",
  "Jhunjhunu",
  "Jodhpur",
  "Karauli",
  "Khairthal-Tijara",
  "Kota",
  "Kotputli-Behror",
  "Nagaur",
  "Pali",
  "Phalodi",
  "Pratapgarh",
  "Rajsamand",
  "Salumbar",
  "Sawai Madhopur",
  "Sikar",
  "Sirohi",
  "Sri Ganganagar",
  "Tonk",
  "Udaipur",
];

export const INDIAN_STATES_CITIES: Record<string, string[]> = {
  // Primary market — all 41 districts
  Rajasthan: RAJASTHAN_DISTRICTS,

  // Other states (major cities) — kept so the app works beyond Rajasthan
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
  Delhi: ["Delhi", "New Delhi", "Noida", "Gurugram"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Ambala"],
  Karnataka: ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
};

// Ordered list of states for dropdowns (Rajasthan first).
export const INDIAN_STATES: string[] = Object.keys(INDIAN_STATES_CITIES);
