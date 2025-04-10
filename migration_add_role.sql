-- 기존 members 테이블에 role 필드 추가
ALTER TABLE members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- role 필드를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);

-- 관리자 이메일을 가진 계정에 admin 역할 부여
-- 예시: admin@example.com 계정을 관리자로 설정
UPDATE members SET role = 'admin' WHERE email = 'admin@example.com'; 