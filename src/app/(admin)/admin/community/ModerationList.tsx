'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { adminDeletePoint, adminDeleteReview } from '@/lib/actions';

export type ModerationItem = {
  id: string;
  type: 'review' | 'point';
  body: string;
  label: string;
  author: string;
  perfume: string;
  createdAt: string;
};

export default function ModerationList({ items: initial }: { items: ModerationItem[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (item: ModerationItem) => {
    if (!window.confirm(`Delete this ${item.label} by ${item.author}?`)) return;
    startTransition(async () => {
      try {
        if (item.type === 'review') await adminDeleteReview(item.id);
        else await adminDeletePoint(item.id);
        setItems(list => list.filter(i => i.id !== item.id));
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  if (items.length === 0) return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Nothing to moderate yet.</p>;

  return (
    <div>
      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <ul className="space-y-2">
        {items.map(item => (
          <li key={`${item.type}-${item.id}`} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">
                <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 font-bold uppercase text-slate-700">{item.label}</span>
                <span className="font-medium text-slate-700">{item.author}</span> on <span className="font-medium text-slate-700">{item.perfume}</span>
                <span className="ml-2" dir="ltr">{new Date(item.createdAt).toLocaleString('en-GB')}</span>
              </p>
              <p className="mt-1 whitespace-pre-line break-words text-slate-900">{item.body}</p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(item)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
