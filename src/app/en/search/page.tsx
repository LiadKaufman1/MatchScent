import SearchView, { searchMetadata } from '@/views/SearchView';

export const metadata = searchMetadata('en');

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function Page({ searchParams }: Props) {
  const { q } = await searchParams;
  return <SearchView lang="en" query={typeof q === 'string' ? q : ''} />;
}
