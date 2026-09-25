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
  multiple_sources?: boolean;   // Google groups several stores under this listing (only one is shown in the row)
  product_id?: string;
};

// One store of a product page (the lookup that lists every store selling a listing).
export type RawStore = { name?: string; title?: string; link?: string; price?: string; extracted_price?: number };

// variantWords: words that make another version of this perfume in our own catalogue ("Intensely" for "Stronger With You").
export type Wanted = { brand: string; name: string; gender?: string | null; variantWords?: string[] };

export type CleanOffer = {
  store: string;
  title: string;
  price: number;
  currency: string;
  sizeMl: number | null;
  tester: boolean;
  approx: boolean;        // the title is shorter than the perfume's name (one word missing): worth double-checking
  token: string | null;   // Google's handle for the listing, used later to open the store's own page (never sent to the browser)
  url: string | null;     // the store's own page, when we already know it
  multi: boolean;         // the listing groups several stores (a product page lists them all)
  rank: number;           // its place in the search results (Google puts the best matches first)
  productId: string | null;
  expandOnly: boolean;    // its own store is not one we show (abroad), but it lists other stores: only used to look them up
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
  ['intense', word('intense|intensely|אינטנס|אינטנסלי')],
  ['powerfully', word('powerfully|powerful|פאוורפולי|פאוורפול')],
  ['absolutely', word('absolutely|אבסולוטלי')],
  ['oud', word('oud|עוד|אוד')],
  ['profumo', word('profumo|פרופומו')],
  // "Parfum" on its own (not "Eau de Parfum") is a stronger, separate version. Israeli stores also write the plain word for
  // perfume as פרפיום, but next to a name that has no such version it is treated as the strength.
  ['parfum', new RegExp('(?<!de )(?<!d )(?<!דה )(?<![\\p{L}\\p{N}])(?:parfum|פרפיום|פרפום)(?![\\p{L}\\p{N}])', 'iu')],
  ['leather', word('leather|לדר|לזר')],
  ['elixir', word('elixir|אליקסיר|אליקסר|אליכסיר')],
  ['extrait', word('extrait|extract|אקסטרייט|אקסטרט|אקסטראט|בושם טהור|טהור')],
  ['absolu', word('absolu|absolue|absolute|אבסולו|אבסולוט')],
  ['cologne', word('cologne|קולון')],
  ['privee', word('privee|prive|פרייב|פריבה')],
  ['limited', word('limited|לימיטד')],
  ['sport', word('sport|ספורט')],
  ['noir', word('noir|נואר')],
];

const COLORS = new Set(['blue', 'brown', 'red', 'black', 'white', 'green', 'gold', 'silver', 'pink', 'purple', 'orange', 'grey', 'gray', 'yellow', 'navy']);

const ISRAELI_SOURCE = /[\u0590-\u05ff]|\.co\.il|\.il\b|^(ksp|ace|nose|mist|storypharm|story ?pharm|super-?pharm|shufersal|terminal ?x|zap|gomobile|libero|koker|wema|perfume ?il|skyperfumes|callperfume|cell ?tec|everywear|cosmetixe|icon ?pharm|vrona|loven|beyond skin|cosmetic club|life ?pharm|your-?pharm|mtbeauty|blendo|miolor|lola ?ray|parfum ?x|shoesonline|novo ?pharm|oud house|golden ?rose|my perfume|tamara|mashbir|y ?brands|zeraf|bosem|rosenfeld|vitamin ?zol|kolbo|perfume ?land|perfume ?oasis)/i;

// The store's own address without the search service's tracking marks (srsltid, utm_source=google ...): the visitor
// lands on the store's page as if they had typed its address. null when it is not a web address.
export function cleanStoreUrl(link: string | undefined | null): string | null {
  try {
    const u = new URL(link ?? '');
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    for (const key of [...u.searchParams.keys()]) if (/^(utm_|gad_|srsltid$|gclid$|gbraid$|wbraid$)/i.test(key)) u.searchParams.delete(key);
    return u.toString();
  } catch {
    return null;
  }
}

