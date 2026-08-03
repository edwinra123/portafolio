import type { NextConfig } from "next";

const repoName = "portafolio";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.treinta.co" },
      {
        protocol: "https",
        hostname: "us-east-1-prod-treinta-assets-bucket.s3.amazonaws.com",
      },
      { protocol: "https", hostname: "imgproxy.treinta.co" },
    ],
  },
};

export default nextConfig;
