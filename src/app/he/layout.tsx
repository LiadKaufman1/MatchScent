import type { Metadata } from 'next';
import { siteMetadata, siteViewport } from '@/lib/site-metadata';
import RootDocument from '../components/RootDocument';

export const metadata: Metadata = siteMetadata('he');
export const viewport = siteViewport;

export default function HebrewLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="he">{children}</RootDocument>;
}
