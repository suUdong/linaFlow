-- 회원 테이블 생성
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nickname TEXT,
  birth_date DATE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expired_at TIMESTAMP WITH TIME ZONE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  coupon_code TEXT
);

-- 콘텐츠 테이블 생성
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_key TEXT UNIQUE NOT NULL,
  youtube_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visible BOOLEAN DEFAULT TRUE,
  category TEXT,
  duration TEXT,
  formatted_duration TEXT
);

-- 쿠폰 테이블 생성
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_months INTEGER NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES members(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES members(id)
);

-- 시청 로그 테이블 생성
CREATE TABLE watch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시스템 설정 테이블 생성
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auto_approve_signup BOOLEAN DEFAULT FALSE,
  default_expiration_months INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_role ON members(role);
CREATE INDEX idx_members_coupon_code ON members(coupon_code);
CREATE INDEX idx_contents_visible ON contents(visible);
CREATE INDEX idx_contents_video_key ON contents(video_key);
CREATE INDEX idx_watch_logs_member ON watch_logs(member_id);
CREATE INDEX idx_watch_logs_content ON watch_logs(content_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_used ON coupons(is_used);

-- RLS(Row Level Security) 정책 설정
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 공개 정책 (모든 사용자가 접근 가능)
CREATE POLICY "Anyone can read visible contents" ON contents
  FOR SELECT USING (visible = TRUE);

-- 인증된 사용자만 접근 가능한 정책
CREATE POLICY "Authenticated users can read their own info" ON members
  FOR SELECT USING (auth.uid() = id);

-- 관리자 정책 (나중에 관리자 계정 설정 후 구현)
-- 여기서는 예시로 일단 모든 접근을 허용
CREATE POLICY "Full access to all tables for now" ON members FOR ALL USING (TRUE);
CREATE POLICY "Full access to all contents for now" ON contents FOR ALL USING (TRUE);
CREATE POLICY "Full access to all logs for now" ON watch_logs FOR ALL USING (TRUE);
CREATE POLICY "Full access to all coupons for now" ON coupons FOR ALL USING (TRUE);
CREATE POLICY "Full access to system settings for now" ON system_settings FOR ALL USING (TRUE);

-- 샘플 데이터 (선택사항)
INSERT INTO members (name, nickname, email, password_hash, status, role)
VALUES 
  ('관리자', '관리자', 'admin@example.com', '123456', 'active', 'admin'),
  ('테스트회원', '테스트', 'test@example.com', '123456', 'active', 'user');

INSERT INTO contents (title, description, video_key, youtube_url, visible)
VALUES 
  ('시작하기 가이드', '필라테스 시작하기 전 알아야 할 내용입니다', 'guide001', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', TRUE),
  ('기초 스트레칭', '초보자를 위한 스트레칭 영상입니다', 'stretch001', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', TRUE);

-- 초기 시스템 설정
INSERT INTO system_settings (auto_approve_signup, default_expiration_months)
VALUES (FALSE, 3); 