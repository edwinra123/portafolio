import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.treinta.co" },
      { protocol: "https", hostname: "us-east-1-prod-treinta-assets-bucket.s3.amazonaws.com" },
      { protocol: "https", hostname: "imgproxy.treinta.co" },
    ],
  },
};

export default nextConfig;
