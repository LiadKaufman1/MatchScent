import { ReportView, reportMetadata } from '@/views/AboutViews';

export const metadata = reportMetadata('en');

export default function Page() {
  return <ReportView lang="en" />;
}
