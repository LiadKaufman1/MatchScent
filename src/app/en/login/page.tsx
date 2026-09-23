import AuthView, { authMetadata } from '@/views/AuthView';

export const metadata = authMetadata('en', 'login');

export default function Page() {
  return <AuthView lang="en" mode="login" />;
}
