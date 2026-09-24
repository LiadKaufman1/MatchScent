'use client';

import { useState, useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { adminReviewSuggestion } from '@/lib/actions';

export type SuggestionItem = {
  id: string;
  kind: 'similar' | 'perfume';
  brand: string;
  name: string;
  gender: string | null;
  note: string | null;
  author: string;
  perfume: string;
  createdAt: string;
};

function Row({ item, onDone }: { item: SuggestionItem; onDone: (id: string) => void }) {
  const [brand, setBrand] = useState(item.brand);
  const [name, setName] = useState(item.name);
  const [gender, setGender] = useState(item.gender ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const act = (approve: boolean) => startTransition(async () => {
    try {
      await adminReviewSuggestion(item.id, approve, { brand, name, gender: gender || null });
      onDone(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  });

  const input = 'rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm';
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">
        <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 font-bold uppercase text-slate-700">{item.kind === 'similar' ? 'similar scent' : 'new perfume'}</span>
        by <span className="font-medium text-slate-700">{item.author}</span>
        {item.kind === 'similar' && <> for <span className="font-medium text-slate-700">{item.perfume}</span></>}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input aria-label="Brand" value={brand} onChange={e => setBrand(e.target.value)} className={input} />
        <input aria-label="Name" value={name} onChange={e => setName(e.target.value)} className={`${input} min-w-[14rem] flex-1`} />
        {item.kind === 'perfume' && (
          <select aria-label="Gender" value={gender} onChange={e => setGender(e.target.value)} className={input}>
            <option value="">-</option>
            <option value="female">female</option>
            <option value="male">male</option>
            <option value="unisex">unisex</option>
          </select>
        )}
      </div>
      {item.note && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">&ldquo;{item.note}&rdquo;</p>}
      <p className="mt-2 text-xs text-slate-400">
        {item.kind === 'similar'
          ? 'Approve = adds it at the end of this perfume\'s "inspired by" list. Check first that it is really similar and not the same brand.'
          : 'Approve = adds the perfume to the site (no similar scents yet - add those from the Fragrantica lists or members\' suggestions).'}
      </p>
      {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={pending} onClick={() => act(true)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
          <Check className="h-4 w-4" /> Approve
        </button>
        <button type="button" disabled={pending} onClick={() => act(false)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
          <X className="h-4 w-4" /> Reject
        </button>
      </div>
    </li>
  );
}

export default function SuggestionModeration({ items: initial }: { items: SuggestionItem[] }) {
  const [items, setItems] = useState(initial);
  if (items.length === 0) return <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">No suggestions waiting.</p>;
  return (
    <ul className="space-y-2">
      {items.map(item => <Row key={item.id} item={item} onDone={id => setItems(list => list.filter(i => i.id !== id))} />)}
    </ul>
  );
}
