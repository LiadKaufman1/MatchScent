'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { uploadPhoto } from '@/lib/community-actions';
import { useViewer } from '@/lib/use-viewer';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import type { PhotoRow } from '@/lib/community-types';

const MAX_SIDE = 1400;

// Shrinks the picture in the browser before it is sent (phone photos are often 5-10 MB):
// longest side at most 1400 px, saved as JPEG. Also drops the photo's hidden details (location etc.).
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.85));
}

// Members' own photos of the bottle (Parfumo style). New photos wait for the owner's approval.
export default function PhotoGallery({ lang, perfumeId, photos, alt }: { lang: Lang; perfumeId: string; photos: PhotoRow[]; alt: string }) {
  const t = getDict(lang);
  const p = t.photos;
  const { ready, userId } = useViewer();
  const [file, setFile] = useState<File | null>(null);
  const [own, setOwn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!file || !own) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) { setMessage(p.invalid); return; }
    startTransition(async () => {
      try {
        const blob = await shrink(file);
        const form = new FormData();
        form.set('perfumeId', perfumeId);
        form.set('own', 'yes');
        form.set('file', blob, 'photo.jpg');
        const result = await uploadPhoto(form);
        if (result.success) { setMessage(p.sent); setFile(null); setOwn(false); }
        else setMessage(result.error === 'too many' ? p.tooMany : result.error === 'invalid file' ? p.invalid : t.auth.errorGeneric);
      } catch {
        setMessage(p.invalid);
      }
    });
  };

  return (
    <section className="mt-14" aria-labelledby="photos-heading">
      <h2 id="photos-heading" className="mb-5 section-title">
        {p.heading} {photos.length > 0 && <span className="text-smoke" dir="ltr">({photos.length})</span>}
      </h2>

      {photos.length === 0 ? (
        <p className="text-sm text-smoke">{p.none}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map(ph => (
            <li key={ph.id}>
              <figure className="overflow-hidden rounded-2xl border border-line bg-white">
                <a href={ph.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square">
                  <Image src={ph.url} alt={alt} fill sizes="(min-width: 640px) 240px, 45vw" className="object-cover" />
                </a>
                <figcaption className="truncate px-3 py-2 text-xs text-smoke">
                  {ph.user_id ? (
                    <Link href={withLang(lang, `/u/${ph.user_id}`)} prefetch={false} className="hover:text-wine-600">{fmt(p.by, { name: ph.author })}</Link>
                  ) : fmt(p.by, { name: ph.author })}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}

      {ready && !userId && (
        <p className="mt-4 text-sm">
          <Link href={withLang(lang, '/login')} className="font-bold text-wine-600 underline underline-offset-4">{p.login}</Link>
        </p>
      )}

      {userId && (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-line bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Camera className="h-4 w-4 text-wine-600" aria-hidden="true" />
            {p.add}
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={e => { setFile(e.target.files?.[0] ?? null); setMessage(null); }}
            aria-label={p.add}
            className="mt-3 block w-full text-sm text-smoke file:me-3 file:rounded-full file:border-0 file:bg-blush file:px-4 file:py-2 file:text-sm file:font-bold file:text-wine-700"
          />
          <label className="mt-3 flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" checked={own} onChange={e => setOwn(e.target.checked)} className="mt-1 accent-wine-600" />
            <span>{p.own}</span>
          </label>
          <button
            type="submit"
            disabled={pending || !file || !own}
            className="mt-3 rounded-full bg-wine-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-wine-700 disabled:opacity-50"
          >
            {pending ? p.uploading : p.upload}
          </button>
          {message && <p className="mt-2 text-sm font-medium text-wine-700" role="status">{message}</p>}
        </form>
      )}
    </section>
  );
}
