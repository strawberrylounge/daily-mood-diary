import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { Colors } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

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

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 기존 데이터
  const [recordDate, setRecordDate] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<number[]>([]);
  // 음수를 처리 하지 못하는 라이브러리 버그로 0이 -4, 8이 4
  const [anxiety, setAnxiety] = useState(4);
  const [tension, setTension] = useState(4);
  const [anger, setAnger] = useState(4);
  const [interest, setInterest] = useState(4);
  const [activity, setActivity] = useState(4);
  const [thoughtSpeed, setThoughtSpeed] = useState(4);
  const [thoughtContent, setThoughtContent] = useState(4);
  const [sleepHours, setSleepHours] = useState("");
  const [weight, setWeight] = useState("");
  const [hasMenstruation, setHasMenstruation] = useState(false);
  const [hasBingeEating, setHasBingeEating] = useState(false);
  const [hasPhysicalPain, setHasPhysicalPain] = useState(false);
  const [hasPanicAttack, setHasPanicAttack] = useState(false);
  const [alcoholAmount, setAlcoholAmount] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchRecord();
  }, [id]);

  // 슬라이드 값 변환 함수
  const convertToDisplay = (value: number) => value - 4; // 0~8 -> -4~4
  const convertFromDisplay = (value: number) => value + 4; // -4~4 -> 0~8

  // 기분 버튼 클릭 핸들러
  const handleMoodPress = (value: number) => {
    if (selectedMoods.includes(value)) {
      // 이미 선택된 경우 제거
      setSelectedMoods(selectedMoods.filter((mood) => mood !== value));
    } else if (selectedMoods.length < 2) {
      // 2개 미만인 경우 추가
      setSelectedMoods([...selectedMoods, value]);
    }
    // 2개 이상이면 무시
  };

  const fetchRecord = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_records")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // 데이터 채우기
      setRecordDate(data.record_date);

      // 기분 점수를 배열로 변환
      const moods: number[] = [];
      if (data.mood_up_score !== null) moods.push(data.mood_up_score);
      if (data.mood_down_score !== null) moods.push(data.mood_down_score);
      setSelectedMoods(moods);

      setAnxiety(data.anxiety_score);
      setTension(data.tension_score);
      setAnger(data.anger_score);
      setInterest(data.interest_score);
      setActivity(data.activity_score);
      setThoughtSpeed(data.thought_speed_score);
      setThoughtContent(data.thought_content_score);
      setSleepHours(data.sleep_hours.toString());
      setWeight(data.weight ? data.weight.toString() : "");
      setHasMenstruation(data.has_menstruation);
      setHasBingeEating(data.has_binge_eating);
      setHasPhysicalPain(data.has_physical_pain);
      setHasPanicAttack(data.has_panic_attack);
      setAlcoholAmount(data.has_alcohol.toString());
      setNotes(data.notes || "");
    } catch (error: any) {
      // Alert.alert("오류", error.message); // 웹 호환 전
      showAlert("오류", error.message); // 웹 호환
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!sleepHours || parseFloat(sleepHours) <= 0) {
      // Alert.alert("오류", "수면 시간을 입력해주세요."); // 웹 호환 전
      showAlert("오류", "수면 시간을 입력해주세요."); // 웹 호환
      return;
    }

    setSaving(true);

    try {
      // 기분 점수 계산: 양수/0은 mood_up_score, 음수는 mood_down_score
      const moodUpValues = selectedMoods.filter((m) => m >= 0);
      const moodDownValues = selectedMoods.filter((m) => m < 0);

      const { error } = await supabase
        .from("daily_records")
        .update({
          mood_up_score: moodUpValues.length > 0 ? moodUpValues[0] : null,
          mood_down_score: moodDownValues.length > 0 ? moodDownValues[0] : null,
          anxiety_score: convertFromDisplay(anxiety),
          tension_score: convertFromDisplay(tension),
          anger_score: convertFromDisplay(anger),
          interest_score: convertFromDisplay(interest),
          activity_score: convertFromDisplay(activity),
          thought_speed_score: convertFromDisplay(thoughtSpeed),
          thought_content_score: convertFromDisplay(thoughtContent),
          sleep_hours: parseFloat(sleepHours),
          weight: weight ? parseFloat(weight) : null,
          has_menstruation: hasMenstruation,
          has_binge_eating: hasBingeEating,
          has_physical_pain: hasPhysicalPain,
          has_panic_attack: hasPanicAttack,
          has_alcohol: parseFloat(alcoholAmount),
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // Alert.alert("성공", "기록이 수정되었습니다!"); // 웹 호환 전
      showAlert("성공", "기록이 수정되었습니다!"); // 웹 호환
      router.back();
    } catch (error: any) {
      // Alert.alert("오류", error.message); // 웹 호환 전
      showAlert("오류", error.message); // 웹 호환
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>기분 기록 수정</Text>
      <Text style={styles.date}>{recordDate}</Text>

      {/* 기분 */}
      <View style={styles.section}>
        <Text style={styles.label}>기분 (최대 2개 선택)</Text>
        <View style={styles.buttonRow}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreButton,
                selectedMoods.includes(val) && styles.scoreButtonActive,
              ]}
              onPress={() => handleMoodPress(val)}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  selectedMoods.includes(val) && styles.scoreButtonTextActive,
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
        <Text style={styles.label}>불안: {convertToDisplay(anxiety)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={8}
          step={1}
          value={anxiety}
          onValueChange={setAnxiety}
          minimumTrackTintColor={Colors.light.primary}
          maximumTrackTintColor={Colors.light.border}
          thumbTintColor={Colors.light.primary}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>-4</Text>
          <Text style={styles.sliderLabelText}>0</Text>
          <Text style={styles.sliderLabelText}>4</Text>
        </View>
      </View>

      {/* 긴장/흥분 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>긴장/흥분: {convertToDisplay(tension)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={8}
          step={1}
          value={tension}
          onValueChange={setTension}
          minimumTrackTintColor={Colors.light.primary}
          maximumTrackTintColor={Colors.light.border}
          thumbTintColor={Colors.light.primary}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>-4</Text>
          <Text style={styles.sliderLabelText}>0</Text>
          <Text style={styles.sliderLabelText}>4</Text>
        </View>
      </View>

      {/* 짜증/분노 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>짜증/분노: {convertToDisplay(anger)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={8}
          step={1}
          value={anger}
          onValueChange={setAnger}
          minimumTrackTintColor={Colors.light.primary}
          maximumTrackTintColor={Colors.light.border}
          thumbTintColor={Colors.light.primary}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>-4</Text>
          <Text style={styles.sliderLabelText}>0</Text>
          <Text style={styles.sliderLabelText}>4</Text>
        </View>
      </View>

      {/* 관심/흥미 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>
          관심/흥미: {convertToDisplay(interest)}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={8}
          step={1}
          value={interest}
          onValueChange={setInterest}
          minimumTrackTintColor={Colors.light.primary}
          maximumTrackTintColor={Colors.light.border}
          thumbTintColor={Colors.light.primary}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>-4</Text>
          <Text style={styles.sliderLabelText}>0</Text>
          <Text style={styles.sliderLabelText}>4</Text>
        </View>
      </View>

      {/* 활동량 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>활동량: {convertToDisplay(activity)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={8}
          step={1}
          value={activity}
          onValueChange={setActivity}
          minimumTrackTintColor={Colors.light.primary}
          maximumTrackTintColor={Colors.light.border}
          thumbTintColor={Colors.light.primary}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>-4</Text>
          <Text style={styles.sliderLabelText}>0</Text>
          <Text style={styles.sliderLabelText}>4</Text>
        </View>
      </View>

      {/* 생각의 속도 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>
          생각의 속도/양: {convertToDisplay(thoughtSpeed)}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={8}
          step={1}
          value={thoughtSpeed}
          onValueChange={setThoughtSpeed}
          minimumTrackTintColor={Colors.light.primary}
          maximumTrackTintColor={Colors.light.border}
          thumbTintColor={Colors.light.primary}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>-4</Text>
          <Text style={styles.sliderLabelText}>0</Text>
          <Text style={styles.sliderLabelText}>4</Text>
        </View>
      </View>

      {/* 생각의 내용 점수 */}
      <View style={styles.section}>
        <Text style={styles.label}>
          생각의 내용: {convertToDisplay(thoughtContent)}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={8}
          step={1}
          value={thoughtContent}
          onValueChange={setThoughtContent}
          minimumTrackTintColor={Colors.light.primary}
          maximumTrackTintColor={Colors.light.border}
          thumbTintColor={Colors.light.primary}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>-4</Text>
          <Text style={styles.sliderLabelText}>0</Text>
          <Text style={styles.sliderLabelText}>4</Text>
        </View>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.label}>메모</Text>
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
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleUpdate}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "저장 중..." : "수정 완료"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.light.text,
  },
  date: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: Colors.light.text,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: -5,
  },
  sliderLabelText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scoreButton: {
    minWidth: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  scoreButtonText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  scoreButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
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
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
