import { TopView, topMetadata } from '@/views/CommunityViews';

export const revalidate = 300;

export const metadata = topMetadata('he');

export default function Page() {
  return <TopView lang="he" />;
}
