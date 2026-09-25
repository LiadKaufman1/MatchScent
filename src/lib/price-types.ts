// Types shared by the server (price lookup) and the browser (price panel).

export type PriceOffer = {
  store: string;
  title: string;
  price: number;          // in `currency`
  currency: string;       // 'ILS' | 'USD' | 'GBP' | 'EUR'
  sizeMl: number | null;  // read from the listing's title; null when it does not say
  tester: boolean;        // a demo bottle without its box: the same juice, usually cheaper
  approx: boolean;        // the listing's title is shorter than the perfume's name: worth double-checking the model
  url: string | null;     // the store's own page, when the lookup already found it
  go: string | null;      // otherwise a short handle the "to the store" button sends to /go, which finds the store's own page
};

export type PriceReport =
  | { ok: true; offers: PriceOffer[]; fetchedAt: string }
  | { ok: false; reason: 'none' | 'unavailable' };
