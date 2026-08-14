-- ============================================================
-- Rangritii — translate EXISTING database content to English
--
-- Run this once in Supabase Dashboard → SQL Editor if your
-- database was seeded with the old Hinglish content. It updates
-- rows in place (matching by slug, never by id):
--
--   1. styles       — descriptions rewritten in English
--                     (style names were not changed, so they
--                      are left untouched)
--   2. artists      — bios of the 8 sample artists from
--                     sample-artists.sql, updated ONLY when the
--                     bio still exactly matches the old Hinglish
--                     text (a bio an artist has since edited is
--                      never overwritten)
--
-- platform_settings contains no Hinglish text (contact hours
-- etc. were already in English), so nothing to update there.
--
-- Safe to run multiple times (idempotent): once translated, the
-- guards no longer match and re-runs change nothing.
-- ============================================================

-- ── 1. Style descriptions (matched by slug) ─────────────────
update public.styles set description = 'Full-hand bridal mehandi — intricate jaal patterns, portraits & storytelling designs.'
  where slug = 'bridal';

update public.styles set description = 'Bold strokes, floral trails and negative space — quick & classy.'
  where slug = 'arabic';

update public.styles set description = 'The perfect blend of traditional jaal and bold Arabic strokes.'
  where slug = 'indo-arabic';

update public.styles set description = 'Dense Marwari-Rajasthani work — peacocks and bride-and-groom motifs.'
  where slug = 'traditional';

update public.styles set description = 'Delicate strings, mandalas and fingertip details — less is more.'
  where slug = 'minimal';

update public.styles set description = 'Karva Chauth, Teej and wedding-guest looks — quick to apply, beautiful to wear.'
  where slug = 'festive';

-- ── 2. Sample artist bios (matched by slug; only replaced if
--       the bio is still the original seeded Hinglish text) ───
update public.artists
  set bio = 'Bridal mehandi specialist for 12 years. Rajasthani jaal and bride-and-groom portraits are my signature — I have adorned the hands of 800+ brides. Organic henna, guaranteed dark stain.'
  where slug = 'meera-rathore'
    and bio = '12 saal se bridal mehandi mein specialist. Rajasthani jaal aur dulha-dulhan portraits meri pehchaan hain — 800+ dulhanon ke haathon mein rang bhar chuki hoon. Organic henna, guaranteed dark stain.';

update public.artists
  set bio = 'The queen of Arabic and Indo-Arabic designs! Bold floral trails that pop in every photo. A favourite for engagement, Karva Chauth and party bookings. Home service available.'
  where slug = 'ayesha-khan'
    and bio = 'Arabic aur Indo-Arabic designs ki queen! Bold floral trails jo har photo mein pop karti hain. Engagement, Karva Chauth aur party bookings ke liye favourite. Home service available.';

update public.artists
  set bio = 'Minimal & modern mehandi artist — delicate strings, geometric mandalas and fingertip designs. Perfect for working brides and modern wedding looks. 50k+ followers on Instagram.'
  where slug = 'prachi-deshmukh'
    and bio = 'Minimal & modern mehandi artist — delicate strings, geometric mandalas aur fingertip designs. Working brides aur modern shaadi looks ke liye perfect. Instagram par 50k+ followers.';

update public.artists
  set bio = 'Trusted by Mumbai''s busiest brides — 15 years of experience, including work for the film industry. My bridal packages include 2 assistants so everything is finished in time for the function.'
  where slug = 'farzana-shaikh'
    and bio = 'Mumbai ki busy brides ka bharosa — 15 saal ka experience, film industry ke liye bhi kaam kiya hai. Bridal packages mein 2 assistants ke saath aati hoon taaki function time par khatam ho.';

update public.artists
  set bio = 'Known across Ahmedabad for traditional Gujarati and Marwari mehandi. Special rates for group bookings on Teej and Karva Chauth. I make my own natural henna cones.'
  where slug = 'kiran-patel'
    and bio = 'Ahmedabad mein traditional Gujarati aur Marwari mehandi ke liye jaani jaati hoon. Teej, Karva Chauth par group bookings ki special rates. Natural cones khud banati hoon.';

update public.artists
  set bio = 'The refinement of Lucknow lives in my designs — chikankari-inspired jaali patterns you won''t find anywhere else. A must-try for the regal Nawabi bridal look.'
  where slug = 'sana-siddiqui'
    and bio = 'Lucknow ki nafasat meri designs mein — chikankari se inspired jaali patterns sirf yahin milenge. Nawabi bridal look ke liye zaroor try karein.';

update public.artists
  set bio = 'South Indian + Arabic fusion mehandi in Hyderabad. Specialist in Pellikuthuru and engagement ceremonies. Bulk/group bookings welcome — I have handled 30+ guests at a single sangeet.'
  where slug = 'divya-reddy'
    and bio = 'Hyderabad mein South Indian + Arabic fusion mehandi. Pellikuthuru aur engagement ceremonies ki specialist. Bulk/group bookings welcome — sangeet mein 30+ guests tak handle kiye hain.';

update public.artists
  set bio = 'Surat''s go-to artist for festive and party mehandi. Fast hands — a classy party design in just 15 minutes. Advance booking is a must during Navratri and the wedding season!'
  where slug = 'ritu-agarwal'
    and bio = 'Surat mein festive aur party mehandi ki go-to artist. Fast hands — 15 minute mein classy party design. Navratri aur shaadi season mein advance booking zaroori!';
