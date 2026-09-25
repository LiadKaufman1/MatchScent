import { AboutView, aboutMetadata } from '@/views/AboutViews';

export const metadata = aboutMetadata('he');

export default function Page() {
  return <AboutView lang="he" />;
}
