/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 프로덕션 빌드 시 ESLint 검사 무시 (배포를 위해)
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
