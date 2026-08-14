-- ============================================================
-- Rangritii — required base data (run AFTER schema.sql)
-- Style categories only — NO sample/fake artists.
-- (If you want sample artists for testing, run the separate
--  optional file sample-artists.sql.)
-- ============================================================

insert into public.styles (name, slug, description, image, sort_order) values
  ('Bridal / Dulhan', 'bridal', 'Full-hand bridal mehandi — intricate jaal patterns, portraits & storytelling designs.', '/art/style-bridal.jpg', 1),
  ('Arabic', 'arabic', 'Bold strokes, floral trails and negative space — quick & classy.', '/art/style-arabic.jpg', 2),
  ('Indo-Arabic', 'indo-arabic', 'The perfect blend of traditional jaal and bold Arabic strokes.', '/art/style-indo-arabic.jpg', 3),
  ('Traditional / Rajasthani', 'traditional', 'Dense Marwari-Rajasthani work — peacocks and bride-and-groom motifs.', '/art/style-traditional.jpg', 4),
  ('Minimal / Modern', 'minimal', 'Delicate strings, mandalas and fingertip details — less is more.', '/art/style-minimal.jpg', 5),
  ('Festive / Party', 'festive', 'Karva Chauth, Teej and wedding-guest looks — quick to apply, beautiful to wear.', '/art/style-festive.jpg', 6)
on conflict (slug) do nothing;
