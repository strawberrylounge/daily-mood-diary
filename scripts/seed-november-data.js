const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// .env 파일 읽기
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};

envContent.split("\n").forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join("=").trim();
    }
  }
});

const supabaseUrl = envVars.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ .env 파일에 EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 11월 예시 데이터 생성 (양극성 장애 패턴 시뮬레이션)
function generateNovemberData(userId) {
  const data = [];

  for (let day = 1; day <= 30; day++) {
    const date = `2025-11-${String(day).padStart(2, '0')}`;

    let record = {
      user_id: userId,
      record_date: date,
      anxiety_score: 4 + Math.floor(Math.random() * 5) - 2, // 2-6
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
}

async function seedData() {
  try {
    console.log("🔄 Supabase에 연결 중...");

    // 현재 로그인된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("❌ 로그인된 사용자가 없습니다.");
      console.log("\n📱 해결 방법:");
      console.log("1. 앱에서 로그인해주세요");
      console.log("2. 또는 이메일을 직접 입력하려면 스크립트를 수정해주세요\n");
      process.exit(1);
    }

    console.log(`✅ 사용자 확인: ${user.email}`);
    console.log(`📅 사용자 ${user.email}의 11월 데이터를 생성합니다...`);

    // 11월 데이터 생성
    const novemberData = generateNovemberData(user.id);

    // 기존 11월 데이터 삭제 (있다면)
    console.log("🗑️  기존 11월 데이터 삭제 중...");
    const { error: deleteError } = await supabase
      .from("daily_records")
      .delete()
      .eq("user_id", user.id)
      .gte("record_date", "2025-11-01")
      .lte("record_date", "2025-11-30");

    if (deleteError) {
      console.warn("⚠️  기존 데이터 삭제 중 오류:", deleteError.message);
    }

    // 새 데이터 삽입
    console.log("📝 새로운 11월 데이터 삽입 중...");
    const { data, error } = await supabase
      .from("daily_records")
      .insert(novemberData);

    if (error) {
      console.error("❌ 데이터 삽입 중 오류:", error);
      process.exit(1);
    }

    console.log("\n✅ 11월 데이터 30일 생성 완료!");
    console.log("\n📊 데이터 패턴:");
    console.log("  • 1주차 (1-7일): 경조증 상태");
    console.log("  • 2주차 초반 (8-10일): 혼재 상태 (조증+우울 동시)");
    console.log("  • 2-3주차 (11-17일): 우울 상태");
    console.log("  • 3주차 후반 (18-22일): 안정기");
    console.log("  • 4주차 초반 (23-25일): 다시 조증");
    console.log("  • 4주차 후반 (26-30일): 혼재 상태\n");

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  }
}

seedData();
