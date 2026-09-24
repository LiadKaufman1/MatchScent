import { HousesView, housesMetadata } from '@/views/DirectoryViews';

export const revalidate = 3600;

export const metadata = housesMetadata('he');

export default function Page() {
  return <HousesView lang="he" />;
}
