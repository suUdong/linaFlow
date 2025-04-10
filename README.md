# LinaFlow - 프리미엄 필라테스 콘텐츠 솔루션

필라테스 전문가가 자신의 회원들에게 고품질 운동 관련 영상 콘텐츠를 안전하게 공유할 수 있는 프리미엄 온라인 플랫폼입니다.

## 주요 기능

- 전문가는 웹 화면에서 콘텐츠(영상)를 간편하게 업로드할 수 있습니다.
- 회원 관리 기능으로 가입승인, 자동 만료 처리 등을 손쉽게 처리합니다.
- 회원은 PC 및 모바일에서 안전한 로그인 후 콘텐츠를 시청할 수 있습니다.
- 모든 화면은 PC와 모바일에 최적화된 반응형 디자인을 적용했습니다.
- YouTube 숨김 영상 기술로 저장 공간 비용을 절감하면서도 콘텐츠 보안을 유지합니다.
- 회원가입 신청 및 관리자 승인 프로세스로 사용자 검증이 가능합니다.

## 시작하기

### 필수 조건

- Node.js 18.0.0 이상
- Supabase 계정

### 설치

1. 저장소 복제

```bash
git clone https://github.com/yourusername/linaflow.git
cd linaflow
```

2. 의존성 설치

```bash
npm install
```

3. Supabase 설정

#### a. Supabase 계정 생성 및 프로젝트 설정

- [Supabase](https://supabase.com)에 가입 후 새 프로젝트를 생성합니다.
- 프로젝트 생성 후 대시보드에서 `Settings` > `API` 메뉴로 이동하여 `URL`과 `anon` 키를 확인합니다.

#### b. 환경 변수 설정

`.env.local.example` 파일을 복사하여 `.env.local` 파일을 생성하고 Supabase 정보를 입력하세요.

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 Supabase URL과 anon key를 입력합니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### c. 데이터베이스 스키마 설정

- Supabase 대시보드의 `SQL Editor` 메뉴로 이동합니다.
- `supabase_setup.sql` 파일의 내용을 복사하여 실행합니다.
- 이 스크립트는 필요한 테이블과 샘플 데이터를 생성합니다.

4. 연결 테스트

- 개발 서버를 실행합니다.
- `/test-supabase` 경로로 접속하여 연결이 정상적으로 이루어졌는지 확인합니다.

5. 개발 서버 실행

```bash
npm run dev
```

## 배포

Vercel 또는 Netlify와 같은 서비스를 사용하여 배포할 수 있습니다.

```bash
npm run build
```

## 기술 스택

- Next.js - 프론트엔드 프레임워크
- Tailwind CSS - 스타일링
- Supabase - 백엔드 (인증, 데이터베이스)
- Plyr.js - 비디오 플레이어
