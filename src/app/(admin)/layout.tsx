import type { Metadata } from 'next';
import { siteViewport } from '@/lib/site-metadata';
import RootDocument from '../components/RootDocument';

export const metadata: Metadata = { title: 'Admin | MatchScent', robots: { index: false, follow: false } };
export const viewport = siteViewport;

// The admin area keeps its own plain look and has no accessibility toolbar.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en" accessibility={false}>{children}</RootDocument>;
}
