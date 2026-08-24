import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",

  async rewrites() {
    const internalApiUrl =
      process.env.INTERNAL_API_URL?.replace(/\/$/, "") || "http://backend:8000";

    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
