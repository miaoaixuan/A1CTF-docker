/** @type {import('next').NextConfig} */

import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: 'https://ctf.a1natas.com/api/:path*',
          },
          {
            source: '/hub/:path*',
            destination: 'https://ctf.a1natas.com/hub/:path*',
          },
          {
            source: '/assets/:path*',
            destination: 'https://ctf.a1natas.com/assets/:path*' 
          }
        ];
    },
    reactStrictMode: false,
    output: "standalone",
};

export default withNextIntl(nextConfig);