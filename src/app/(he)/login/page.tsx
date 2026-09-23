import AuthView, { authMetadata } from '@/views/AuthView';

export const metadata = authMetadata('he', 'login');

export default function Page() {
  return <AuthView lang="he" mode="login" />;
}
