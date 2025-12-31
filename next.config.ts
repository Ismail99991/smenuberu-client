import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },

  async rewrites() {
    return [
      {
        source: "/__api/:path*",
        destination: "https://api.smenube.ru/:path*",
      },
    ];
  },
};

export default nextConfig;