// A store is Israeli when its name is (Hebrew / known), or its own web address ends in .il or is a known Israeli shop.
const ISRAELI_HOST = /(^|\.)(co\.il|org\.il|net\.il|il)$|^(www\.)?(terminalx|goldenrose|skyperfumes|perfumeil)\./i;
export function isIsraeliStore(name: string, link?: string | null): boolean {
  if (ISRAELI_SOURCE.test(name)) return true;
  try { return !!link && ISRAELI_HOST.test(new URL(link).hostname); } catch { return false; }
}

// Israeli stores often write the name in Hebrew letters only ("קוקו שאנל מדמוזל" for "Chanel Coco Mademoiselle").
// sound() reduces a word to a rough consonant skeleton that is the same for the Latin and the Hebrew spelling
// (similar sounds merged, vowels dropped), so "mademoiselle" and "מדמוזאל" both become "mdmSl".
const HEBREW_SOUND: Record<string, string> = {
  'ב': 'b', 'ג': 'g', 'ד': 'd', 'ז': 'S', 'ט': 't', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n',
  'ס': 'S', 'פ': 'p', 'ף': 'p', 'צ': 'S', 'ץ': 'S', 'ק': 'k', 'ר': 'r', 'ש': 'S', 'ת': 't', 'ח': 'h',
};
const LATIN_SOUND: Record<string, string> = {
  b: 'b', c: 'k', d: 'd', f: 'p', g: 'g', j: 'S', k: 'k', l: 'l', m: 'm', n: 'n', p: 'p', q: 'k', r: 'r', s: 'S', t: 't', v: 'b', w: 'b', z: 'S', x: 'kS',
};
function sound(word: string): string {
  let raw = '';
  if (/[\u0590-\u05ff]/.test(word)) {
    for (const ch of word) raw += HEBREW_SOUND[ch] ?? '';
  } else {
    const w = word
      .replace(/(.)\1+/g, '$1') // "mademoiselle" -> "mademoisele"
      .replace(/ph/g, 'f').replace(/ch|sh/g, 'S').replace(/th/g, 't').replace(/qu/g, 'k').replace(/ck/g, 'k')
      .replace(/c(?=[eiy])/g, 'S').replace(/tion/g, 'Sn');
    for (const ch of w) raw += ch === 'S' ? 'S' : (LATIN_SOUND[ch] ?? '');
  }
  return raw.replace(/h/g, '');
}
const editDistance = (a: string, b: string) => {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = keep;
    }
  }
  return row[b.length];
};
// Hebrew words that describe any perfume ("perfume", "parfum", "EDP", "for men" ...): a word like פרפיום sounds like
// "profumo", so they must never count as the spelling of a name.
const HEBREW_GENERIC = new Set(['בושם', 'פרפיום', 'פרפום', 'אדפ', 'אדט', 'לגבר', 'לגברים', 'גבר', 'לאישה', 'לאשה', 'אישה', 'אשה', 'נשים', 'גברים', 'יוניסקס', 'דה', 'או', 'מל', 'ספריי', 'בנפח', 'טסטר', 'חדש', 'מקורי', 'טואלט', 'קולון', 'אקסטרייט', 'אקסטרט']);

// Two sounds are "the same word" when they are equal, or (for longer words) differ by one letter.
const soundsAlike = (a: string, b: string) => a.length >= 2 && b.length >= 2 && (a === b || (Math.max(a.length, b.length) >= 4 && editDistance(a, b) <= 1));

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

type Options = { country: string; isBlocked?: (text: string) => boolean; onDrop?: (r: RawResult, why: string) => void };

// The words of a title that belong to no perfume name: sizes, concentrations, "for men" ... A shortened title is only
// trusted when it contains nothing else that could be the name of another perfume.
const GENERIC_WORDS = new Set(['edp', 'edt', 'eau', 'de', 'parfum', 'toilette', 'for', 'men', 'man', 'women', 'woman', 'pour', 'homme', 'femme', 'ml', 'oz', 'fl', 'spray', 'tester', 'new', 'e', 'd', 'p', 't', 'and', 'the', 'by']);
// ...and the ones that only describe the bottle or the offer.
const AFTER_NAME_OK = new Set([
  ...GENERIC_WORDS, 'perfume', 'perfum', 'parfume', 'fragrance', 'vaporisateur', 'vapo', 'unisex', 'authentic', 'original', 'genuine',
  'sealed', 'boxed', 'box', 'sale', 'free', 'shipping', 'delivery', 'israel', 'atomizer', 'natural', 'her', 'him', 'ladies',
]);

