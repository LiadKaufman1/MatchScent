'use client';

import { useEffect, useState, useTransition, type ComponentType } from 'react';
import Link from 'next/link';
import {
  Angry, Frown, Heart, Leaf, Meh, Moon, Smile, Snowflake, Sun, TreeDeciduous, Umbrella,
} from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { castVote, removeRating, submitRating, type RatingDetails } from '@/lib/community-actions';
import { useViewer } from '@/lib/use-viewer';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import {
  ASPECTS, CHOICE_KINDS, WEAR_KEYS,
  type Aspect, type ChoiceKind, type PerfumeCommunity, type VoteCounts, type VoteKind, type WearKey,
} from '@/lib/community-types';

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

// score 1 (hate) ... 5 (love)
const RATE_ICONS: Icon[] = [Angry, Frown, Meh, Smile, Heart];
const WEAR_ICONS: Record<WearKey, Icon> = { winter: Snowflake, spring: Leaf, summer: Umbrella, fall: TreeDeciduous, day: Sun, night: Moon };

const aspectLabel = (t: ReturnType<typeof getDict>, a: Aspect) => (a === 'scent' ? t.community.aspectScent : t.community.aspectBottle);

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-wine-600">{title}</h3>
      {children}
    </section>
  );
}

function Bar({ share, active }: { share: number; active: boolean }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-blush" aria-hidden="true">
      <div className={`h-full rounded-full transition-all ${active ? 'bg-wine-700' : 'bg-wine-600/70'}`} style={{ width: `${Math.max(share, 0) * 100}%` }} />
    </div>
  );
}

