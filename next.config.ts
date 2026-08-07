import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle so the production Docker image stays
  // small and does not need the full node_modules tree at runtime.
  output: "standalone",

  // Keep React's extra development checks on; multi-tenant pages render
  // user-supplied data, so surfacing issues early is valuable.
  reactStrictMode: true,
};

export default nextConfig;