// A title that carries another word after the perfume's name ("Stronger With You Powerfully", "... Oud", "... Only") is
// another version of it. Returns that word, or null. Words of the store's own name do not count. Titles that give the
// name only in Hebrew letters cannot be checked this way.
function extraWordAfterName(title: string, store: string, nameTokens: string[], known: Set<string>): string | null {
  const toks = tokens(title);
  let last = -1;
  toks.forEach((w, i) => { if (nameTokens.includes(w)) last = i; });
  if (last < 0) return null;
  const storeWords = new Set(tokens(store));
  return toks.slice(last + 1).find(w => /^[a-z]{3,}$/.test(w) && !known.has(w) && !AFTER_NAME_OK.has(w) && !storeWords.has(w)) ?? null;
}

// Does the title carry a version the wanted perfume does not (or the other way round)? Perfumes whose own name already
// says they are the strong version (Elixir, Extrait, Absolu...) may be sold as "Parfum", so that word is not held against them.
function versionConflict(text: string, wantedVersions: string[], brandKey: string): boolean {
  const strong = wantedVersions.some(k => ['elixir', 'extrait', 'absolu', 'absolutely'].includes(k));
  return VERSIONS.some(([k, re]) => {
    if (k === 'parfum' && (strong || brandKey.includes('parfum'))) return false;
    return re.test(text) !== wantedVersions.includes(k);
  });
}

// The words that make another perfume of the same house a different VERSION of this one ("Stronger With You" ->
// "Intensely", "Absolutely"): what the other name adds AFTER ours. Words before ours ("Emporio Armani Stronger With You")
// are a line label, not a version, and words that only describe the bottle ("Eau de Toilette") never count - either
// would throw out every store title (this happened on 2026-09-25 when the catalogue gained "Emporio Armani Stronger
// With You" next to "Stronger With You": no Israeli store was found).
export function versionWordsOf(ownName: string, otherNames: string[]): string[] {
  const own = tokens(ownName);
  const out = new Set<string>();
  if (!own.length) return [];
  for (const other of otherNames) {
    const theirs = tokens(other);
    for (let i = 0; i + own.length <= theirs.length; i++) {
      if (!own.every((w, k) => theirs[i + k] === w)) continue;
      for (const w of theirs.slice(i + own.length)) if (!own.includes(w) && !GENERIC_WORDS.has(w)) out.add(w);
      break;
    }
  }
  return [...out];
}

function describeWanted(wanted: Wanted) {
  const nameTokens = tokens(wanted.name).filter(t => !NAME_STOP.has(t) && t.length > 0);
  const brandTokens = tokens(wanted.brand).filter(t => !BRAND_NOISE.has(t));
  const brandKey = tokens(wanted.brand).join('');
  const brandWords = new Set([...brandTokens, ...(BRAND_ALIASES[brandKey] ?? [])]);
  return {
    nameTokens,
    brandTokens,
    brandWords,
    // A short, common-looking name ("Explorer") must come with the brand; a distinctive one ("Aventus") may not.
    needBrand: nameTokens.join('').length < 6,
    wantedVersions: VERSIONS.filter(([, re]) => re.test(plain(wanted.name))).map(([k]) => k),
    gender: (wanted.gender ?? '').toLowerCase(),
    brandKey,
    known: new Set([...nameTokens, ...brandTokens, ...brandWords]),
    variantWords: new Set((wanted.variantWords ?? []).filter(w => !nameTokens.includes(w) && !GENERIC_WORDS.has(w))),
  };
}

