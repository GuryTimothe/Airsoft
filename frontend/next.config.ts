import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",

  async headers() {
    return [
      {
        // Everything the Next server answers, pages and the /api/* rewrites
        // alike, so a response proxied from the backend is covered too.
        source: "/:path*",
        headers: securityHeaders(process.env.NODE_ENV === "production"),
      },
    ];
  },

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
