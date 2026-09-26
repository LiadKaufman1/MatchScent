import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCatalog } from '@/lib/load-catalog';
import { getSupabase } from '@/lib/supabase';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';
import ProfileEditor from '@/app/components/ProfileEditor';
import HoverLink from '@/app/components/HoverLink';
import Photo from '@/app/components/Photo';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProfileData = {
  name: string;
  bio: string;
  joined: string;
  shelf: { perfumeId: string; status: 'own' | 'had' | 'want' }[];
  ratings: { perfumeId: string; score: number }[];
  reviews: { id: string; perfumeId: string; body: string }[];
  photos: { id: string; perfumeId: string; url: string }[];
};

// A member's public page: display name, shelf, ratings and reviews (all of it is public data).
async function loadProfile(id: string): Promise<ProfileData | null> {
  if (!UUID.test(id)) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = getSupabase();
    // "bio" exists only after the v3 migration; without it, read the profile without it.
    const withBio = await supabase.from('profiles').select('display_name, created_at, bio').eq('id', id).maybeSingle();
    const profile = withBio.error
      ? (await supabase.from('profiles').select('display_name, created_at').eq('id', id).maybeSingle()).data as { display_name: string; created_at: string; bio?: string | null } | null
      : (withBio.data as { display_name: string; created_at: string; bio?: string | null } | null);
    if (!profile) return null;
    // The shelf table may not exist yet - an empty list is fine then.
    const [shelf, reviews, ratings, photos] = await Promise.all([
      supabase.from('collections').select('perfume_id, status').eq('user_id', id),
      supabase.from('reviews').select('id, perfume_id, body').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('ratings').select('perfume_id, score').eq('user_id', id),
      supabase.from('perfume_photos').select('id, perfume_id, public_url').eq('user_id', id).eq('status', 'approved').order('created_at', { ascending: false }).limit(40),
    ]);
    return {
      name: profile.display_name,
      bio: profile.bio ?? '',
      joined: profile.created_at,
      shelf: ((shelf.data ?? []) as { perfume_id: string; status: 'own' | 'had' | 'want' }[]).map(r => ({ perfumeId: r.perfume_id, status: r.status })),
      ratings: ((ratings.data ?? []) as { perfume_id: string; score: number }[]).map(r => ({ perfumeId: r.perfume_id, score: r.score })),
      photos: ((photos.data ?? []) as { id: string; perfume_id: string; public_url: string | null }[])
        .filter(r => r.public_url)
        .map(r => ({ id: r.id, perfumeId: r.perfume_id, url: r.public_url as string })),
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

  const shelfGroups: { status: 'own' | 'had' | 'want'; label: string }[] = [
    { status: 'own', label: t.community.shelfOwn },
    { status: 'had', label: t.community.shelfHad },
    { status: 'want', label: t.community.shelfWant },
  ];
  const rateLabels = t.community.panels.rate.options; // index 0 = hate ... 4 = love

  // A medium picture; the name slides up over it when the pointer is on it (or the tile has the keyboard focus).
  const chip = (p: NonNullable<ReturnType<typeof byId.get>>, extra?: string) => (
    <HoverLink
      href={withLang(lang, `/perfume/${p.slug}`)}
      title={`${p.brand} ${p.name}`}
      className="group relative block w-28 overflow-hidden rounded-2xl border border-line bg-white transition hover:border-wine-600/60 sm:w-32"
    >
      <span className="relative block aspect-[4/5]">
        <Photo url={p.image_url} alt={`${p.brand} ${p.name}`} seed={p.brand + p.name} sizes="128px" />
      </span>
      <span className="absolute inset-x-0 bottom-0 translate-y-full bg-plum-900/90 px-2 py-2 text-center text-[11px] font-bold leading-tight text-white transition duration-200 group-hover:translate-y-0 group-focus-visible:translate-y-0">
        {p.brand} {p.name}
      </span>
      {extra && <span className="absolute start-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-wine-700">{extra}</span>}
    </HoverLink>
  );

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
            {profile.bio && <p className="mt-3 max-w-xl whitespace-pre-line leading-relaxed text-ink">{profile.bio}</p>}
            <p className="mt-1 text-sm font-medium text-ink">
              {fmt(t.profile.stats, { ratings: profile.ratings.length, reviews: profile.reviews.length, shelf: profile.shelf.length })}
            </p>

            <ProfileEditor lang={lang} profileId={id} name={profile.name} bio={profile.bio} />

            <section className="mt-10" aria-labelledby="shelf-heading">
              <h2 id="shelf-heading" className="mb-4 section-title">{t.profile.shelfHeading}</h2>
              {profile.shelf.length === 0 ? (
                <p className="text-smoke">{t.profile.empty}</p>
              ) : (
                <div className="space-y-5">
                  {shelfGroups.map(g => {
                    const items = profile.shelf.filter(s => s.status === g.status).map(s => byId.get(s.perfumeId)).filter(p => !!p);
                    if (items.length === 0) return null;
                    return (
                      <div key={g.status}>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-smoke">
                          {g.label} <span dir="ltr">({items.length})</span>
                        </h3>
                        <ul className="flex flex-wrap gap-3">
                          {items.map(p => <li key={p!.id}>{chip(p!)}</li>)}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-10" aria-labelledby="ratings-heading">
              <h2 id="ratings-heading" className="mb-4 section-title">{t.profile.ratingsHeading}</h2>
              {profile.ratings.length === 0 ? (
                <p className="text-smoke">{t.profile.empty}</p>
              ) : (
                <ul className="flex flex-wrap gap-3">
                  {[...profile.ratings]
                    .sort((a, b) => b.score - a.score)
                    .map(r => ({ r, p: byId.get(r.perfumeId) }))
                    .filter(x => !!x.p)
                    .map(({ r, p }) => <li key={p!.id}>{chip(p!, rateLabels[r.score - 1])}</li>)}
                </ul>
              )}
            </section>

            {profile.photos.length > 0 && (
              <section className="mt-10" aria-labelledby="photos-heading">
                <h2 id="photos-heading" className="mb-4 section-title">{t.profile.photosHeading}</h2>
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {profile.photos.map(ph => {
                    const p = byId.get(ph.perfumeId);
                    const alt = p ? `${p.brand} ${p.name}` : '';
                    return (
                      <li key={ph.id}>
                        <HoverLink href={p ? withLang(lang, `/perfume/${p.slug}`) : ph.url} className="relative block aspect-square overflow-hidden rounded-2xl border border-line" title={alt}>
                          <Image src={ph.url} alt={alt} fill sizes="(min-width: 640px) 180px, 30vw" className="object-cover" />
                        </HoverLink>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="mt-10" aria-labelledby="reviews-heading">
              <h2 id="reviews-heading" className="mb-4 section-title">{t.profile.reviewsHeading}</h2>
              {profile.reviews.length === 0 ? (
                <p className="text-smoke">{t.profile.empty}</p>
              ) : (
                <div className="space-y-3">
                  {profile.reviews.map(r => {
                    const p = byId.get(r.perfumeId);
                    return (
                      <article key={r.id} className="rounded-2xl border border-line bg-white p-4">
                        {p && (
                          <HoverLink href={withLang(lang, `/perfume/${p.slug}`)} className="text-sm font-bold text-ink transition hover:text-wine-600">
                            {p.brand} {p.name}
                          </HoverLink>
                        )}
                        <p className="mt-1.5 whitespace-pre-line leading-relaxed text-smoke">{r.body}</p>
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
