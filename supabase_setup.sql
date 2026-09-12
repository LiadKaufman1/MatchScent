-- MatchScent Supabase Schema & Initial Data Seed
-- Copy and paste this entirely into your Supabase SQL Editor and click 'RUN'.

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS perfumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  price_usd NUMERIC,
  price_ils NUMERIC,
  gender TEXT, -- 'male', 'female', 'unisex'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS dupes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_perfume_id UUID REFERENCES perfumes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  image_url TEXT,
  similarity_score INTEGER CHECK (similarity_score >= 1 AND similarity_score <= 100),
  price_usd NUMERIC,
  price_ils NUMERIC,
  purchase_link_il TEXT, -- e.g., KSP, Super-Pharm, Notino
  purchase_link_amazon TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Insert 20 Original Perfumes
INSERT INTO perfumes (id, name, brand, gender, price_usd, price_ils, image_url) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Baccarat Rouge 540', 'Maison Francis Kurkdjian', 'unisex', 325, 1200, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111102', 'Aventus', 'Creed', 'male', 365, 1350, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111103', 'Tobacco Vanille', 'Tom Ford', 'unisex', 295, 1100, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111104', 'Lost Cherry', 'Tom Ford', 'unisex', 395, 1450, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111105', 'Delina', 'Parfums de Marly', 'female', 355, 1300, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111106', 'Santal 33', 'Le Labo', 'unisex', 320, 1150, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111107', 'Good Girl Gone Bad', 'Kilian', 'female', 295, 1100, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111108', 'Angels Share', 'Kilian', 'unisex', 245, 950, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111109', 'Alien', 'Mugler', 'female', 130, 480, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111110', 'Black Opium', 'Yves Saint Laurent', 'female', 155, 550, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111111', 'Sauvage', 'Dior', 'male', 145, 520, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111112', 'Bleu de Chanel', 'Chanel', 'male', 160, 580, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111113', 'Gypsy Water', 'Byredo', 'unisex', 225, 850, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111114', 'Bal d''Afrique', 'Byredo', 'unisex', 225, 850, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111115', 'Layton', 'Parfums de Marly', 'unisex', 250, 950, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111116', 'Portrait of a Lady', 'Frederic Malle', 'female', 290, 1080, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111117', 'Oud Wood', 'Tom Ford', 'unisex', 295, 1100, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111118', 'Erba Pura', 'Xerjoff', 'unisex', 250, 950, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111119', 'Naxos', 'Xerjoff', 'unisex', 250, 950, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111120', 'Libre', 'Yves Saint Laurent', 'female', 150, 540, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Dupes
INSERT INTO dupes (original_perfume_id, name, brand, similarity_score, price_usd, price_ils, purchase_link_il, purchase_link_amazon, image_url) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Cloud', 'Ariana Grande', 85, 45, 170, 'https://ksp.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111101', 'Red Temptation', 'Zara', 90, 29, 120, 'https://zara.com/il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  
  ('11111111-1111-1111-1111-111111111102', 'Club de Nuit Intense Man', 'Armaf', 95, 35, 140, 'https://ksp.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  ('11111111-1111-1111-1111-111111111102', 'Explorer', 'Montblanc', 88, 65, 240, 'https://super-pharm.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),

  ('11111111-1111-1111-1111-111111111103', 'Amber Oud Tobacco Edition', 'Al Haramain', 92, 60, 220, 'https://notino.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  
  ('11111111-1111-1111-1111-111111111104', 'Cherry Smash', 'Alt Fragrances', 85, 39, 145, '', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  
  ('11111111-1111-1111-1111-111111111105', 'Club de Nuit Imperiale', 'Armaf', 94, 40, 150, 'https://ksp.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),

  ('11111111-1111-1111-1111-111111111106', 'No.04 Bois de Balincourt', 'Maison Louis Marie', 89, 93, 350, '', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),

  ('11111111-1111-1111-1111-111111111108', 'Kismet Angel', 'Maison Alhambra', 96, 35, 130, 'https://notino.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),

  ('11111111-1111-1111-1111-111111111109', 'Sacrifice for Her', 'Ajmal', 90, 25, 95, '', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),

  ('11111111-1111-1111-1111-111111111110', 'Gardenia', 'Zara', 85, 29, 120, 'https://zara.com/il', '', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  
  ('11111111-1111-1111-1111-111111111111', 'Ventana', 'Armaf', 88, 30, 110, 'https://ksp.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),

  ('11111111-1111-1111-1111-111111111112', 'Missoni Parfum Pour Homme', 'Missoni', 87, 45, 170, 'https://super-pharm.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),

  ('11111111-1111-1111-1111-111111111115', 'Detour Noir', 'Al Haramain', 95, 35, 130, 'https://notino.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),
  
  ('11111111-1111-1111-1111-111111111117', 'Woody Oud', 'Maison Alhambra', 92, 30, 110, 'https://notino.co.il', 'https://amazon.com', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'),

  ('11111111-1111-1111-1111-111111111120', 'Golden Decade', 'Zara', 90, 29, 120, 'https://zara.com/il', '', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop');
