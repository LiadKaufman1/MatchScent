import { AboutView, aboutMetadata } from '@/views/AboutViews';

export const metadata = aboutMetadata('en');

export default function Page() {
  return <AboutView lang="en" />;
}
