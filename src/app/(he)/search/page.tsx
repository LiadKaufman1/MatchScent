import SearchView, { searchMetadata } from '@/views/SearchView';

export const metadata = searchMetadata('he');

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function Page({ searchParams }: Props) {
  const { q } = await searchParams;
  return <SearchView lang="he" query={typeof q === 'string' ? q : ''} />;
}