// isBlocked: the site's list of words visitors must never see (dupe, clone ...); a listing that uses one is dropped.
// onDrop (optional) is told why each listing was thrown out - used by the offline test to spot over-strict rules.
export function classifyResults(results: RawResult[], wanted: Wanted, opts: Options): CleanOffer[] {
  const { nameTokens, brandWords, brandKey, needBrand, wantedVersions, gender, known, variantWords } = describeWanted(wanted);
  if (!nameTokens.length) return [];
  const out: CleanOffer[] = [];
  for (const [rank, r] of results.entries()) {
    const title = (r.title ?? '').replace(/\s+/g, ' ').trim();
    const price = r.extracted_price;
    const currency = currencyOf(r.price);
    const drop = (why: string) => opts.onDrop?.(r, why);
    // Google sometimes shows a listing sold by several stores with no store and no price in the row; its product page
    // still names them all, so such a listing is kept - only to be opened, never shown as an offer.
    const priceless = !r.source || typeof price !== 'number' || !(price > 0) || !currency;
    if (!title || (priceless && !(r.multiple_sources && r.immersive_product_page_token))) { drop('no price'); continue; }
    if (opts.isBlocked?.(title)) { drop('blocked word'); continue; }
    if (NOT_A_BOTTLE.test(plain(title))) { drop('not a bottle'); continue; }

    const words = new Set(tokens(title));
    const hebrew = [...words].filter(w => /[\u0590-\u05ff]/.test(w) && !HEBREW_GENERIC.has(w)).map(sound);
    const has = (t: string) => words.has(t) || (/^[a-z]+$/.test(t) && hebrew.some(h => soundsAlike(sound(t), h)));
    const missing = nameTokens.filter(t => !has(t));
    let approx = false;
    if (missing.length) {
      // A store may leave out the colour of a version ("Afnan ... Turathi" for "Turathi Blue"). That is accepted when the
      // brand is there, the title names no other colour and no other model name (any other Latin word), and the
      // listing is marked "check the model".
      const otherColour = [...words].some(w => COLORS.has(w) && !nameTokens.includes(w));
      const otherWord = [...words].some(w => /^[a-z]+$/.test(w) && w.length > 1 && !known.has(w) && !GENERIC_WORDS.has(w));
      const brandThere = [...brandWords].some(has);
      if (nameTokens.length < 2 || !missing.every(t => COLORS.has(t)) || !brandThere || otherColour || otherWord) { drop('name'); continue; }
      approx = true;
    }
    if (needBrand && ![...brandWords].some(has)) { drop('brand'); continue; }

    const text = plain(title);
    if (versionConflict(text, wantedVersions, brandKey)) { drop('other version'); continue; }
    if ([...words].some(w => variantWords.has(w))) { drop('other version (catalogue)'); continue; }
    const extra = extraWordAfterName(title, r.source ?? '', nameTokens, known);
    if (extra) { drop(`other version (${extra})`); continue; }
    const men = FOR_MEN.test(text), women = FOR_WOMEN.test(text);
    if ((gender === 'male' && women && !men) || (gender === 'female' && men && !women)) { drop('other gender'); continue; }

    const { ml, multi } = parseSizeMl(title);
    if (multi || (ml !== null && (ml < 20 || ml > 500))) { drop('size'); continue; }
    // In Israel only stores that sell in Israel: the search also lists shops abroad, whose prices leave out
    // shipping and import tax.
    // (a store abroad has a converted price with odd cents; a Hebrew title and a round price point to an Israeli shop)
    const roundPrice = !priceless && [0, 50, 90, 99].includes(Math.round(((price as number) % 1) * 100));
    const abroad = priceless || (opts.country === 'IL' && !isIsraeliStore(r.source ?? '') && !(roundPrice && /[\u0590-\u05ff]/.test(title)));
    if (abroad && !r.multiple_sources) { drop('not an Israeli store'); continue; }

    out.push({
      store: (r.source ?? '').trim(),
      title,
      price: priceless ? 0 : (price as number),
      currency: currency ?? 'ILS',
      sizeMl: ml,
      tester: TESTER.test(text),
      approx,
      token: r.immersive_product_page_token ?? null,
      url: null,
      multi: !!r.multiple_sources,
      rank,
      productId: r.product_id ?? null,
      expandOnly: abroad,
    });
  }
  return out;
}

