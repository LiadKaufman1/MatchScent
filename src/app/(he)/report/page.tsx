import { ReportView, reportMetadata } from '@/views/AboutViews';

export const metadata = reportMetadata('he');

export default function Page() {
  return <ReportView lang="he" />;
}
