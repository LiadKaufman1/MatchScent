import { getCatalog } from '@/lib/load-catalog';
import Catalog from './components/Catalog';
import CountrySelect from './components/CountrySelect';
import { SiteFooter, Wordmark } from './components/SiteChrome';

// The page is built on the server with the data already inside, then rebuilt in the
// background at most every 5 minutes. Edits made in /admin refresh it immediately.
export const revalidate = 300;

export default async function Home() {
  const { perfumes } = await getCatalog();

  return (
    <div className="site">
      <main>
        <div className="mx-auto flex max-w-7xl justify-end px-4 pt-4 sm:px-6">
          <CountrySelect />
        </div>
        <section className="hero-glow relative overflow-hidden px-6 pb-12 pt-10 text-center sm:pt-16">
          <div className="rise mx-auto max-w-3xl">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.4em] text-wine-600">The fragrance guide</p>
            <h1 className="text-6xl font-bold tracking-tight sm:text-8xl md:text-9xl">
              <Wordmark />
            </h1>
            <div className="wine-rule mx-auto my-8 w-40" />
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-smoke sm:text-xl">
              Explore fragrances inspired by the world&apos;s most iconic perfumes.
            </p>
          </div>
        </section>

        <Catalog perfumes={perfumes} />
      </main>

      <SiteFooter />
    </div>
  );
}