// The stores of a product page (the lookup that lists everyone selling one listing). Google grouped these under the
// listing that passed the checks, but a group can hold different versions, so each store's own title is checked for a
// different colour, version or gender; a title that does not repeat the name is kept and marked "check the model".
// Each store comes with its own address, which also tells whether it is an Israeli store.
export function expandStores(stores: RawStore[], parent: CleanOffer, wanted: Wanted, opts: Options): CleanOffer[] {
  const { nameTokens, brandKey, wantedVersions, gender, known, variantWords } = describeWanted(wanted);
  const wantsColour = nameTokens.some(t => COLORS.has(t));
  const out: CleanOffer[] = [];
  for (const st of stores) {
    const name = (st.name ?? '').trim();
    const price = st.extracted_price;
    const currency = currencyOf(st.price);
    const title = (st.title ?? parent.title).replace(/\s+/g, ' ').trim();
    if (!name || !st.link || typeof price !== 'number' || !(price > 0) || !currency) continue;
    if (opts.isBlocked?.(title) || NOT_A_BOTTLE.test(plain(title))) continue;
    if (opts.country === 'IL' && !isIsraeliStore(name, st.link)) continue;
    const text = plain(title);
    const words = new Set(tokens(title));
    const hebrew = [...words].filter(w => /[\u0590-\u05ff]/.test(w) && !HEBREW_GENERIC.has(w)).map(sound);
    const has = (t: string) => words.has(t) || (/^[a-z]+$/.test(t) && hebrew.some(h => soundsAlike(sound(t), h)));
    if (wantsColour && [...words].some(w => COLORS.has(w) && !nameTokens.includes(w))) continue;
    if (versionConflict(text, wantedVersions, brandKey)) continue;
    if ([...words].some(w => variantWords.has(w)) || extraWordAfterName(title, name, nameTokens, known)) continue;
    const men = FOR_MEN.test(text), women = FOR_WOMEN.test(text);
    if ((gender === 'male' && women && !men) || (gender === 'female' && men && !women)) continue;
    const own = parseSizeMl(title);
    const size = own.ml ?? parseSizeMl(parent.title).ml;
    if (own.multi || (size !== null && (size < 20 || size > 500))) continue;
    const url = cleanStoreUrl(st.link);
    if (!url) continue;
    out.push({ store: name, title, price, currency, sizeMl: size, tester: TESTER.test(text), approx: nameTokens.some(t => !has(t)), token: null, url, multi: false, rank: parent.rank, productId: parent.productId, expandOnly: false });
  }
  return out;
}

// One listing per store, size and kind (the cheapest; a listing with the store's own address wins when its price is
// about the same); the same store at the same price twice is one listing (the one that states its size wins).
// Then drop prices that are far below the rest of the same size, and sort by price.
export function finalizeOffers(all: CleanOffer[]): CleanOffer[] {
  const out = all.filter(o => !o.expandOnly);

  // One listing per store, size and kind (the cheapest); the same store at the same price twice is one listing
  // (the one that states its size wins). Then drop prices that are far below the rest of the same size.
  const best = new Map<string, CleanOffer>();
  for (const o of out) {
    const k = `${o.store.toLowerCase()}|${o.sizeMl ?? ''}|${o.tester}`;
    const known = best.get(k);
    if (!known || o.price < known.price * (known.url && !o.url ? 0.98 : 1)) best.set(k, o);
    else if (!known.url && o.url && o.price <= known.price * 1.02) best.set(k, o);
  }
  const samePrice = new Map<string, CleanOffer>();
  for (const o of best.values()) {
    const k = `${o.store.toLowerCase()}|${o.price}|${o.tester}`;
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

// Everything in one step (the offline test uses this; the server also expands product pages in between).
export const cleanOffers = (results: RawResult[], wanted: Wanted, opts: Options) => finalizeOffers(classifyResults(results, wanted, opts));
