// 이 파일은 Next.js 미들웨어 설정을 비활성화합니다.
// 로컬스토리지 기반 인증을 위해 서버 측 미들웨어를 사용하지 않습니다.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 기본 리다이렉션 미들웨어
export function middleware(request: NextRequest) {
  // 루트 경로('/')에 대해서만 리다이렉션 처리
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// 미들웨어는 루트 경로만 처리
export const config = {
  matcher: ["/"],
};
