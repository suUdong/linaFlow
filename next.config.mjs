/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  env: {
    SITE_NAME: "리나 필라테스",
    SITE_DESCRIPTION: "리나 필라테스 회원 전용 온라인 콘텐츠 서비스",
  },
};

export default nextConfig;
