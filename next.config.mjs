/** @type {import('next').NextConfig} */

import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/api/:path*', // 本地 API 路径
            destination: 'https://ctf.a1natas.com/api/:path*', // 实际目标 API 地址
          },
        ];
    },
    reactStrictMode: false,
    output: "standalone",
};

export default withNextIntl(nextConfig);