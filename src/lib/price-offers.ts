// Turns the raw shopping search results for "<brand> <name>" into a clean list of offers for THAT perfume.
//
// The search returns everything that mentions the words: samples, body lotions, gift sets, other versions of
// the perfume (Intense, Elixir, Absolu ...), the opposite gender's version, test bottles and look-alike products
// "inspired by" it. This file throws those out and keeps the real bottles. It has no imports on purpose, so the
// same code can be run offline against saved results (data-import/test-offers.mjs).

export type RawResult = {
  title?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  immersive_product_page_token?: string;
};

export type Wanted = { brand: string; name: string; gender?: string | null };

export type CleanOffer = {
  store: string;
  title: string;
  price: number;
  currency: string;
  sizeMl: number | null;
  tester: boolean;
  token: string | null;   // Google's handle for the listing, used later to open the store's own page (never sent to the browser)
};

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// Hebrew quote marks are used inside abbreviations (מ"ל, ג'ל): drop them so "מ״ל" and 'מ"ל' look the same.
const plain = (s: string) => fold(s).replace(/[״”“"'’׳`]/g, '');
const tokens = (s: string) => plain(s).replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter(Boolean);
// A word-boundary that also works for Hebrew letters.
const word = (alternatives: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, 'iu');

const NAME_STOP = new Set([
  'de', 'la', 'le', 'les', 'du', 'des', 'the', 'of', 'and', 'for', 'pour', 'by', 'a', 'l', 'd',
  'eau', 'parfum', 'toilette', 'edp', 'edt', 'cologne', 'extrait', 'spray', 'homme', 'femme', 'men', 'man', 'women', 'woman', 'her', 'him',
]);
const BRAND_NOISE = new Set(['maison', 'parfums', 'parfum', 'perfumes', 'perfume', 'paris', 'the', 'de', 'la', 'le', 'of', 'by', 'and', 'london', 'fragrances', 'fragrance']);
const BRAND_ALIASES: Record<string, string[]> = {
  yvessaintlaurent: ['ysl'],
  jeanpaulgaultier: ['jpg'],
  dolcegabbana: ['dg', 'dolce'],
  maisonfranciskurkdjian: ['mfk', 'kurkdjian'],
  tomford: ['tf'],
  carolinaherrera: ['ch'],
  pacorabanne: ['rabanne'],
  rabanne: ['paco'],
  giorgioarmani: ['armani'],
};

// Stores in Israel: the listing's store name is in Hebrew, is a .co.il address, or is one we know.
// Things that are not the perfume bottle itself (Latin and Hebrew).
const NOT_A_BOTTLE = word([
  'sample', 'samples', 'decant', 'decants', 'vial', 'miniature', 'mini', 'travel', 'refill', 'refills', 'set', 'kit', 'duo', 'trio',
  'coffret', 'gift', 'discovery', 'wardrobe', 'ritual', 'lotion', 'cream', 'gel', 'soap', 'candle', 'candles', 'deodorant', 'deo',
  'shampoo', 'primer', 'hair', 'body', 'oil', 'balm', 'scrub', 'mist', 'diffuser', 'sticks',
  // look-alikes and copies (also words the site never shows)
  'dupe', 'dupes', 'clone', 'clones', 'replica', 'replicas', 'inspired', 'imitation', 'fake', 'compatible', 'impression', 'alternative', 'type',
  'דוגמית', 'דוגמה', 'דוגמיות', 'בהשראת', 'תואם', 'מילוי', 'נר', 'נרות', 'קרם', 'סבון', 'ג׳ל', 'גל', 'סט', 'מארז', 'מיני', 'טראוול',
  'שמן', 'מבשם', 'שיער', 'דאודורנט', 'חיקוי', 'אלטרנטיבה', 'מפיץ', 'מקלות',
].join('|'));

const TESTER = word('tester|testers|טסטר');
const FOR_MEN = word('for men|pour homme|homme|men|man|male|uomo|לגבר|לגברים|גברים|גבר');
const FOR_WOMEN = word('for women|pour femme|femme|women|woman|female|donna|her|ladies|לאישה|לאשה|לנשים|נשים|אישה|אשה');

// Versions of a perfume that are different products: a listing must agree with the wanted name on each.
const VERSIONS: [string, RegExp][] = [
  ['intense', word('intense|intensely|אינטנס')],
  ['elixir', word('elixir|אליקסיר|אליקסר|אליכסיר')],
  ['extrait', word('extrait|extract|אקסטרייט|אקסטרט|אקסטראט|בושם טהור|טהור')],
  ['absolu', word('absolu|absolue|absolute|אבסולו|אבסולוט')],
  ['cologne', word('cologne|קולון')],
  ['privee', word('privee|prive|פרייב|פריבה')],
  ['limited', word('limited|לימיטד')],
  ['sport', word('sport|ספורט')],
  ['noir', word('noir|נואר')],
];

const ISRAELI_SOURCE = /[\u0590-\u05ff]|\.co\.il|\.il\b|^(ksp|ace|nose|mist|storypharm|story ?pharm|super-?pharm|shufersal|terminal ?x|zap|gomobile|libero|koker|wema|perfume ?il|skyperfumes|callperfume|cell ?tec|everywear|cosmetixe|icon ?pharm|vrona|loven|beyond skin|cosmetic club|life ?pharm|your-?pharm|mtbeauty|blendo|miolor|lola ?ray|parfum ?x|shoesonline|novo ?pharm|oud house|golden ?rose|my perfume|tamara|mashbir)/i;

export function parseSizeMl(title: string): { ml: number | null; multi: boolean } {
  const t = plain(title);
  if (/\d+\s*[x×*]\s*\d+(?:[.,]\d+)?\s*(?:ml|מל|מ\s*ל)/i.test(t)) return { ml: null, multi: true };
  const ml = /(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:ml|מ\s*ל)(?![\p{L}])/iu.exec(t);
  if (ml) return { ml: Number(ml[1].replace(',', '.')), multi: false };
  const oz = /(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:fl\.?\s*)?(?:oz|עוז)(?![\p{L}])/iu.exec(t);
  if (oz) return { ml: Math.round(Number(oz[1].replace(',', '.')) * 29.5735), multi: false };
  return { ml: null, multi: false };
}

const currencyOf = (price: string | undefined) => {
  const p = price ?? '';
  return p.includes('₪') ? 'ILS' : p.includes('$') ? 'USD' : p.includes('£') ? 'GBP' : p.includes('€') ? 'EUR' : null;
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// isBlocked: the site's list of words visitors must never see (dupe, clone ...); a listing that uses one is dropped.
export function cleanOffers(results: RawResult[], wanted: Wanted, opts: { country: string; isBlocked?: (text: string) => boolean }): CleanOffer[] {
  const nameTokens = tokens(wanted.name).filter(t => !NAME_STOP.has(t) && t.length > 0);
  if (!nameTokens.length) return [];
  const brandTokens = tokens(wanted.brand).filter(t => !BRAND_NOISE.has(t));
  const brandKey = tokens(wanted.brand).join('');
  const brandWords = new Set([...brandTokens, ...(BRAND_ALIASES[brandKey] ?? [])]);
  // A short, common-looking name ("Explorer") must come with the brand; a distinctive one ("Aventus") may not.
  const needBrand = nameTokens.join('').length < 6;
  const wantedVersions = VERSIONS.filter(([, re]) => re.test(plain(wanted.name))).map(([k]) => k);
  const gender = (wanted.gender ?? '').toLowerCase();

  const out: CleanOffer[] = [];
  for (const r of results) {
    const title = (r.title ?? '').replace(/\s+/g, ' ').trim();
    const price = r.extracted_price;
    const currency = currencyOf(r.price);
    if (!title || !r.source || typeof price !== 'number' || !(price > 0) || !currency) continue;
    if (opts.isBlocked?.(title) || NOT_A_BOTTLE.test(plain(title))) continue;

    const words = new Set(tokens(title));
    if (!nameTokens.every(t => words.has(t))) continue;
    if (needBrand && ![...brandWords].some(b => words.has(b))) continue;

    const text = plain(title);
    if (VERSIONS.some(([k, re]) => re.test(text) !== wantedVersions.includes(k))) continue;
    const men = FOR_MEN.test(text), women = FOR_WOMEN.test(text);
    if (gender === 'male' && women && !men) continue;
    if (gender === 'female' && men && !women) continue;

    const { ml, multi } = parseSizeMl(title);
    if (multi || (ml !== null && (ml < 20 || ml > 500))) continue;
    // In Israel only stores that sell in Israel: the search also lists shops abroad, whose prices leave out
    // shipping and import tax.
    if (opts.country === 'IL' && !ISRAELI_SOURCE.test(r.source)) continue;

    out.push({
      store: r.source.trim(),
      title,
      price,
      currency,
      sizeMl: ml,
      tester: TESTER.test(text),
      token: r.immersive_product_page_token ?? null,
    });
  }

  // One listing per store, size and kind (the cheapest); the same store at the same price twice is one listing
  // (the one that states its size wins). Then drop prices that are far below the rest of the same size.
  const best = new Map<string, CleanOffer>();
  for (const o of out) {
    const k = `${o.store}|${o.sizeMl ?? ''}|${o.tester}`;
    const known = best.get(k);
    if (!known || o.price < known.price) best.set(k, o);
  }
  const samePrice = new Map<string, CleanOffer>();
  for (const o of best.values()) {
    const k = `${o.store}|${o.price}|${o.tester}`;
    const known = samePrice.get(k);
    if (!known || (known.sizeMl === null && o.sizeMl !== null)) samePrice.set(k, o);
  }
  const list = [...samePrice.values()];
  const bySize = new Map<string, number[]>();
  for (const o of list) if (!o.tester) bySize.set(String(o.sizeMl), [...(bySize.get(String(o.sizeMl)) ?? []), o.price]);
  return list
    .filter(o => {
      const group = bySize.get(String(o.sizeMl)) ?? [];
      return o.tester || group.length < 3 || o.price >= 0.4 * median(group);
    })
    .sort((a, b) => a.price - b.price);
}
