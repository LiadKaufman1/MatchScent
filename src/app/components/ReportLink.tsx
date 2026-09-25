'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { withLang, type Lang } from '@/lib/i18n';

// A link to "Report a problem" that remembers which page the visitor was on, so the report says where the problem is.
export default function ReportLink({ lang, className, children }: { lang: Lang; className?: string; children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const onForm = /^(\/en)?\/report(\/|$)/.test(pathname);
  const href = withLang(lang, '/report') + (pathname && !onForm ? `?page=${encodeURIComponent(pathname.slice(0, 300))}` : '');
  return <Link href={href} prefetch={false} className={className}>{children}</Link>;
}
