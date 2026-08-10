export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export const SITE = {
  name: "Rangritii",
  tagline: "Rang jo aapki kahaani kahe",
  description:
    "Stylish cotton kurtis, co-ord sets, kurta sets & ethnic wear — premium quality, latest designs, honest prices.",
  phone: "+91 99250 26318",
  whatsapp: "919925026318",
  email: "rangritii21@gmail.com",
  instagram: "https://www.instagram.com/rangritii",
  facebook: "https://www.facebook.com/rangritii",
  freeShippingAbove: 999,
  shippingFee: 79,
} as const;
