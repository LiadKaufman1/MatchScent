import { notFound } from 'next/navigation';
import { HOUSE_LETTERS, HousesView, housesMetadata } from '@/views/DirectoryViews';

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return HOUSE_LETTERS.map(letter => ({ letter }));
}

type Props = { params: Promise<{ letter: string }> };

export async function generateMetadata({ params }: Props) {
  const { letter } = await params;
  return housesMetadata('en', letter);
}

export default async function Page({ params }: Props) {
  const { letter } = await params;
  if (!HOUSE_LETTERS.includes(letter)) notFound();
  return <HousesView lang="en" letter={letter} />;
}
