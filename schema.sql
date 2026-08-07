-- Urban Plaza Cafe — D1 schema + starter data.
-- Run this once against your D1 database (dashboard Console, or
-- `wrangler d1 execute DB_NAME --remote --file=schema.sql`) before first deploy.

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  image TEXT DEFAULT '',
  available INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  pickup_time TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cafe_name TEXT NOT NULL DEFAULT 'Urban Plaza Cafe',
  tagline TEXT NOT NULL DEFAULT '',
  hero_text TEXT NOT NULL DEFAULT '',
  about_text TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  maps_url TEXT NOT NULL DEFAULT '',
  price_range TEXT NOT NULL DEFAULT '',
  rating REAL NOT NULL DEFAULT 5,
  review_count INTEGER NOT NULL DEFAULT 0,
  colors_json TEXT NOT NULL DEFAULT '{}',
  hours_json TEXT NOT NULL DEFAULT '[]',
  hours_note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT
);

-- Seed: settings (real info pulled from the cafe's Google Business listing where noted)
INSERT OR IGNORE INTO settings (
  id, cafe_name, tagline, hero_text, about_text, phone, email, address, maps_url,
  price_range, rating, review_count, colors_json, hours_json, hours_note
) VALUES (
  1,
  'Urban Plaza Cafe',
  'Eritrean coffee ceremony & kitchen, poured fresh every morning',
  'From hand-roasted beans to a slow-poured jebena, every cup at Urban Plaza Cafe carries the Eritrean coffee ceremony into Aurora.',
  'Urban Plaza Cafe brings the warmth of the traditional Eritrean coffee ceremony to Aurora, Colorado. We roast, brew, and pour coffee the slow way, and pair it with home-style Eritrean breakfast and lunch: injera, shiro, kitfo with tibsi, and more.',
  '(303) 537-7731',
  'hello@urbanplazacafe.com',
  '1074 S Ironton St Unit-C, Aurora, CO 80012',
  'https://www.google.com/maps/place/Urban+Plaza+Cafe/@39.697175,-104.8632027,17z',
  '$10-20 per person',
  4.0,
  41,
  '{"bg":"#FBF1E3","surface":"#FFFFFF","text":"#2E1B12","primary":"#2E1B12","accent":"#E1A33E","accent2":"#3F6E52","highlight":"#E2694B"}',
  '[{"day":"Monday","open":"7:00 AM","close":"6:30 PM"},{"day":"Tuesday","open":"7:00 AM","close":"6:30 PM"},{"day":"Wednesday","open":"7:00 AM","close":"6:30 PM"},{"day":"Thursday","open":"7:00 AM","close":"6:30 PM"},{"day":"Friday","open":"7:00 AM","close":"6:30 PM"},{"day":"Saturday","open":"8:00 AM","close":"6:30 PM"},{"day":"Sunday","open":"8:00 AM","close":"4:00 PM"}]',
  'Closing time of 6:30 PM confirmed from Google. Opening times and Sunday hours are placeholders, please confirm and update in the admin panel.'
);

-- Seed: menu (Kitfo with Tibsi, Shiro, and Latte are the real highlights from the Google listing)
INSERT OR IGNORE INTO menu_items (id, category, name, description, price, available, featured, sort_order) VALUES
('seed-coffee-ceremony', 'Coffee Ceremony & Drinks', 'Traditional Coffee Ceremony', 'Green beans roasted, ground, and brewed to order in a clay jebena, served in three rounds the traditional Eritrean way.', 12, 1, 1, 1),
('seed-latte', 'Coffee Ceremony & Drinks', 'Latte', 'Espresso and steamed milk, poured smooth.', 4.5, 1, 1, 2),
('seed-macchiato', 'Coffee Ceremony & Drinks', 'Macchiato', 'Espresso marked with a spoon of foam, Eritrean cafe style.', 3.5, 1, 0, 3),
('seed-shai', 'Coffee Ceremony & Drinks', 'Spiced Shai Tea', 'Black tea steeped with cinnamon, cardamom, and clove.', 3.5, 1, 0, 4),
('seed-kitfo', 'Breakfast & Injera Platters', 'Kitfo with Tibsi', 'Seasoned minced beef kitfo paired with sauteed tibsi, served with fresh injera.', 15, 1, 1, 5),
('seed-shiro', 'Breakfast & Injera Platters', 'Shiro', 'Slow-simmered chickpea stew, served with fresh injera.', 11, 1, 1, 6),
('seed-ful', 'Breakfast & Injera Platters', 'Ful Medames', 'Stewed fava beans with onion, tomato, and jalapeno, served with bread.', 10, 1, 0, 7),
('seed-firfir', 'Breakfast & Injera Platters', 'Enkulal Firfir', 'Eritrean scrambled eggs with tomato, onion, and torn injera.', 10, 1, 0, 8),
('seed-sambusa', 'Pastries & Sides', 'Sambusa (3 pc)', 'Crisp pastry filled with spiced lentils or beef.', 6, 1, 0, 9),
('seed-himbasha', 'Pastries & Sides', 'Himbasha', 'Lightly sweet Eritrean celebration bread, served warm.', 5, 1, 0, 10);

-- Seed: reviews (real quotes from the Google Business listing)
INSERT OR IGNORE INTO reviews (id, name, rating, text, source, created_at) VALUES
('seed-review-1', 'Jim Conley', 4, 'Eritrean breakfast place. Service was fine, the space itself is basic but serviceable. Good place to try something different for breakfast.', 'google', '2026-01-01T00:00:00Z'),
('seed-review-2', 'Local Guide', 5, 'Delicious Eritrean food. Breakfast served all day and the lunch menu is great!', 'google', '2026-01-02T00:00:00Z'),
('seed-review-3', 'Aurora Regular', 5, 'The coffee was amazing and the food was excellent.', 'google', '2026-01-03T00:00:00Z');
