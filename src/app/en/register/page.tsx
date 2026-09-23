import AuthView, { authMetadata } from '@/views/AuthView';

export const metadata = authMetadata('en', 'register');

export default function Page() {
  return <AuthView lang="en" mode="register" />;
}
