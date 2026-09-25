'use client';

import Link from 'next/link';
import { useState, type ComponentProps } from 'react';

// A link to a page that is fetched as soon as the pointer is over it (or it is touched or focused), so
// the click feels instant without prefetching every link of a long list (the home grid, search results).
// Same behaviour as the "prefetch only on hover" pattern in the Next.js docs, plus touch and keyboard.
export default function HoverLink({ onMouseEnter, onTouchStart, onFocus, ...props }: Omit<ComponentProps<typeof Link>, 'prefetch'>) {
  const [warm, setWarm] = useState(false);
  return (
    <Link
      {...props}
      prefetch={warm ? null : false}
      onMouseEnter={e => { setWarm(true); onMouseEnter?.(e); }}
      onTouchStart={e => { setWarm(true); onTouchStart?.(e); }}
      onFocus={e => { setWarm(true); onFocus?.(e); }}
    />
  );
}
