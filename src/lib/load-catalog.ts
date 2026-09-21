import { getSupabase, type Perfume, type Dupe } from './supabase';
import { prepareCatalog } from './catalog';
import { mockPerfumes, mockDupes } from './mockData';

export type ShownPerfume = Perfume & { entryCount: number };

// Supabase returns at most 1000 rows per request, so read in pages.
async function fetchAll<T>(table: string): Promise<T[]> {
  const supabase = getSupabase();
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id')
      .range(from, from + 999);
    if (error) throw new Error(`Could not read "${table}": ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

// Runs on the server. Perfumes that have similar scents come first.
export async function loadCatalog(): Promise<{ perfumes: ShownPerfume[]; dupes: Dupe[] }> {
  let raw: { perfumes: Perfume[]; dupes: Dupe[] };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // No database settings. Sample data is for local development only; real
    // visitors get an empty state instead of made-up perfumes.
    raw = process.env.NODE_ENV === 'development'
      ? { perfumes: mockPerfumes, dupes: mockDupes }
      : { perfumes: [], dupes: [] };
  } else {
    // If the database cannot be read, this throws on purpose: during a
    // background refresh the last good version of the page stays online.
    const [perfumes, dupes] = await Promise.all([fetchAll<Perfume>('perfumes'), fetchAll<Dupe>('dupes')]);
    raw = { perfumes, dupes };
  }

  const catalog = prepareCatalog(raw.perfumes, raw.dupes);

  const counts = new Map<string, number>();
  for (const d of catalog.dupes) counts.set(d.original_perfume_id, (counts.get(d.original_perfume_id) ?? 0) + 1);

  const perfumes: ShownPerfume[] = catalog.perfumes
    .map(p => ({ ...p, entryCount: counts.get(p.id) ?? 0 }))
    .sort((a, b) =>
      Number(b.entryCount > 0) - Number(a.entryCount > 0) ||
      a.brand.localeCompare(b.brand) ||
      a.name.localeCompare(b.name)
    );

  return { perfumes, dupes: catalog.dupes };
}
