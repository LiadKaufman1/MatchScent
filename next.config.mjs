/** @type {import('next').NextConfig} */
const nextConfig = {
  // Members' photos are shrunk in the browser first (to about 0.3-1 MB), but leave room above the 1 MB default.
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  // Hebrew moved from /he to the site root ("/"); English moved from "/" to /en.
  // These keep old bookmarks and search-engine links to the Hebrew pages working.
  async redirects() {
    return [
      { source: '/he', destination: '/', permanent: true },
      { source: '/he/:path*', destination: '/:path*', permanent: true },
      // Perfumes that were on the site twice were merged (db-cleanup/2026-09-merge-duplicate-perfumes.sql): the removed address leads to the kept one.
      ...[
        ['giorgio-armani-emporio-armani-stronger-with-you', 'giorgio-armani-stronger-with-you'],
        ['jo-malone-myrrh-and-tonka', 'jo-malone-london-myrrh-and-tonka'],
        ['jo-malone-wood-sage-and-sea-salt', 'jo-malone-london-wood-sage-and-sea-salt'],
      ].flatMap(([from, to]) => [
        { source: `/perfume/${from}`, destination: `/perfume/${to}`, permanent: true },
        { source: `/en/perfume/${from}`, destination: `/en/perfume/${to}`, permanent: true },
      ]),
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Photos we upload ourselves to Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
