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
    question: "꾸준한 약물 복용",
    options: [
      { id: "q1_a1", text: "약을 의사의 지시대로 모두 복용하였다.", score: 40 },
      {
        id: "q1_a2",
        text: "한 두 번 어쩔 수 없이 복용하지 못했지만 나머지 약은 모두 복용했다.",
        score: 20,
      },
      {
        id: "q1_a3",
        text: "일주일 정도 약을 복용하지 못했지만 나머지 약은 모두 복용했다.",
        score: 10,
      },
      { id: "q1_a4", text: "일주일 이상 약을 복용하지 않았다.", score: 0 },
    ],
  },
  {
    id: "q2",
    question: "규칙적인 수면",
    options: [
      {
        id: "q2_a1",
        text: "평일과 주말 모두 오전에 일정한 시간에 일어나 활동을 시작했다.",
        score: 20,
      },
      {
        id: "q2_a2",
        text: "대부분은 일정한 시간에 일어났지만 일주일 정도는 늦게까지 자거나 낮잠을 잤다.",
        score: 10,
      },
      {
        id: "q2_a3",
        text: "한 달 동안 절반 정도는 규칙적으로 일어났지만, 나머지 절반 정도는 그렇지 못했다.",
        score: 5,
      },
      {
        id: "q2_a4",
        text: "대부분의 날 동안 일어나는 시간이 뒤죽박죽이었다.",
        score: 0,
      },
    ],
  },
  {
    id: "q3",
    question: "꾸준한 운동(걷기, 등산, 산책, 헬스, 요가 등)",
    options: [
      { id: "q3_a1", text: "거의 매일 한 시간 이상 운동을 했다.", score: 10 },
      { id: "q3_a2", text: "거의 매일 30분 이상 운동을 했다.", score: 5 },
      {
        id: "q3_a3",
        text: "운동을 하지 않은 날이 운동을 한 날보다 많았다.",
        score: 2,
      },
      { id: "q3_a4", text: "거의 운동을 하지 않았다.", score: 0 },
    ],
  },
  {
    id: "q4",
    question: "햇빛 보기",
    options: [
      {
        id: "q4_a1",
        text: "매일 낮에 밖으로 나가 30분 이상 햇빛을 쬐었다.",
        score: 5,
      },
      {
        id: "q4_a2",
        text: "한 달 동안 절반 이상의 날 동안 낮에 밖에 나가 햇빛을 쬐거나 실내에서라도 햇빛을 쬐었다.",
        score: 3,
      },
      {
        id: "q4_a3",
        text: "한 달 동안 절반 이하의 날 동안 낮에 밖에 나가 햇빛을 쬐거나 실내에서라도 햇빛을 쬐었다.",
        score: 1,
      },
      {
        id: "q4_a4",
        text: "대부분의 날 동안 낮에 외출하지 않고, 실내에서도 햇빛을 보지 않았다.",
        score: 0,
      },
    ],
  },
  {
    id: "q5",
    question: "음주 피하기",
    options: [
      {
        id: "q5_a1",
        text: "술을 전혀 마시지 않았다.",
        score: 5,
      },
      {
        id: "q5_a2",
        text: "하루 정도 한 잔 정도 마셨다.",
        score: 3,
      },
      {
        id: "q5_a3",
        text: "7일 정도 한 번에 서너 잔 이내로 마셨다.",
        score: 1,
      },
      {
        id: "q5_a4",
        text: "술을 마신 날이 7일 이상이거나, 과음하는 날이 있었다.",
        score: 0,
      },
    ],
  },
  {
    id: "q6",
    question: "대인관계 관리",
    options: [
      {
        id: "q6_a1",
        text: "다른 사람들의 반응에 크게 개의치 않았다.",
        score: 5,
      },
      {
        id: "q6_a2",
        text: "다른 사람들의 반응에 영향을 받았지만 오래 담아두지 않았다.",
        score: 3,
      },
      {
        id: "q6_a3",
        text: "다른 사람들의 반응에 영향을 받아 자주 오래 생각했다.",
        score: 1,
      },
      {
        id: "q6_a4",
        text: "다른 사람들의 반응에 크게 영향을 받아 하루 종일 생각했다.",
        score: 0,
      },
    ],
  },
  {
    id: "q7",
    question:
      "무리하고 성급하거나 자극적인 일을 피하기\\n(과소비, 도박, 과도한 활동, 무리한 약속, 폭식, 약물의 남용, 무리한 계획이나 상상 등)",
    options: [
      {
        id: "q7_a1",
        text: "꾸준히 나아질 수 있다는 믿음을 가지고 무리하거나 성급하지 않고, 주어진 일을 해왔다.",
        score: 5,
      },
      {
        id: "q7_a2",
        text: "무리하고 성급하거나 자극적인 일을 생각하기도 했지만 대부분 일상을 일정하게 유지하며 보냈다.",
        score: 3,
      },
      {
        id: "q7_a3",
        text: "때때로 기분을 빨리 나아지게 하기 위해 무리하고 성급하거나 자극적인 일을 일을 계획하거나 시도했다.",
        score: 1,
      },
      {
        id: "q7_a4",
        text: "거의 매일 무리하고 성급하거나 자극적인 일들도 계획하거나 시도했다.",
        score: 0,
      },
    ],
  },
  {
    id: "q8",
    question: "스스로의 기분을 관찰하기",
    options: [
      {
        id: "q8_a1",
        text: "매일 기분기록지를 적고, 자신의 기분을 관찰했다.",
        score: 5,
      },
      {
        id: "q8_a2",
        text: "한 달 동안 절반 이상은 기분기록지를 적고, 밀린 날 동안의 기분을 늦게라도 살펴보았다.",
        score: 3,
      },
      {
        id: "q8_a3",
        text: "기분기록지를 거의 적지 않았고, 가끔 자기 기분을 돌아보았다.",
        score: 1,
      },
      {
        id: "q8_a4",
        text: "스스로의 기분을 생각하지 않고 지냈다.",
        score: 0,
      },
    ],
  },
  {
    id: "q9",
    question: "스스로를 아껴 주기",
    options: [
      {
        id: "q9_a1",
        text: "스스로에게 엄격하거나 자책하지 않고 잘하지 못할 때에도 자신을 격려했다.",
        score: 5,
      },
      {
        id: "q9_a2",
        text: "자책할 때도 있었지만 곧 자신에게 너그러운 마음을 가지려고 했다.",
        score: 3,
      },
      {
        id: "q9_a3",
        text: "완벽주의적 생각에 자책하고 후회하는 날이 많았다.",
        score: 1,
      },
      {
        id: "q9_a4",
        text: "거의 대부분 자기를 책망하고 비난하며 보내고 자신에 대해 긍정적으로 생각할 수 없었다.",
        score: 0,
      },
    ],
  },
];
