import AccessibilityView, { accessibilityMetadata } from '@/views/AccessibilityView';

export const metadata = accessibilityMetadata('he');

export default function Page() {
  return <AccessibilityView lang="he" />;
}
