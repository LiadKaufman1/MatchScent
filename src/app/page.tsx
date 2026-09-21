import { getCatalog } from '@/lib/load-catalog';
import Catalog from './components/Catalog';
import { SiteFooter } from './components/SiteChrome';

// The page is built on the server with the data already inside, then rebuilt in the
// background at most every 5 minutes. Edits made in /admin refresh it immediately.
export const revalidate = 300;

export default async function Home() {
  const { perfumes } = await getCatalog();

  return (
    <div className="luxe">
      <main>
        <section className="hero-glow relative overflow-hidden px-6 pb-12 pt-20 text-center sm:pt-28">
          <div className="rise mx-auto max-w-3xl">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.4em] text-gold-500">The fragrance guide</p>
            <h1 className="font-serif text-5xl font-semibold tracking-tight sm:text-7xl md:text-8xl">
              <span className="gold-text">MatchScent</span>
            </h1>
            <div className="gold-rule mx-auto my-8 w-40" />
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-mist sm:text-xl">
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
