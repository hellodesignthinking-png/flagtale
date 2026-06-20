/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@deck.gl/core",
    "@deck.gl/layers",
    "@deck.gl/react",
    "@deck.gl/mapbox",
    "@deck.gl/aggregation-layers",
  ],
  experimental: {
    // 선택 의존성(서버 PDF). 미설치여도 빌드 안전하도록 번들 제외.
    serverComponentsExternalPackages: ["playwright"],
  },
};

export default nextConfig;
