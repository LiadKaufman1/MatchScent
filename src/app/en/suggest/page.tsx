import { SuggestView, suggestMetadata } from '@/views/CommunityViews';

export const metadata = suggestMetadata('en');

export default function Page() {
  return <SuggestView lang="en" />;
}
