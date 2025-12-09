// 월간 셀프 평가 관련 타입

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: AssessmentOption[];
}

export interface AssessmentOption {
  id: string;
  text: string;
  score: number; // 0-100점
}

export interface MonthlyAssessment {
  id: string;
  user_id: string;
  assessment_month: string; // YYYY-MM-01 형식
  total_score: number; // 0-100
  answers: Record<string, string>; // { question_id: option_id }
  created_at: string;
  updated_at?: string;
}

// 임시 질문 데이터 (추후 수정 가능)
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1",
    question: "한 달간 매일매일 약을 먹었습니까?",
    options: [
      { id: "q1_a1", text: "매일 빠지지 않았다", score: 25 },
      { id: "q1_a2", text: "하루 정도 깜빡했다", score: 15 },
      { id: "q1_a3", text: "일주일 이상 깜빡했다", score: 5 },
      { id: "q1_a4", text: "아예 잊어버렸다", score: 0 },
    ],
  },
  {
    id: "q2",
    question: "규칙적인 생활 패턴을 유지했습니까?",
    options: [
      { id: "q2_a1", text: "매우 규칙적이었다", score: 25 },
      { id: "q2_a2", text: "대체로 규칙적이었다", score: 15 },
      { id: "q2_a3", text: "불규칙했다", score: 5 },
      { id: "q2_a4", text: "매우 불규칙했다", score: 0 },
    ],
  },
  {
    id: "q3",
    question: "충분한 수면을 취했습니까?",
    options: [
      { id: "q3_a1", text: "매일 충분히 잤다", score: 25 },
      { id: "q3_a2", text: "대체로 충분했다", score: 15 },
      { id: "q3_a3", text: "자주 부족했다", score: 5 },
      { id: "q3_a4", text: "거의 부족했다", score: 0 },
    ],
  },
  {
    id: "q4",
    question: "스트레스 관리를 잘 했습니까?",
    options: [
      { id: "q4_a1", text: "매우 잘 관리했다", score: 25 },
      { id: "q4_a2", text: "대체로 관리했다", score: 15 },
      { id: "q4_a3", text: "관리가 어려웠다", score: 5 },
      { id: "q4_a4", text: "관리하지 못했다", score: 0 },
    ],
  },
];
