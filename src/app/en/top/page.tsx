import { TopView, topMetadata } from '@/views/CommunityViews';

export const revalidate = 300;

export const metadata = topMetadata('en');

export default function Page() {
  return <TopView lang="en" />;
}
