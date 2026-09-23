/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hebrew moved from /he to the site root ("/"); English moved from "/" to /en.
  // These keep old bookmarks and search-engine links to the Hebrew pages working.
  async redirects() {
    return [
      { source: '/he', destination: '/', permanent: true },
      { source: '/he/:path*', destination: '/:path*', permanent: true },
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
