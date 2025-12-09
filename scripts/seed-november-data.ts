import { createClient } from "@supabase/supabase-js";

// .env 파일에서 값을 직접 읽어옵니다
// 실행 전에 여기에 직접 URL과 KEY를 입력해주세요
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 11월 예시 데이터 생성 (양극성 장애 패턴 시뮬레이션)
const generateNovemberData = (userId: string) => {
  const data = [];

  for (let day = 1; day <= 30; day++) {
    const date = `2024-11-${String(day).padStart(2, '0')}`;

    let record: any = {
      user_id: userId,
      record_date: date,
      anxiety_score: 4 + Math.floor(Math.random() * 5) - 2, // 2-6
      tension_score: 4 + Math.floor(Math.random() * 5) - 2,
      anger_score: 4 + Math.floor(Math.random() * 5) - 2,
      interest_score: 4 + Math.floor(Math.random() * 5) - 2,
      activity_score: 4 + Math.floor(Math.random() * 5) - 2,
      thought_speed_score: 4 + Math.floor(Math.random() * 5) - 2,
      thought_content_score: 4 + Math.floor(Math.random() * 5) - 2,
      sleep_hours: 6 + Math.random() * 3, // 6-9시간
      weight: 65 + (Math.random() - 0.5) * 4, // 63-67kg
      has_menstruation: false,
      has_binge_eating: Math.random() > 0.8,
      has_physical_pain: Math.random() > 0.85,
      has_panic_attack: Math.random() > 0.9,
      has_exercise: Math.random() > 0.6,
      has_crying: Math.random() > 0.8,
      has_alcohol: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
      notes: "",
    };

    // 양극성 장애 패턴 시뮬레이션
    if (day <= 7) {
      // 1주차: 경조증 상태
      record.mood_up_score = 2 + Math.floor(Math.random() * 2); // 2-3
      record.tension_score = 6 + Math.floor(Math.random() * 2); // 6-7
      record.activity_score = 6 + Math.floor(Math.random() * 2);
      record.thought_speed_score = 6 + Math.floor(Math.random() * 2);
      record.sleep_hours = 4 + Math.random() * 2; // 4-6시간
    } else if (day <= 10) {
      // 2주차 초반: 혼재 상태 (조증 + 우울 동시)
      record.mood_up_score = 1 + Math.floor(Math.random() * 2); // 1-2
      record.mood_down_score = -2 - Math.floor(Math.random() * 2); // -2~-3
      record.anxiety_score = 6 + Math.floor(Math.random() * 2); // 6-7
      record.anger_score = 6 + Math.floor(Math.random() * 2);
      record.has_crying = Math.random() > 0.5;
      record.has_panic_attack = Math.random() > 0.7;
      record.sleep_hours = 3 + Math.random() * 2; // 3-5시간
    } else if (day <= 17) {
      // 2주차 후반 ~ 3주차 초반: 우울 상태
      record.mood_down_score = -3 - Math.floor(Math.random() * 2); // -3~-4
      record.interest_score = 2 + Math.floor(Math.random() * 2); // 2-3
      record.activity_score = 2 + Math.floor(Math.random() * 2);
      record.thought_content_score = 2 + Math.floor(Math.random() * 2);
      record.has_crying = Math.random() > 0.4;
      record.sleep_hours = 9 + Math.random() * 3; // 9-12시간
    } else if (day <= 22) {
      // 3주차 후반: 안정기
      record.mood_up_score = 0;
      record.anxiety_score = 4 + Math.floor(Math.random() * 3); // 4-6
      record.sleep_hours = 7 + Math.random() * 2; // 7-9시간
    } else if (day <= 25) {
      // 4주차 초반: 다시 조증 시작
      record.mood_up_score = 3 + Math.floor(Math.random() * 2); // 3-4
      record.tension_score = 7 + Math.floor(Math.random() * 2);
      record.activity_score = 7 + Math.floor(Math.random() * 2);
      record.thought_speed_score = 7 + Math.floor(Math.random() * 2);
      record.sleep_hours = 3 + Math.random() * 2; // 3-5시간
      record.has_binge_eating = Math.random() > 0.6;
    } else {
      // 4주차 후반: 혼재 상태
      record.mood_up_score = 2 + Math.floor(Math.random() * 2); // 2-3
      record.mood_down_score = -1 - Math.floor(Math.random() * 2); // -1~-2
      record.anxiety_score = 6 + Math.floor(Math.random() * 2);
      record.has_crying = Math.random() > 0.6;
      record.sleep_hours = 4 + Math.random() * 2; // 4-6시간
    }

    data.push(record);
  }

  return data;
};

async function seedData() {
  try {
    // 현재 로그인된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("로그인된 사용자가 없습니다. 먼저 로그인해주세요.");
      console.log("앱에서 로그인한 후 다시 시도해주세요.");
      process.exit(1);
    }

    console.log(`사용자 ${user.email}의 11월 데이터를 생성합니다...`);

    // 11월 데이터 생성
    const novemberData = generateNovemberData(user.id);

    // 기존 11월 데이터 삭제 (있다면)
    const { error: deleteError } = await supabase
      .from("daily_records")
      .delete()
      .eq("user_id", user.id)
      .gte("record_date", "2024-11-01")
      .lte("record_date", "2024-11-30");

    if (deleteError) {
      console.error("기존 데이터 삭제 중 오류:", deleteError);
    }

    // 새 데이터 삽입
    const { data, error } = await supabase
      .from("daily_records")
      .insert(novemberData);

    if (error) {
      console.error("데이터 삽입 중 오류:", error);
      process.exit(1);
    }

    console.log("✅ 11월 데이터 30일 생성 완료!");
    console.log("패턴: 1주차(조증) → 2주차 초반(혼재) → 2-3주차(우울) → 3주차 후반(안정) → 4주차(조증→혼재)");

  } catch (error) {
    console.error("오류 발생:", error);
    process.exit(1);
  }
}

seedData();
