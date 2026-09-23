import HomeView from '@/views/HomeView';

// Built ahead of time, refreshed in the background at most every 5 minutes.
// Edits made in /admin refresh it immediately.
export const revalidate = 300;

export default function Page() {
  return <HomeView lang="en" />;
}
