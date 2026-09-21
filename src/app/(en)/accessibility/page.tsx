import AccessibilityView, { accessibilityMetadata } from '@/views/AccessibilityView';

export const metadata = accessibilityMetadata('en');

export default function Page() {
  return <AccessibilityView lang="en" />;
}
