import { SuggestView, suggestMetadata } from '@/views/CommunityViews';

export const metadata = suggestMetadata('he');

export default function Page() {
  return <SuggestView lang="he" />;
}
