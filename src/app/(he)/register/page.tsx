import AuthView, { authMetadata } from '@/views/AuthView';

export const metadata = authMetadata('he', 'register');

export default function Page() {
  return <AuthView lang="he" mode="register" />;
}
