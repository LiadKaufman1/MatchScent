'use client';

import { useState, useTransition } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { adminDeletePhoto, adminReviewPhoto } from '@/lib/actions';

export type PhotoItem = { id: string; status: 'pending' | 'approved'; url: string; author: string; perfume: string; createdAt: string };

// Waiting photos: approve (it appears on the perfume page) or reject. Approved photos can still be deleted.
export default function PhotoModeration({ items: initial }: { items: PhotoItem[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const act = (item: PhotoItem, what: 'approve' | 'reject' | 'delete') => {
    if (what === 'delete' && !window.confirm(`Delete this photo by ${item.author}?`)) return;
    startTransition(async () => {
      try {
        if (what === 'delete') await adminDeletePhoto(item.id);
        else await adminReviewPhoto(item.id, what === 'approve');
        setItems(list => (what === 'approve'
          ? list.map(i => (i.id === item.id ? { ...i, status: 'approved' } : i))
          : list.filter(i => i.id !== item.id)));
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  if (items.length === 0) return <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">No photos.</p>;

  return (
    <div>
      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map(item => (
          <li key={item.id} className={`overflow-hidden rounded-2xl border bg-white ${item.status === 'pending' ? 'border-amber-300' : 'border-slate-200'}`}>
            {item.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived links; no need for image optimization here
              <img src={item.url} alt={item.perfume} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-slate-100 text-xs text-slate-500">no preview</div>
            )}
            <div className="p-3 text-xs text-slate-600">
              <p className="font-bold text-slate-900">{item.perfume}</p>
              <p>{item.author} · {item.status === 'pending' ? 'waiting' : 'on the site'}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.status === 'pending' ? (
                  <>
                    <button type="button" disabled={pending} onClick={() => act(item, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button type="button" disabled={pending} onClick={() => act(item, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                ) : (
                  <button type="button" disabled={pending} onClick={() => act(item, 'delete')} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
