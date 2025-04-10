-- 콘텐츠 테이블에 재생 시간 관련 컬럼 추가
ALTER TABLE contents ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS formatted_duration TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_contents_duration ON contents(duration);

-- 스키마 업데이트 로그
INSERT INTO migration_logs (migration_name, applied_at, description)
VALUES (
  'add_duration_column', 
  NOW(), 
  '콘텐츠 테이블에 재생 시간 컬럼 추가 및 인덱스 생성'
); 