-- ============================================================
-- Rangritii — starter catalogue (run AFTER schema.sql)
-- Product artwork ships with the app under /public/products/.
-- Replace image paths with your own photo URLs (e.g. Supabase
-- Storage public URLs) whenever you're ready.
-- ============================================================

insert into public.categories (name, slug, description, image, sort_order) values
  ('Co-ord Sets', 'coord-sets', 'Effortless matching sets — one look, zero styling stress.', '/products/cat-coord.svg', 1),
  ('Kurta Sets', 'kurta-sets', 'Kurti, pant & dupatta sets for every occasion.', '/products/cat-kurta-sets.svg', 2),
  ('Kurtis', 'kurtis', 'Everyday cotton kurtis you will live in.', '/products/cat-kurtis.svg', 3),
  ('One Piece', 'one-piece', 'Easy ethnic dresses — slip on and go.', '/products/cat-onepiece.svg', 4),
  ('Plus Size', 'plus-size', 'Beautiful fits in XL to 5XL. Style for every body.', '/products/cat-plus.svg', 5),
  ('Party Wear', 'party-wear', 'Festive & party looks that turn heads.', '/products/cat-party.svg', 6)
on conflict (slug) do nothing;

insert into public.products
  (name, slug, description, price, compare_at_price, category_slug, images, sizes, fabric, stock, is_new, is_bestseller, is_active)
