# RenaFlow - 프리미엄 필라테스 콘텐츠 솔루션

필라테스 전문가가 자신의 회원들에게 고품질 운동 관련 영상 콘텐츠를 안전하게 공유할 수 있는 프리미엄 온라인 플랫폼입니다.

## 주요 기능

- 전문가는 웹 화면에서 콘텐츠(영상)를 간편하게 업로드할 수 있습니다.
- 카테고리 기반 콘텐츠 관리로 체계적인 콘텐츠 구성이 가능합니다.
- 자동 재생 시간 추출 기능으로 편리한 컨텐츠 관리가 가능합니다.
- 회원 관리 기능으로 가입승인, 자동 만료 처리 등을 손쉽게 처리합니다.
- 회원은 PC 및 모바일에서 안전한 로그인 후 콘텐츠를 시청할 수 있습니다.
- 모든 화면은 PC와 모바일에 최적화된 반응형 디자인을 적용했습니다.
- YouTube 숨김 영상 기술로 저장 공간 비용을 절감하면서도 콘텐츠 보안을 유지합니다.
- 회원가입 신청 및 관리자 승인 프로세스로 사용자 검증이 가능합니다.

## 기술 스택

- **프론트엔드**: Next.js, React, Tailwind CSS
- **백엔드/인증**: Supabase
- **데이터베이스**: PostgreSQL (Supabase)
- **동영상 호스팅**: YouTube 비공개 영상

## 최근 업데이트

### 콘텐츠 관리 기능 향상

- 카테고리별 콘텐츠 분류 및 필터링 시스템 추가
- YouTube API 연동을 통한 동영상 재생 시간 자동 추출
- 콘텐츠 재생 시간 데이터베이스 저장 및 표시

### 모바일 UI/UX 개선

- 모바일 최적화된 상단 네비게이션 디자인
- 반응형 카테고리 필터 및 콘텐츠 카드
- 다양한 화면 크기에 최적화된 레이아웃 조정

## 시작하기

### 필수 조건

- Node.js 18.0.0 이상
- Supabase 계정
- YouTube API 키 (동영상 정보 추출용)

### 설치

1. 저장소 복제

```bash
git clone https://github.com/yourusername/renaflow.git
cd renaflow
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정
   `.env.local` 파일을 생성하고 다음 변수들을 설정합니다:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_KEY=your-supabase-anon-key
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key
```

4. 개발 서버 시작

```bash
npm run dev
```

5. 데이터베이스 마이그레이션 실행
   Supabase 프로젝트에서 `supabase_setup.sql` 및 필요한 마이그레이션 파일들을 실행합니다.

## 라이센스

이 프로젝트는 [MIT 라이센스](LICENSE)를 따릅니다.
