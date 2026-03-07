-- Categories (ids 9 and 11 used by businesses below)
INSERT INTO categories (id, name, created_at) VALUES
  (9, 'Food & Dining', NOW()),
  (11, 'Technology', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Subcategories: 10 under category 9; 12, 13 under category 11
INSERT INTO subcategories (id, name, category_id, created_at, image_url, is_main) VALUES
  (10, 'Cafe & Restaurants', 9, NOW(), NULL, 0),
  (12, 'IT Services', 11, NOW(), NULL, 0),
  (13, 'Software', 11, NOW(), NULL, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name), category_id = VALUES(category_id);

-- New users (email only; id is auto)
INSERT INTO users (email) VALUES
  ('demo1@yelo.com'),
  ('demo2@yelo.com'),
  ('demo3@yelo.com');

-- Businesses: category 9 / subcat 10 and category 11 / subcat 12 or 13. Gallery = real files from upload/
-- Base URL: http://localhost:3050 (change if different)

INSERT INTO businesses (user_id, business_name, category_id, subcategory_id, address, about_us, services_offered, gallery, is_verified, is_popular, is_recent, created_at)
VALUES (
  (SELECT id FROM users WHERE email = 'demo1@yelo.com' LIMIT 1),
  'Sample Business One',
  9,
  10,
  '123 Main Street, City',
  'We offer great services and quality products.',
  '["Service A", "Service B", "Service C"]',
  '["http://localhost:3050/upload/6aa9abf8118a1c20f88a2886.png", "http://localhost:3050/upload/00bd683ca0c49cd34902dee5.png"]',
  0, 0, 1,
  NOW()
);

INSERT INTO businesses (user_id, business_name, category_id, subcategory_id, address, about_us, services_offered, gallery, is_verified, is_popular, is_recent, created_at)
VALUES (
  (SELECT id FROM users WHERE email = 'demo1@yelo.com' LIMIT 1),
  'Sample Business Two',
  9,
  10,
  '456 Oak Ave, Town',
  'Another business description here.',
  '["Consulting", "Support", "Delivery"]',
  '["http://localhost:3050/upload/031a1e2a343b9bd683957799.png", "http://localhost:3050/upload/06b9aed6581e786ac9684592.png", "http://localhost:3050/upload/07699305de7650ed982f1da9.png"]',
  1, 1, 0,
  NOW()
);

INSERT INTO businesses (user_id, business_name, category_id, subcategory_id, address, about_us, services_offered, gallery, is_verified, is_popular, is_recent, created_at)
VALUES (
  (SELECT id FROM users WHERE email = 'demo2@yelo.com' LIMIT 1),
  'Downtown Cafe',
  11,
  12,
  '789 Center Rd, Downtown',
  'Best coffee and snacks in town.',
  '["Coffee", "Snacks", "WiFi"]',
  '["http://localhost:3050/upload/07eabbe3bb1ec240b4de2fe1.png", "http://localhost:3050/upload/094d9be2cab72e9f64b7f7e8.png"]',
  0, 1, 1,
  NOW()
);

INSERT INTO businesses (user_id, business_name, category_id, subcategory_id, address, about_us, services_offered, gallery, is_verified, is_popular, is_recent, created_at)
VALUES (
  (SELECT id FROM users WHERE email = 'demo2@yelo.com' LIMIT 1),
  'Tech Solutions Hub',
  11,
  13,
  '100 Tech Park, Innovation City',
  'IT support and software development.',
  '["IT Support", "Web Dev", "Consulting"]',
  '["http://localhost:3050/upload/11066072e7da1f6811b4c702.png", "http://localhost:3050/upload/121645a7fd842264a27d61a4.png", "http://localhost:3050/upload/1ec1723f5f4fa1ab1f6965af.png"]',
  1, 0, 1,
  NOW()
);

INSERT INTO businesses (user_id, business_name, category_id, subcategory_id, address, about_us, services_offered, gallery, is_verified, is_popular, is_recent, created_at)
VALUES (
  (SELECT id FROM users WHERE email = 'demo3@yelo.com' LIMIT 1),
  'Green Garden Store',
  9,
  10,
  '55 Green Lane, Suburb',
  'Plants and garden supplies.',
  '["Plants", "Seeds", "Tools"]',
  '["http://localhost:3050/upload/23fab1953b89919fc1b65e63.png", "http://localhost:3050/upload/263dda802d4c197477c26a4e.png"]',
  0, 0, 0,
  NOW()
);
