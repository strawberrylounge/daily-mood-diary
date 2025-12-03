import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

// ========================================
// 웹 호환 코드 (나중에 삭제 예정)
// ========================================
const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};
// ========================================

export default function RecordScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const today = params.date || new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // 상태 관리
  const [moodUp, setMoodUp] = useState<number | null>(null);
  const [moodDown, setMoodDown] = useState<number | null>(null);
  const [anxiety, setAnxiety] = useState(0);
  const [tension, setTension] = useState(0);
  const [anger, setAnger] = useState(0);
  const [interest, setInterest] = useState(0);
  const [activity, setActivity] = useState(0);
  const [thoughtSpeed, setThoughtSpeed] = useState(0);
  const [thoughtContent, setThoughtContent] = useState(0);
  const [sleepHours, setSleepHours] = useState("7");
  const [weight, setWeight] = useState("");
  const [hasMenstruation, setHasMenstruation] = useState(false);
  const [hasBingeEating, setHasBingeEating] = useState(false);
  const [hasPhysicalPain, setHasPhysicalPain] = useState(false);
  const [hasPanicAttack, setHasPanicAttack] = useState(false);
  const [alcoholAmount, setAlcoholAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // 유효성 검사
    if (sleepHours === null || parseFloat(sleepHours) <= 0) {
      // Alert.alert("오류", "수면 시간을 입력해주세요."); // 웹 호환 전
      showAlert("오류", "수면 시간을 입력해주세요."); // 웹 호환
      return;
    }

    setLoading(true);

    try {
      const payload = {
        record_date: today,
        mood_up_score: moodUp,
        mood_down_score: moodDown,
        anxiety_score: anxiety,
        tension_score: tension,
        anger_score: anger,
        interest_score: interest,
        activity_score: activity,
        thought_speed_score: thoughtSpeed,
        thought_content_score: thoughtContent,
        sleep_hours: parseFloat(sleepHours),
        weight: weight ? parseFloat(weight) : null,
        has_menstruation: hasMenstruation,
        has_binge_eating: hasBingeEating,
        has_physical_pain: hasPhysicalPain,
        has_panic_attack: hasPanicAttack,
        has_alcohol: parseFloat(alcoholAmount),
        notes: notes || null,
      };

      // 디버깅용 로그
      console.log("전송 데이터:", JSON.stringify(payload, null, 2));

      const { data, error } = await supabase
        .from("daily_records")
        .insert(payload);

      if (error) {
        console.log("에러 상세:", error); // 에러 상세 확인
        throw error;
      }

      // Alert.alert("성공", "오늘의 기분이 저장되었습니다!"); // 웹 호환 전
      showAlert("성공", "오늘의 기분이 저장되었습니다!"); // 웹 호환
      router.back();
    } catch (error: any) {
      console.error("전체 에러:", error);
      // Alert.alert("오류", error.message); // 웹 호환 전
      showAlert("오류", error.message); // 웹 호환
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>오늘의 기분 기록</Text>
      <Text style={styles.date}>{today}</Text>

      {/* 기분 Up/Down */}
      <View style={styles.section}>
        <Text style={styles.label}>기분 Up (0~4)</Text>
        <View style={styles.buttonRow}>
          {[0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                moodUp === val && styles.scoreButtonActive,
              ]}
              onPress={() => setMoodUp(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  moodUp === val && styles.scoreButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>기분 Down (-4~-1)</Text>
        <View style={styles.buttonRow}>
          {[-4, -3, -2, -1].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                moodDown === val && styles.scoreButtonActive,
              ]}
              onPress={() => setMoodDown(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  moodDown === val && styles.scoreButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 불안 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>불안 (-4~4) *</Text>
        <View style={styles.buttonRow}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                anxiety === val && styles.scoreButtonActive,
              ]}
              onPress={() => setAnxiety(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  anxiety === val && styles.scoreButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 긴장/흥분 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>긴장/흥분 (-4~4) *</Text>
        <View style={styles.buttonRow}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                tension === val && styles.scoreButtonActive,
              ]}
              onPress={() => setTension(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  tension === val && styles.scoreButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 짜증/분노 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>짜증/분노 (-4~4) *</Text>
        <View style={styles.buttonRow}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                anger === val && styles.scoreButtonActive,
              ]}
              onPress={() => setAnger(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  anger === val && styles.scoreButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 관심/흥미 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>관심/흥미 (-4~4) *</Text>
        <View style={styles.buttonRow}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                interest === val && styles.scoreButtonActive,
              ]}
              onPress={() => setInterest(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  interest === val && styles.scoreButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 활동량 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>활동량 (-4~4) *</Text>
        <View style={styles.buttonRow}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                activity === val && styles.scoreButtonActive,
              ]}
              onPress={() => setActivity(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  activity === val && styles.scoreButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 생각의 속도 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>생각의 속도/양 (-4~4) *</Text>
        <View style={styles.buttonRow}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                thoughtSpeed === val && styles.scoreButtonActive,
              ]}
              onPress={() => setThoughtSpeed(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  thoughtSpeed === val && styles.scoreButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 생각의 내용 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>생각의 내용 (-4~4) *</Text>
        <View style={styles.buttonRow}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                thoughtContent === val && styles.scoreButtonActive,
              ]}
              onPress={() => setThoughtContent(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  thoughtContent === val && styles.scoreButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 수면 시간 */}
      <View style={styles.section}>
        <Text style={styles.label}>수면 시간 (시간) *</Text>
        <TextInput
          style={styles.input}
          value={sleepHours}
          onChangeText={setSleepHours}
          keyboardType="decimal-pad"
          placeholder="예: 7 또는 7.5"
        />
      </View>

      {/* 체중 */}
      <View style={styles.section}>
        <Text style={styles.label}>체중 (kg) - 선택사항</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="예: 65.5"
        />
      </View>

      {/* 음주 */}
      <View style={styles.section}>
        <Text style={styles.label}>음주 (잔)</Text>
        <TextInput
          style={styles.input}
          value={alcoholAmount}
          onChangeText={setAlcoholAmount}
          keyboardType="decimal-pad"
          placeholder="예: 2 또는 1.5"
        />
      </View>

      {/* Boolean 항목들 */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text>생리</Text>
          <Switch value={hasMenstruation} onValueChange={setHasMenstruation} />
        </View>
        <View style={styles.switchRow}>
          <Text>폭식</Text>
          <Switch value={hasBingeEating} onValueChange={setHasBingeEating} />
        </View>
        <View style={styles.switchRow}>
          <Text>신체 통증</Text>
          <Switch value={hasPhysicalPain} onValueChange={setHasPhysicalPain} />
        </View>
        <View style={styles.switchRow}>
          <Text>공황 발작</Text>
          <Switch value={hasPanicAttack} onValueChange={setHasPanicAttack} />
        </View>
      </View>

      {/* 메모 */}
      <View style={styles.section}>
        <Text style={styles.label}>메모 (선택사항)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="특이사항을 기록하세요"
          multiline
          numberOfLines={4}
        />
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? "저장 중..." : "저장하기"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  scoreButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  scoreButtonText: {
    fontSize: 14,
    color: "#000",
  },
  scoreButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