// One question with several answers on rows: label, bar, number of votes. Clicking a row votes.
function ChoiceRows({ labels, counts, mine, disabled, onPick }: {
  labels: string[]; counts: Record<number, number>; mine: number | null; disabled: boolean; onPick: (value: number) => void;
}) {
  const max = Math.max(1, ...labels.map((_, i) => counts[i + 1] ?? 0));
  return (
    <ul className="space-y-1.5">
      {labels.map((label, i) => {
        const value = i + 1;
        const active = mine === value;
        return (
          <li key={label}>
            <button
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onPick(value)}
              className={`grid w-full grid-cols-[7.5rem_1fr_2.5rem] items-center gap-3 rounded-lg px-2 py-1 text-start transition enabled:hover:bg-blush disabled:cursor-default ${active ? 'bg-blush' : ''}`}
            >
              <span className={`truncate text-sm ${active ? 'font-bold text-wine-700' : 'text-ink'}`}>{label}</span>
              <Bar share={(counts[value] ?? 0) / max} active={active} />
              <span className="text-end text-xs text-smoke" dir="ltr">{compact(counts[value] ?? 0)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// The Fragrantica-style panels: rating (love ... hate), when to wear, longevity, sillage, gender
// and price value. Numbers come from the server (public, same for everyone, part of the
// static page); which answers are THIS visitor's own are read here in the browser.
export default function UserRatings({ lang, perfumeId, average, ratingCounts, votes, aspects }: {
  lang: Lang;
  perfumeId: string;
  average: number;
  ratingCounts: PerfumeCommunity['ratingCounts'];
  votes: VoteCounts;
  aspects: PerfumeCommunity['aspects'];
}) {
  const t = getDict(lang);
  const p = t.community.panels;
  const { ready, userId } = useViewer();
  const [pending, startTransition] = useTransition();

  const [myScore, setMyScore] = useState<number | null>(null);
  const [myDetails, setMyDetails] = useState<RatingDetails>({});
  const [myVotes, setMyVotes] = useState<Partial<Record<VoteKind, number>>>({});
  const [rates, setRates] = useState(ratingCounts);
  const [counts, setCounts] = useState<VoteCounts>(votes);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const supabase = getSupabaseBrowser();
    (async () => {
      // The "scent"/"bottle" columns exist only after the community-v2 migration.
      const wide = await supabase.from('ratings').select('score, scent, bottle').eq('perfume_id', perfumeId).eq('user_id', userId).maybeSingle();
      const rating = wide.error
        ? (await supabase.from('ratings').select('score').eq('perfume_id', perfumeId).eq('user_id', userId).maybeSingle()).data
        : wide.data;
      const { data: rows } = await supabase.from('perfume_votes').select('kind, value').eq('perfume_id', perfumeId).eq('user_id', userId);
      if (!active) return;
      setMyScore(rating?.score ?? null);
      setMyDetails(Object.fromEntries(ASPECTS.map(a => [a, (rating as RatingDetails | null)?.[a] ?? null])));
      setMyVotes(Object.fromEntries(((rows ?? []) as { kind: VoteKind; value: number }[]).map(r => [r.kind, r.value])));
    })();
    return () => { active = false; };
  }, [perfumeId, userId]);

  const mineScore = userId ? myScore : null;
  const mineVotes = userId ? myVotes : {};
  const locked = !userId || pending;

  const say = (ok: boolean) => setMessage(ok ? t.community.thanks : t.auth.errorGeneric);

  const rate = (score: number) => {
    const next = mineScore === score ? null : score;
    setRates(r => ({ ...r, ...(mineScore ? { [mineScore]: Math.max(0, (r[mineScore] ?? 0) - 1) } : {}), ...(next ? { [next]: (r[next] ?? 0) + 1 } : {}) }));
    setMyScore(next);
    startTransition(async () => {
      const result = next === null ? await removeRating(perfumeId) : await submitRating(perfumeId, next, myDetails);
      say(result.success);
    });
  };

  const setDetail = (aspect: Aspect, stars: number) => {
    if (mineScore === null) return;
    const details = { ...myDetails, [aspect]: stars };
    setMyDetails(details);
    startTransition(async () => say((await submitRating(perfumeId, mineScore, details)).success));
  };

  const vote = (kind: VoteKind, value: number | null) => {
    const before = mineVotes[kind];
    setCounts(c => {
      const bucket = { ...(c[kind] ?? {}) };
      if (before !== undefined) bucket[before] = Math.max(0, (bucket[before] ?? 0) - 1);
      if (value !== null) bucket[value] = (bucket[value] ?? 0) + 1;
      return { ...c, [kind]: bucket };
    });
    setMyVotes(v => {
      const next = { ...v };
      if (value === null) delete next[kind]; else next[kind] = value;
      return next;
    });
    startTransition(async () => say((await castVote(perfumeId, kind, value)).success));
  };

  const totalVotes = [1, 2, 3, 4, 5].reduce((n, s) => n + (rates[s] ?? 0), 0);
  const avg = totalVotes ? [1, 2, 3, 4, 5].reduce((n, s) => n + s * (rates[s] ?? 0), 0) / totalVotes : average;
  const maxRate = Math.max(1, ...[1, 2, 3, 4, 5].map(s => rates[s] ?? 0));
  const shownAspects = ASPECTS.filter(a => aspects[a]);

  const choiceTitles: Record<ChoiceKind, { title: string; options: string[] }> = {
    longevity: p.longevity, sillage: p.sillage, gender: p.gender, value: p.price,
  };

  return (
    <section className="mt-14" aria-labelledby="panels-heading">
      <h2 id="panels-heading" className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">{p.heading}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title={p.rate.title}>
          <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={p.rate.title}>
            {[5, 4, 3, 2, 1].map(score => {
              const Icon = RATE_ICONS[score - 1];
              const active = mineScore === score;
              return (
                <button
                  key={score}
                  type="button"
                  disabled={locked}
                  aria-pressed={active}
                  onClick={() => rate(score)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition enabled:hover:bg-blush disabled:cursor-default ${active ? 'bg-blush' : ''}`}
                >
                  <Icon className={`h-7 w-7 ${active ? 'text-wine-700' : 'text-smoke'}`} aria-hidden={true} />
                  <span className={`text-[11px] leading-tight ${active ? 'font-bold text-wine-700' : 'text-ink'}`}>{p.rate.options[score - 1]}</span>
                  <span className="w-full"><Bar share={(rates[score] ?? 0) / maxRate} active={active} /></span>
                  <span className="text-[11px] text-smoke" dir="ltr">{compact(rates[score] ?? 0)}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title={p.wear.title}>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={p.wear.title}>
            {WEAR_KEYS.map(key => {
              const kind = `wear_${key}` as VoteKind;
              const Icon = WEAR_ICONS[key];
              const active = mineVotes[kind] === 1;
              const n = counts[kind]?.[1] ?? 0;
              const max = Math.max(1, ...WEAR_KEYS.map(k => counts[`wear_${k}` as VoteKind]?.[1] ?? 0));
              return (
                <button
                  key={key}
                  type="button"
                  disabled={locked}
                  aria-pressed={active}
                  onClick={() => vote(kind, active ? null : 1)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition enabled:hover:bg-blush disabled:cursor-default ${active ? 'bg-blush' : ''}`}
                >
                  <Icon className={`h-7 w-7 ${active ? 'text-wine-700' : 'text-smoke'}`} aria-hidden={true} />
                  <span className={`text-[11px] leading-tight ${active ? 'font-bold text-wine-700' : 'text-ink'}`}>{p.wear[key]}</span>
                  <span className="w-full"><Bar share={n / max} active={active} /></span>
                  <span className="text-[11px] text-smoke" dir="ltr">{compact(n)}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <p className="mt-4 text-center font-bold text-ink">
        {totalVotes === 0
          ? p.overallNone
          : fmt(totalVotes === 1 ? p.overallOne : p.overall, { avg: avg.toFixed(2), count: totalVotes })}
      </p>
      {ready && !userId && (
        <p className="mt-1 text-center text-sm">
          <Link href={withLang(lang, '/login')} className="font-bold text-wine-600 underline underline-offset-4">{p.loginToVote}</Link>
        </p>
      )}
      {message && <p className="mt-1 text-center text-sm font-medium text-wine-700" role="status">{message}</p>}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {CHOICE_KINDS.map(kind => (
          <Card key={kind} title={choiceTitles[kind].title}>
            <ChoiceRows
              labels={choiceTitles[kind].options}
              counts={counts[kind] ?? {}}
              mine={mineVotes[kind] ?? null}
              disabled={locked}
              onPick={value => vote(kind, mineVotes[kind] === value ? null : value)}
            />
          </Card>
        ))}
      </div>

      {(shownAspects.length > 0 || (userId && mineScore !== null)) && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-wine-600">{p.extraHeading}</h3>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {ASPECTS.map(a => {
              const info = aspects[a];
              return (
                <div key={a}>
                  <p className="flex justify-between text-sm text-ink">
                    <span>{aspectLabel(t, a)}</span>
                    {info && <span className="font-bold" dir="ltr">{info.average.toFixed(1)}</span>}
                  </p>
                  {info && <div className="mt-1"><Bar share={info.average / 5} active={false} /></div>}
                  {userId && mineScore !== null && (
                    <div className="mt-2 flex gap-1" role="radiogroup" aria-label={aspectLabel(t, a)}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={myDetails[a] === n}
                          disabled={pending}
                          onClick={() => setDetail(a, n)}
                          className={`h-7 w-7 rounded-full border text-xs font-bold transition ${
                            (myDetails[a] ?? 0) >= n ? 'border-wine-600 bg-wine-600 text-white' : 'border-line bg-white text-smoke hover:border-wine-600/60'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
