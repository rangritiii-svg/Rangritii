-- ============================================================
-- Rangritii — required base data (run AFTER schema.sql)
-- Sirf style categories — koi sample/fake artists NAHI.
-- (Testing ke liye sample artists chahiye ho toh alag file
--  sample-artists.sql run karo — optional hai.)
-- ============================================================

insert into public.styles (name, slug, description, image, sort_order) values
  ('Bridal / Dulhan', 'bridal', 'Full-hand dulhan mehandi — intricate jaal, portraits & storytelling designs.', '/art/style-bridal.svg', 1),
  ('Arabic', 'arabic', 'Bold strokes, floral trails aur negative space — quick & classy.', '/art/style-arabic.svg', 2),
  ('Indo-Arabic', 'indo-arabic', 'Traditional jaal + Arabic boldness ka perfect mix.', '/art/style-indo-arabic.svg', 3),
  ('Traditional / Rajasthani', 'traditional', 'Dense Marwari-Rajasthani work — peacocks, dulha-dulhan motifs.', '/art/style-traditional.svg', 4),
  ('Minimal / Modern', 'minimal', 'Delicate strings, mandalas aur fingertips — less is more.', '/art/style-minimal.svg', 5),
  ('Festive / Party', 'festive', 'Karva Chauth, Teej, shaadi-guest looks — jaldi bhi, sundar bhi.', '/art/style-festive.svg', 6)
on conflict (slug) do nothing;
