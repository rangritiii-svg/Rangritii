export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export const SITE = {
  name: "Rangritii",
  tagline: "The colour of mehandi, the story of you",
  description:
    "India's mehandi platform — discover the best mehandi artists in your city, browse their portfolios, and book from the comfort of your home. Verified artists for every style — bridal, Arabic, and festive.",
  phone: "+91 99250 26318",
  whatsapp: "919925026318",
  email: "rangritii21@gmail.com",
  instagram: "https://www.instagram.com/rangritii",
  facebook: "https://www.facebook.com/rangritii",
} as const;
