import { HousesView, housesMetadata } from '@/views/DirectoryViews';

export const revalidate = 3600;

export const metadata = housesMetadata('en');

export default function Page() {
  return <HousesView lang="en" />;
}
