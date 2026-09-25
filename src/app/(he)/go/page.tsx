import { Suspense } from 'react';
import type { Metadata } from 'next';
import GoRedirect from '@/app/components/GoRedirect';
import { Wordmark } from '@/app/components/SiteChrome';

// Not for search engines: it only forwards a visitor to a store.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <main className="grid min-h-[80vh] place-items-center px-6">
      <div className="text-center">
        <p className="mb-10 text-3xl font-extrabold"><Wordmark /></p>
        <Suspense fallback={null}>
          <GoRedirect lang="he" />
        </Suspense>
      </div>
    </main>
  );
}
