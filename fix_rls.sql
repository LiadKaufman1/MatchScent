ALTER TABLE perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dupes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to perfumes" ON perfumes;
CREATE POLICY "Allow public read access to perfumes" ON perfumes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to dupes" ON dupes;
CREATE POLICY "Allow public read access to dupes" ON dupes FOR SELECT USING (true);
