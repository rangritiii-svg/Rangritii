export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export const SITE = {
  name: "Rangritii",
  tagline: "Mehandi ka rang, aapki kahaani",
  description:
    "India's mehandi platform — apne sheher ke best mehandi artists dhundo, portfolio dekho, aur ghar baithe booking karo. Bridal, Arabic, festive — har style ke verified artists.",
  phone: "+91 99250 26318",
  whatsapp: "919925026318",
  email: "rangritii21@gmail.com",
  instagram: "https://www.instagram.com/rangritii",
  facebook: "https://www.facebook.com/rangritii",
} as const;
