// Shared rules for the Fragrantica tools (import + refresh report).

export const MIN_VOTES = 10; // likes + dislikes; a handful of votes says nothing

// Supermarket, drugstore and body-care lines: they do not fit a premium fragrance site.
// (Zara and the Arabian houses are kept: they are the popular alternatives people look for.)
export const EXCLUDED_BRANDS = [
  'Lidl', 'Mercadona', 'Bath & Body Works', 'Halloween', 'AXE', 'Avon', 'Oriflame', 'The Body Shop',
  "Victoria's Secret", 'Natura', 'O Boticário', 'Thera Cosméticos', 'Ciclo Cosméticos', 'VIVANT Cosméticos',
  'Mango', 'Massimo Dutti', 'Korres', 'Sol de Janeiro', 'Mahogany', 'Jaguar', 'Animale', 'Christian Audigier',
];

export const norm = s =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Words that are not part of a brand's identity ("By Kilian" = "Kilian", "Lattafa Perfumes" = "Lattafa").
const BRAND_NOISE = new Set(['by', 'the', 'de', 'la', 'le', 'of', 'maison', 'parfum', 'parfums', 'perfume', 'perfumes', 'paris']);
const brandTokens = s => norm(s).split(' ').filter(t => t && !BRAND_NOISE.has(t));

// Same house when one name's words are all inside the other ("Rabanne" / "Paco Rabanne").
export const sameBrand = (a, b) => {
  const x = brandTokens(a), y = brandTokens(b);
  if (!x.length || !y.length) return norm(a) === norm(b);
  const [small, big] = x.length <= y.length ? [x, y] : [y, x];
  return small.every(t => big.includes(t));
};

export const isExcludedBrand = brand => EXCLUDED_BRANDS.some(b => norm(b) === norm(brand));

// "6.1k" -> 6100, "917" -> 917
export const parseCount = text => {
  const m = /^(\d+(?:[.,]\d+)?)(k?)$/i.exec(String(text).trim());
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  return Math.round(m[2] ? n * 1000 : n);
};

// Houses that mostly sell the "inspired" side. They are never proposed as new ORIGINAL perfumes.
export const INSPIRED_SIDE_HOUSES = [
  'Lattafa Perfumes', 'Armaf', 'Maison Alhambra', 'French Avenue', 'Afnan', 'Rasasi', 'Rayhaan', 'Zimaya',
  'Khadlaj Perfumes', 'Fragrance World', 'Paris Corner', 'Ard Al Zaafaran', 'Al Haramain Perfumes',
  'Alexandria Fragrances', 'Gulf Orchid', 'Arabiyat Prestige', 'Bujairami', 'In The Box', 'Mykonos', 'Gissah',
  'Reef Perfumes', 'Al Absar', 'Maison Asrar', 'Ahmed Al Maghribi', 'Nuancielo', 'Emper', 'Ajmal', 'La Rive',
  'Milestone Perfumes', 'Al Wataniah', 'Orientica Premium', 'Swiss Arabian', 'Zara', 'Aromatix X French Avenue',
  'Riiffs Perfumes', 'Dossier', 'Just Jack', 'Be Layered', 'Fine\'ry.', 'ALT. Fragrances', 'We Pink',
];
export const isInspiredSideHouse = brand => INSPIRED_SIDE_HOUSES.some(b => sameBrand(b, brand));

// "Emporio Armani Stronger With You" -> "stronger with you" for house "Giorgio Armani" (drops the house words in front)
export const nameWithoutHouse = (brand, name) => {
  const skip = new Set([...norm(brand).split(' '), 'emporio']);
  const t = norm(name).split(' ');
  while (t.length > 1 && skip.has(t[0])) t.shift();
  return t.join(' ');
};
