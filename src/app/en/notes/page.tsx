import { AllNotesView, allNotesMetadata } from '@/views/AllNotesView';

type Props = { searchParams: Promise<{ n?: string | string[] }> };

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v.slice(0, 400) : '');

export async function generateMetadata({ searchParams }: Props) {
  const p = await searchParams;
  return allNotesMetadata('en', !!one(p.n));
}

export default async function Page({ searchParams }: Props) {
  const p = await searchParams;
  return <AllNotesView lang="en" raw={one(p.n)} />;
}
