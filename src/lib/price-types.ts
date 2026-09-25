// Types shared by the server (price lookup) and the browser (price panel).

export type PriceOffer = {
  store: string;
  title: string;
  price: number;          // in `currency`
  currency: string;       // 'ILS' | 'USD' | 'GBP' | 'EUR'
  sizeMl: number | null;  // read from the listing's title; null when it does not say
  tester: boolean;        // a demo bottle without its box: the same juice, usually cheaper
  go: string | null;      // short handle the "to the store" button sends to /go, which opens the store's own page
};

export type PriceReport =
  | { ok: true; offers: PriceOffer[]; fetchedAt: string }
  | { ok: false; reason: 'none' | 'unavailable' };
