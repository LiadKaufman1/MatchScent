import type { Metadata } from 'next';
import Link from 'next/link';
import { getCatalog } from '@/lib/load-catalog';
import { getSupabase } from '@/lib/supabase';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProfileData = {
  name: string;
  joined: string;
  shelf: { perfumeId: string; status: 'own' | 'had' | 'want' }[];
  reviews: { id: string; perfumeId: string; body: string }[];
};

// A member's public page: display name, shelf and reviews (all of it is public data).
async function loadProfile(id: string): Promise<ProfileData | null> {
  if (!UUID.test(id)) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = getSupabase();
    const { data: profile } = await supabase.from('profiles').select('display_name, created_at').eq('id', id).maybeSingle();
    if (!profile) return null;
    // The shelf/reviews tables may not exist yet - an empty list is fine then.
    const [shelf, reviews] = await Promise.all([
      supabase.from('collections').select('perfume_id, status').eq('user_id', id),
      supabase.from('reviews').select('id, perfume_id, body').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
    ]);
    return {
      name: profile.display_name as string,
      joined: profile.created_at as string,
      shelf: ((shelf.data ?? []) as { perfume_id: string; status: 'own' | 'had' | 'want' }[]).map(r => ({ perfumeId: r.perfume_id, status: r.status })),
      reviews: ((reviews.data ?? []) as { id: string; perfume_id: string; body: string }[]).map(r => ({ id: r.id, perfumeId: r.perfume_id, body: r.body })),
    };
  } catch {
    return null;
  }
}

export async function profileMetadata(lang: Lang, id: string): Promise<Metadata> {
  const t = getDict(lang);
  const profile = await loadProfile(id);
  return {
    title: profile ? fmt(t.profile.metaTitle, { name: profile.name }) : t.notFoundTitle,
    robots: { index: false, follow: true }, // members' pages are not for search engines
  };
}

export default async function ProfileView({ lang, id }: { lang: Lang; id: string }) {
  const t = getDict(lang);
  const [profile, { perfumes }] = await Promise.all([loadProfile(id), getCatalog()]);
  const byId = new Map(perfumes.map(p => [p.id, p]));

  const joined = profile
    ? new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', { month: 'long', year: 'numeric' }).format(new Date(profile.joined))
    : '';

  const groups: { status: 'own' | 'had' | 'want'; label: string }[] = [
    { status: 'own', label: t.community.shelfOwn },
    { status: 'had', label: t.community.shelfHad },
    { status: 'want', label: t.community.shelfWant },
  ];

  return (
    <div className="site">
      <SiteHeader lang={lang} path={`/u/${id}`} />
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-10 sm:px-6">
        {!profile ? (
          <div className="py-16 text-center">
            <p className="text-smoke">{t.profile.notFound}</p>
            <Link href={withLang(lang, '/')} className="mt-4 inline-block font-bold text-wine-600 underline underline-offset-4">{t.profile.back}</Link>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-extrabold text-ink">{profile.name}</h1>
            <p className="mt-2 text-sm text-smoke">{fmt(t.profile.joined, { date: joined })}</p>

            <section className="mt-10" aria-labelledby="shelf-heading">
              <h2 id="shelf-heading" className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">{t.profile.shelfHeading}</h2>
              {profile.shelf.length === 0 ? (
                <p className="text-smoke">{t.profile.empty}</p>
              ) : (
                <div className="space-y-5">
                  {groups.map(g => {
                    const items = profile.shelf.filter(s => s.status === g.status).map(s => byId.get(s.perfumeId)).filter(p => !!p);
                    if (items.length === 0) return null;
                    return (
                      <div key={g.status}>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-smoke">{g.label}</h3>
                        <ul className="flex flex-wrap gap-2">
                          {items.map(p => (
                            <li key={p!.id}>
                              <Link href={withLang(lang, `/perfume/${p!.slug}`)} prefetch={false} className="block rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink transition hover:border-wine-600/60">
                                {p!.brand} {p!.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-10" aria-labelledby="reviews-heading">
              <h2 id="reviews-heading" className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">{t.profile.reviewsHeading}</h2>
              {profile.reviews.length === 0 ? (
                <p className="text-smoke">{t.profile.empty}</p>
              ) : (
                <div className="space-y-3">
                  {profile.reviews.map(r => {
                    const p = byId.get(r.perfumeId);
                    return (
                      <article key={r.id} className="rounded-2xl border border-line bg-white p-4">
                        {p && (
                          <Link href={withLang(lang, `/perfume/${p.slug}`)} prefetch={false} className="text-sm font-bold text-ink transition hover:text-wine-600">
                            {p.brand} {p.name}
                          </Link>
                        )}
                        <p className="mt-1.5 leading-relaxed text-smoke">{r.body}</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
