import Image from 'next/image';
import { isRealPhoto } from '@/lib/images';
import PerfumeArt from './PerfumeArt';

// A real photo when we have one, otherwise the gold bottle placeholder.
export default function Photo({
  url,
  alt,
  seed,
  sizes,
  priority = false,
}: {
  url?: string | null;
  alt: string;
  seed: string;
  sizes: string;
  priority?: boolean;
}) {
  return isRealPhoto(url) ? (
    <Image src={url as string} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
  ) : (
    <PerfumeArt seed={seed} />
  );
}
