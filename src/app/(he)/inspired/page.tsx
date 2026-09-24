import { InspiredIndexView, inspiredIndexMetadata } from '@/views/DirectoryViews';

type Props = { searchParams: Promise<{ q?: string | string[]; brand?: string | string[]; page?: string | string[] }> };

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v.slice(0, 80) : '');

export async function generateMetadata({ searchParams }: Props) {
  const p = await searchParams;
  return inspiredIndexMetadata('he', !!(one(p.q) || one(p.brand) || one(p.page)));
}

export default async function Page({ searchParams }: Props) {
  const p = await searchParams;
  return <InspiredIndexView lang="he" q={one(p.q)} brand={one(p.brand)} page={Number(one(p.page)) || 1} />;
}
