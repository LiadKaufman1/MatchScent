// Where visitors can buy, by country.
//
// Every link is the store's own search page for the perfume, so it never goes out
// of date the way a single product address does. Each address below was opened in
// a real browser and returned real results. To add a store: add a line here.

export type CountryCode = 'IL' | 'US' | 'GB' | 'WORLD';

export type Store = { id: string; name: string; url: (query: string) => string };

const enc = encodeURIComponent;

export const COUNTRIES: Record<CountryCode, { label: string; stores: Store[] }> = {
  IL: {
    label: 'Israel',
    stores: [
      { id: 'ksp', name: 'KSP', url: q => `https://ksp.co.il/web/cat/?search=${enc(q)}` },
      { id: 'super-pharm', name: 'Super-Pharm', url: q => `https://shop.super-pharm.co.il/search?q=${enc(q)}` },
    ],
  },
  US: {
    label: 'United States',
    stores: [
      { id: 'amazon-us', name: 'Amazon', url: q => `https://www.amazon.com/s?k=${enc(q)}` },
      { id: 'fragrancenet', name: 'FragranceNet', url: q => `https://www.fragrancenet.com/search?q=${enc(q)}` },
    ],
  },
  GB: {
    label: 'United Kingdom',
    stores: [
      { id: 'amazon-uk', name: 'Amazon UK', url: q => `https://www.amazon.co.uk/s?k=${enc(q)}` },
      { id: 'boots', name: 'Boots', url: q => `https://www.boots.com/sitesearch?searchTerm=${enc(q)}` },
    ],
  },
  WORLD: {
    label: 'Rest of the world',
    stores: [{ id: 'amazon-us', name: 'Amazon', url: q => `https://www.amazon.com/s?k=${enc(q)}` }],
  },
};

export const COUNTRY_ORDER: CountryCode[] = ['IL', 'US', 'GB', 'WORLD'];

// Google Shopping: lists every store that sells the perfume, with prices, for the
// chosen country (checked: for Israel it shows KSP, Mashbir, eBay, ACE... in shekels).
const GOOGLE_COUNTRY: Record<CountryCode, string | null> = { IL: 'il', US: 'us', GB: 'gb', WORLD: null };

export const compareUrl = (query: string, country: CountryCode, lang: 'en' | 'he' = 'en') =>
  `https://www.google.com/search?udm=28&q=${enc(query)}${GOOGLE_COUNTRY[country] ? `&gl=${GOOGLE_COUNTRY[country]}` : ''}&hl=${lang}`;

export const normalizeCountry = (code?: string | null): CountryCode => {
  const c = (code ?? '').toUpperCase();
  if (c === 'IL') return 'IL';
  if (c === 'US') return 'US';
  if (c === 'GB' || c === 'UK') return 'GB';
  return 'WORLD';
};
