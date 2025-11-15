import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Only add CSP in development to allow localhost connections
    // Frontend doesn't directly call rendering service (backend does),
    // but this prevents Chrome DevTools CSP errors
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' http://localhost:* ws://localhost:*;",
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
