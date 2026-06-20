import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // proxy.ts buffers request bodies; increase limit to allow 300 MB video uploads
    proxyClientMaxBodySize: "310mb",
  },
};

export default nextConfig;
