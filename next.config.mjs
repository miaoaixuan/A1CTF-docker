/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/api/:path*', // 本地 API 路径
            destination: 'https://ctf.a1natas.com/api/:path*', // 实际目标 API 地址
          },
        ];
    },
};

export default nextConfig;