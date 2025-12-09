-- 월간 셀프 평가 테이블 생성

-- 1. 월간 셀프 평가 기록 테이블
CREATE TABLE IF NOT EXISTS monthly_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_month DATE NOT NULL, -- 평가 대상 월 (YYYY-MM-01 형식)
  total_score INTEGER NOT NULL, -- 총점 (0-100)
  answers JSONB NOT NULL, -- 각 질문의 답변 저장 { "question_id": "answer_id" }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, assessment_month) -- 한 달에 한 번만 평가 가능
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_monthly_assessments_user_id ON monthly_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_assessments_month ON monthly_assessments(assessment_month);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE monthly_assessments ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 평가만 볼 수 있음
CREATE POLICY "Users can view own assessments" ON monthly_assessments
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 평가만 생성할 수 있음
CREATE POLICY "Users can create own assessments" ON monthly_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 평가만 수정할 수 있음
CREATE POLICY "Users can update own assessments" ON monthly_assessments
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 평가만 삭제할 수 있음
CREATE POLICY "Users can delete own assessments" ON monthly_assessments
  FOR DELETE USING (auth.uid() = user_id);

-- 5. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_monthly_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_assessments_updated_at
  BEFORE UPDATE ON monthly_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_assessments_updated_at();

-- 확인 쿼리
SELECT * FROM monthly_assessments LIMIT 5;