values
  ('Gulaab Rani Co-ord Set', 'gulaab-rani-coord-set', 'A rani-pink cotton co-ord with hand-block gulaab motifs. Relaxed straight kurta with matching flared pants — breathable mulmul lining keeps it airy all day.', 1499, 1999, 'coord-sets', '{"/products/p-01.svg"}', '{"S","M","L","XL","XXL"}', 'Pure Cotton', 24, true, true, true),
  ('Neel Jaipur Co-ord Set', 'neel-jaipur-coord-set', 'Indigo dabu-print co-ord set inspired by Jaipur''s old city. Boxy shirt kurta with wide-leg pants; side pockets included, because obviously.', 1599, null, 'coord-sets', '{"/products/p-02.svg"}', '{"S","M","L","XL","XXL"}', 'Cotton Cambric', 18, true, false, true),
  ('Kesar Bagh Co-ord Set', 'kesar-bagh-coord-set', 'Saffron floral bagh print on soft flex cotton. Short kurta with gathered sharara-style pants — festive without trying too hard.', 1799, 2299, 'coord-sets', '{"/products/p-03.svg"}', '{"S","M","L","XL","XXL"}', 'Flex Cotton', 12, false, true, true),
  ('Chandni Anarkali Kurta Set', 'chandni-anarkali-kurta-set', 'Moon-white anarkali with silver gota detailing, paired with churidar pants and a soft organza dupatta. Twirl-tested and approved.', 2199, 2799, 'kurta-sets', '{"/products/p-04.svg"}', '{"S","M","L","XL","XXL"}', 'Rayon Slub', 15, true, true, true),
  ('Mehendi Utsav Kurta Set', 'mehendi-utsav-kurta-set', 'Mehendi-green straight kurta with mirror-work yoke, matching pants and a chiffon dupatta with tassel edges. Made for haldi-mehendi season.', 1899, 2499, 'kurta-sets', '{"/products/p-05.svg"}', '{"S","M","L","XL","XXL"}', 'Cotton Blend', 20, false, true, true),
  ('Sindoori Chanderi Kurta Set', 'sindoori-chanderi-kurta-set', 'Sindoori-red chanderi kurta with zari buttis, cotton-lined for comfort. Comes with straight pants and a matching chanderi dupatta.', 2499, 3199, 'kurta-sets', '{"/products/p-06.svg"}', '{"S","M","L","XL","XXL"}', 'Chanderi Silk', 10, false, false, true),
  ('Ambar Daily Kurti', 'ambar-daily-kurti', 'Sky-soft everyday kurti in breathable handloom cotton with wooden buttons and side slits. The one you will reach for every Monday.', 749, 999, 'kurtis', '{"/products/p-07.svg"}', '{"S","M","L","XL","XXL"}', 'Handloom Cotton', 40, false, true, true),
  ('Dhoop Chhaon Kurti', 'dhoop-chhaon-kurti', 'Ombre sunset kurti in mul cotton — dhoop fading into chhaon. A-line cut with princess seams and deep pockets.', 849, null, 'kurtis', '{"/products/p-08.svg"}', '{"S","M","L","XL","XXL"}', 'Mul Cotton', 35, true, false, true),
  ('Titli Angrakha Kurti', 'titli-angrakha-kurti', 'Angrakha-style wrap kurti with butterfly-block print and dori tie-up. Flattering overlap silhouette in soft cambric.', 899, 1199, 'kurtis', '{"/products/p-09.svg"}', '{"S","M","L","XL","XXL"}', 'Cotton Cambric', 28, false, false, true),
  ('Baarish Midi Dress', 'baarish-midi-dress', 'Monsoon-blue tiered midi dress in crinkle cotton with smocked bodice and balloon sleeves. Ethnic at heart, easy everywhere.', 1299, 1699, 'one-piece', '{"/products/p-10.svg"}', '{"S","M","L","XL","XXL"}', 'Crinkle Cotton', 22, true, false, true),
  ('Genda Phool Maxi', 'genda-phool-maxi', 'Marigold-yellow maxi dress with genda phool print, shirred back and flowy gathers. Sunshine, stitched.', 1399, null, 'one-piece', '{"/products/p-11.svg"}', '{"S","M","L","XL","XXL"}', 'Rayon', 16, false, true, true),
  ('Raat Rani Curve Kurta Set', 'raat-rani-curve-kurta-set', 'Midnight-purple kurta set designed for curves — princess panels, longer length, roomy hips. With pants and dupatta, XL to 5XL.', 1999, 2599, 'plus-size', '{"/products/p-12.svg"}', '{"XL","XXL","3XL","4XL","5XL"}', 'Rayon Slub', 25, true, true, true),
  ('Gulmohar Curve Kurti', 'gulmohar-curve-kurti', 'Gulmohar-red A-line kurti cut generously through the bust and hip, with side slits that actually sit right. XL to 5XL.', 949, 1249, 'plus-size', '{"/products/p-13.svg"}', '{"XL","XXL","3XL","4XL","5XL"}', 'Pure Cotton', 30, false, false, true),
  ('Noor Curve Co-ord Set', 'noor-curve-coord-set', 'Pearl-grey co-ord with silver foil buttis, tailored for plus sizes with an elasticated back and wide-leg pants. XL to 5XL.', 1699, null, 'plus-size', '{"/products/p-14.svg"}', '{"XL","XXL","3XL","4XL","5XL"}', 'Cotton Blend', 14, false, false, true),
  ('Jashn Velvet Kurta Set', 'jashn-velvet-kurta-set', 'Emerald velvet kurta with zardozi neckline, silk-touch pants and a net dupatta with sequin edging. Shaadi-season heavy hitter.', 2999, 3999, 'party-wear', '{"/products/p-15.svg"}', '{"S","M","L","XL","XXL"}', 'Micro Velvet', 8, true, true, true),
  ('Sitara Sharara Set', 'sitara-sharara-set', 'Star-embroidered short kurti with flared sharara and shimmer dupatta. Georgette with full lining — dance-floor certified.', 2699, 3499, 'party-wear', '{"/products/p-16.svg"}', '{"S","M","L","XL","XXL"}', 'Georgette', 11, false, true, true),
  ('Mor Pankh Lehenga Set', 'mor-pankh-lehenga-set', 'Peacock-teal flared lehenga with gota lace, matching blouse and a soft net dupatta. Light enough to actually enjoy the function.', 3499, 4499, 'party-wear', '{"/products/p-17.svg"}', '{"S","M","L","XL","XXL"}', 'Silk Blend', 6, false, false, true),
  ('Shaam Chikankari Kurti', 'shaam-chikankari-kurti', 'Dusk-mauve georgette kurti with hand chikankari jaal and sequin highlights. Comes with a cotton slip. Evening-ready elegance.', 1599, 1999, 'party-wear', '{"/products/p-18.svg"}', '{"S","M","L","XL","XXL"}', 'Georgette', 19, true, false, true)
on conflict (slug) do nothing;
