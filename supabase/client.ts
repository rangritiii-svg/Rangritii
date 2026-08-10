import { createClient } from "@supabase/supabase-js";

// Supabase configuration
// Project URL & Public Anon Key
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://rangritii-app.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmdyaXRpaS1hcHAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4MDAwMDAwMCwiZXhwIjoyMDA0NTYwMDAwfQ.placeholder";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/**
 * Upload a base64 image data URI to Supabase Storage bucket 'portfolios'
 * @param base64DataUri The base64 data URI (e.g. data:image/jpeg;base64,/9j/4AAQ...)
 * @param fileName Unique file name to save as
 * @returns Public HTTPS URL of the uploaded image
 */
export async function uploadImageToSupabase(
  base64DataUri: string,
  fileName: string,
  bucketName = "portfolios"
): Promise<string | null> {
  try {
    // If it's already an HTTP/HTTPS URL, return it directly
    if (base64DataUri.startsWith("http://") || base64DataUri.startsWith("https://")) {
      return base64DataUri;
    }

    // Extract content type and base64 string
    const match = base64DataUri.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) return null;

    const contentType = match[1];
    const base64Data = match[2];

    // Convert base64 string to Uint8Array binary buffer
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Upload byte array to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`${fileName}`, bytes.buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn("Supabase Storage upload error:", error.message);
      return null;
    }

    // Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.warn("uploadImageToSupabase error:", err?.message || err);
    return null;
  }
}
