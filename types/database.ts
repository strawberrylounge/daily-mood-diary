export type DailyRecord = {
  id: string;
  user_id?: string;
  record_date: string; // YYYY-MM-DD 형식
  mood_up_score?: number; // 0~4
  mood_down_score?: number; // -4~-1
  anxiety_score: number; // -4~4
  tension_score: number;
  anger_score: number;
  interest_score: number;
  activity_score: number;
  thought_speed_score: number;
  thought_content_score: number;
  sleep_hours: number; // 0.5 단위
  weight?: number;
  has_menstruation: boolean;
  has_binge_eating: boolean;
  has_physical_pain: boolean;
  has_panic_attack: boolean;
  has_alcohol: number; // 잔 수
  notes?: string;
  created_at: string;
  updated_at?: string;
};
