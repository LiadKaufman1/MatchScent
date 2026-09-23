import type { Metadata } from 'next';
import { siteMetadata, siteViewport } from '@/lib/site-metadata';
import RootDocument from '../components/RootDocument';

export const metadata: Metadata = siteMetadata('en');
export const viewport = siteViewport;

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
