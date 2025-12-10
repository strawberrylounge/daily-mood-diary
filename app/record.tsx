import { router, useLocalSearchParams, useRouter } from "expo-router";
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
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

// ========================================
// [TODO] 테스트용 웹 호환 코드 (나중에 삭제 예정)
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
  const { user, loading: authLoading } = useAuth();
  const routerNav = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const today = params.date || new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  useEffect(() => {
    if (!authLoading && !user) {
      routerNav.replace("/sign-in");
    }
  }, [user, authLoading]);

  // 상태 관리
  const [selectedMoods, setSelectedMoods] = useState<number[]>([]);
  // 음수를 처리 하지 못하는 라이브러리 버그로 0이 -4, 8이 4
  const [anxiety, setAnxiety] = useState();
  const [tension, setTension] = useState();
  const [anger, setAnger] = useState();
  const [interest, setInterest] = useState();
  const [activity, setActivity] = useState();
  const [thoughtSpeed, setThoughtSpeed] = useState();
  const [thoughtContent, setThoughtContent] = useState();
  const [sleepHours, setSleepHours] = useState("0");
  const [weight, setWeight] = useState("");
  const [hasMenstruation, setHasMenstruation] = useState(false);
  const [hasBingeEating, setHasBingeEating] = useState(false);
  const [hasPhysicalPain, setHasPhysicalPain] = useState(false);
  const [hasPanicAttack, setHasPanicAttack] = useState(false);
  const [hasExercise, setHasExercise] = useState(false);
  const [hasCrying, setHasCrying] = useState(false);
  const [alcoholAmount, setAlcoholAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3 단계

  // 2단계 항목들의 입력 여부 추적
  const [touchedFields, setTouchedFields] = useState({
    anxiety: false,
    tension: false,
    anger: false,
    interest: false,
    activity: false,
    thoughtSpeed: false,
    thoughtContent: false,
  });

  // 슬라이드 값 변환 함수
  const convertToDisplay = (value: number) => value - 4; // 0~8 -> -4~4
  const convertFromDisplay = (value: number) => value + 4; // -4~4 -> 0~8

  // 점수에 따른 색상 반환 함수
  const getScoreColor = (score: number): string => {
    const colorMap: { [key: number]: string } = {
      // 음수 점수: #C07060의 shades (진함 -> 연함)
      "-4": "#C07060",
      "-3": "#CC8578",
      "-2": "#D89A90",
      "-1": "#E4AFA8",
      // 0점: 중립 색상
      "0": "#D9A860",
      // 양수 점수: #7A9E7E의 shades (연함 -> 진함)
      "1": "#A4BFA6",
      "2": "#8FB193",
      "3": "#7A9E7E",
      "4": "#6A8E6E",
    };
    return colorMap[score] || "#D9A860";
  };

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

  // 2단계 점수 버튼 클릭 핸들러 (터치 여부 추적)
  const handleScorePress = (
    field: keyof typeof touchedFields,
    setValue: (value: number) => void,
    score: number
  ) => {
    setValue(convertFromDisplay(score)); // -4~4 -> 0~8로 변환
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // 단계별 유효성 검사
  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      // 1단계: 기분이 최소 1개 이상 선택되어야 함
      return selectedMoods.length > 0;
    }
    if (currentStep === 2) {
      // 2단계: 모든 슬라이더 항목이 최소 한 번 이상 터치되어야 함
      return Object.values(touchedFields).every((touched) => touched);
    }
    return true;
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (!canProceedToNextStep()) {
      if (currentStep === 1) {
        showAlert("알림", "기분을 최소 1개 이상 선택해주세요.");
      } else if (currentStep === 2) {
        showAlert("알림", "모든 항목을 설정해주세요.");
      }
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  // 이전 단계로 이동
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    if (!user?.id) {
      showAlert("오류", "로그인이 필요합니다.");
      return;
    }

    // 유효성 검사
    if (selectedMoods.length === 0) {
      showAlert("오류", "기분을 최소 1개 이상 선택해주세요.");
      return;
    }

    if (sleepHours === null || parseFloat(sleepHours) <= 0) {
      // Alert.alert("오류", "수면 시간을 입력해주세요."); // 웹 호환 전
      showAlert("오류", "수면 시간을 입력해주세요."); // 웹 호환
      return;
    }

    setLoading(true);

    try {
      // 기분 점수 계산: 양수/0은 mood_up_score, 음수는 mood_down_score
      const moodUpValues = selectedMoods.filter((m) => m >= 0);
      const moodDownValues = selectedMoods.filter((m) => m < 0);

      const payload = {
        user_id: user.id,
        record_date: today,
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
        has_exercise: hasExercise,
        has_crying: hasCrying,
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
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>오늘의 기분 기록</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
      </View>
      <Text style={styles.stepIndicator}>{currentStep} / 3 단계</Text>

      {/* 1단계: 기분 */}
      {currentStep === 1 && (
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
      )}

      {/* 2단계: 점수 버튼 항목들 */}
      {currentStep === 2 && (
        <>
          {/* 불안 점수 */}
          <View style={styles.section}>
            <Text style={styles.label}>불안</Text>
            <View style={styles.scoreButtonsContainer}>
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.circleButton,
                    { backgroundColor: getScoreColor(score) },
                    convertToDisplay(anxiety) === score &&
                      styles.circleButtonSelected,
                  ]}
                  onPress={() => handleScorePress("anxiety", setAnxiety, score)}
                >
                  <Text style={styles.circleButtonText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 긴장/흥분 점수 */}
          <View style={styles.section}>
            <Text style={styles.label}>긴장/흥분</Text>
            <View style={styles.scoreButtonsContainer}>
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.circleButton,
                    { backgroundColor: getScoreColor(score) },
                    convertToDisplay(tension) === score &&
                      styles.circleButtonSelected,
                  ]}
                  onPress={() => handleScorePress("tension", setTension, score)}
                >
                  <Text style={styles.circleButtonText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 짜증/분노 점수 */}
          <View style={styles.section}>
            <Text style={styles.label}>짜증/분노</Text>
            <View style={styles.scoreButtonsContainer}>
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.circleButton,
                    { backgroundColor: getScoreColor(score) },
                    convertToDisplay(anger) === score &&
                      styles.circleButtonSelected,
                  ]}
                  onPress={() => handleScorePress("anger", setAnger, score)}
                >
                  <Text style={styles.circleButtonText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 관심/흥미 점수 */}
          <View style={styles.section}>
            <Text style={styles.label}>관심/흥미</Text>
            <View style={styles.scoreButtonsContainer}>
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.circleButton,
                    { backgroundColor: getScoreColor(score) },
                    convertToDisplay(interest) === score &&
                      styles.circleButtonSelected,
                  ]}
                  onPress={() =>
                    handleScorePress("interest", setInterest, score)
                  }
                >
                  <Text style={styles.circleButtonText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 활동량 점수 */}
          <View style={styles.section}>
            <Text style={styles.label}>활동량</Text>
            <View style={styles.scoreButtonsContainer}>
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.circleButton,
                    { backgroundColor: getScoreColor(score) },
                    convertToDisplay(activity) === score &&
                      styles.circleButtonSelected,
                  ]}
                  onPress={() =>
                    handleScorePress("activity", setActivity, score)
                  }
                >
                  <Text style={styles.circleButtonText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 생각의 속도 점수 */}
          <View style={styles.section}>
            <Text style={styles.label}>생각의 속도/양</Text>
            <View style={styles.scoreButtonsContainer}>
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.circleButton,
                    { backgroundColor: getScoreColor(score) },
                    convertToDisplay(thoughtSpeed) === score &&
                      styles.circleButtonSelected,
                  ]}
                  onPress={() =>
                    handleScorePress("thoughtSpeed", setThoughtSpeed, score)
                  }
                >
                  <Text style={styles.circleButtonText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 생각의 내용 점수 */}
          <View style={styles.section}>
            <Text style={styles.label}>생각의 내용</Text>
            <View style={styles.scoreButtonsContainer}>
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.circleButton,
                    { backgroundColor: getScoreColor(score) },
                    convertToDisplay(thoughtContent) === score &&
                      styles.circleButtonSelected,
                  ]}
                  onPress={() =>
                    handleScorePress("thoughtContent", setThoughtContent, score)
                  }
                >
                  <Text style={styles.circleButtonText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {/* 3단계: 나머지 항목들 */}
      {currentStep === 3 && (
        <>
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
              <Switch
                value={hasMenstruation}
                onValueChange={setHasMenstruation}
              />
            </View>
            <View style={styles.switchRow}>
              <Text>폭식</Text>
              <Switch
                value={hasBingeEating}
                onValueChange={setHasBingeEating}
              />
            </View>
            <View style={styles.switchRow}>
              <Text>신체 통증</Text>
              <Switch
                value={hasPhysicalPain}
                onValueChange={setHasPhysicalPain}
              />
            </View>
            <View style={styles.switchRow}>
              <Text>공황 발작</Text>
              <Switch
                value={hasPanicAttack}
                onValueChange={setHasPanicAttack}
              />
            </View>
            <View style={styles.switchRow}>
              <Text>울음</Text>
              <Switch value={hasCrying} onValueChange={setHasCrying} />
            </View>
            <View style={styles.switchRow}>
              <Text>운동</Text>
              <Switch value={hasExercise} onValueChange={setHasExercise} />
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
        </>
      )}

      {/* 네비게이션 버튼 */}
      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Text style={styles.navButtonText}>이전</Text>
          </TouchableOpacity>
        )}

        {currentStep < 3 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={handleNext}
          >
            <Text style={styles.navButtonPrimaryText}>다음</Text>
          </TouchableOpacity>
        )}

        {currentStep === 3 && (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonPrimary,
              loading && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.navButtonPrimaryText}>
              {loading ? "저장 중..." : "저장하기"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: Colors.light.text,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    color: Colors.light.text,
  },
  date: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  stepIndicator: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "600",
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
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 40,
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  navButtonPrimary: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  scoreButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  circleButtonSelected: {
    borderColor: Colors.light.text,
    borderWidth: 3,
  },
  circleButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
});
