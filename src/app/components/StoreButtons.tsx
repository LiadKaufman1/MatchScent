import { slugify } from '@/lib/slug';
import type { Lang } from '@/lib/i18n';
import PriceCompare from './PriceCompare';

// "Where to buy" for one fragrance: opens the price-comparison panel for the visitor's country (the main
// action of the site). The address key is the same one the price lookup checks against the catalogue.
export default function StoreButtons({ brand, name, lang, variant = 'card' }: { brand: string; name: string; lang: Lang; variant?: 'hero' | 'card' }) {
  return <PriceCompare perfumeKey={slugify(`${brand} ${name}`)} brand={brand} name={name} lang={lang} variant={variant} />;
}
