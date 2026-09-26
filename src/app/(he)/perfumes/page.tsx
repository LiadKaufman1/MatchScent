import { AllPerfumesView, allPerfumesMetadata, asGender, asKind } from '@/views/AllPerfumesView';

type Props = { searchParams: Promise<{ q?: string | string[]; gender?: string | string[]; kind?: string | string[]; page?: string | string[] }> };

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v.slice(0, 80) : '');

export async function generateMetadata({ searchParams }: Props) {
  const p = await searchParams;
  return allPerfumesMetadata('he', !!(one(p.q) || one(p.gender) || one(p.kind) || one(p.page)));
}

export default async function Page({ searchParams }: Props) {
  const p = await searchParams;
  return <AllPerfumesView lang="he" q={one(p.q)} gender={asGender(one(p.gender))} kind={asKind(one(p.kind))} page={Number(one(p.page)) || 1} />;
}
