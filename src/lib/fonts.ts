import { Heebo } from 'next/font/google';

// One sturdy, easy-to-read font for the whole site, with both Latin and Hebrew letters.
// (Used for English and Hebrew alike; to try another font, change it here.)
export const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heebo',
  display: 'swap',
});
