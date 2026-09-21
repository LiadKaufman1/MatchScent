// Only real product photos are shown on the public site. Generic stock images
// (for example the Unsplash pictures the database currently holds) are NOT photos
// of the actual fragrance, so those perfumes get an elegant placeholder instead.
//
// A photo counts as "real" when it lives in our own storage:
//   - a file in /public/perfumes/  (example: /perfumes/aventus.jpg)
//   - a public file in Supabase Storage
export const isRealPhoto = (url?: string | null): boolean => {
  if (!url) return false;
  if (url.startsWith('/perfumes/')) return true;
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      u.hostname.endsWith('.supabase.co') &&
      u.pathname.startsWith('/storage/v1/object/public/')
    );
  } catch {
    return false;
  }
};
