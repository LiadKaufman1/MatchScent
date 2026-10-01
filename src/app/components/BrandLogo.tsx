'use client';

import { useState } from 'react';

// A perfume house's own logo, next to its name on the brand page. Logos are collected slowly from Fragrantica
// (one request per house, same pace as everything else) and stored in our own Supabase bucket "brand-logos" as
// "<slug>.jpg" (scripts/upload-brand-logos.mjs); most houses do not have one yet, so this renders nothing until a
// file exists at that address - no extra network round trip to "check first", the browser just hides a failed image.
export default function BrandLogo({ slug, name }: { slug: string; name: string }) {
  const [hidden, setHidden] = useState(false);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (hidden || !base) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a handful of small logos, not worth next/image's overhead
    <img
      src={`${base}/storage/v1/object/public/brand-logos/${slug}.jpg`}
      alt={`${name} logo`}
      onError={() => setHidden(true)}
      className="h-8 w-8 shrink-0 rounded-full border border-line bg-white object-contain p-1 sm:h-10 sm:w-10"
    />
  );
}
