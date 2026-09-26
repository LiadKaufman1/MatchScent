// Where visitors can buy, by country. (The live price comparison is src/lib/prices.ts; these direct
// store searches are what the price panel offers when no live prices can be loaded.)
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

// The "to the store" button of a price row opens the store's own search page for the perfume (marked as coming from us
// in store-links.ts), because the live price service does not give the address of the store's product page.
// Matched on the store's name as the price service writes it. Only addresses that were opened in a real browser and
// returned real results are listed; a store that is not listed shows its price without a button.
type StoreLink = { match: RegExp; countries: CountryCode[]; url: (query: string) => string };
const STORE_LINKS: StoreLink[] = [
  { match: /^ksp$/i, countries: ['IL'], url: q => `https://ksp.co.il/web/cat/?search=${enc(q)}` },
  { match: /super.?pharm|סופר.?פארם/i, countries: ['IL'], url: q => `https://shop.super-pharm.co.il/search?q=${enc(q)}` },
  { match: /y\s?brands/i, countries: ['IL'], url: q => `https://ybrands.co.il/?s=${enc(q)}&post_type=product` },
  { match: /^blendo/i, countries: ['IL'], url: q => `https://blendo.co.il/?s=${enc(q)}&post_type=product` },
  { match: /^amazon(\.com)?$/i, countries: ['US', 'WORLD'], url: q => `https://www.amazon.com/s?k=${enc(q)}` },
  { match: /^amazon(\.co\.uk| uk)$/i, countries: ['GB'], url: q => `https://www.amazon.co.uk/s?k=${enc(q)}` },
  { match: /^fragrancenet/i, countries: ['US', 'WORLD'], url: q => `https://www.fragrancenet.com/search?q=${enc(q)}` },
  { match: /^boots/i, countries: ['GB'], url: q => `https://www.boots.com/sitesearch?searchTerm=${enc(q)}` },
];

export function storeSearchUrl(store: string, query: string, country: CountryCode): string | null {
  const name = store.trim();
  const hit = STORE_LINKS.find(l => l.countries.includes(country) && l.match.test(name));
  return hit ? hit.url(query) : null;
}

export const COUNTRY_ORDER: CountryCode[] = ['IL', 'US', 'GB', 'WORLD'];

export const normalizeCountry = (code?: string | null): CountryCode => {
  const c = (code ?? '').toUpperCase();
  if (c === 'IL') return 'IL';
  if (c === 'US') return 'US';
  if (c === 'GB' || c === 'UK') return 'GB';
  return 'WORLD';
};
