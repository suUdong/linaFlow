-- 컨텐츠 테이블에 카테고리 컬럼 추가
ALTER TABLE contents ADD COLUMN IF NOT EXISTS category TEXT;

-- 기존 콘텐츠의 카테고리를 '기본' 으로 설정 (선택사항)
UPDATE contents SET category = '기본' WHERE category IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category);

-- 스키마 업데이트 로그
INSERT INTO migration_logs (migration_name, applied_at, description)
VALUES (
  'add_category_column', 
  NOW(), 
  '콘텐츠 테이블에 카테고리 컬럼 추가 및 인덱스 생성'
); 