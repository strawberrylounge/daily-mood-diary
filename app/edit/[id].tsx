import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";
import Loading from "../../components/Loading";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
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

// 평가 기준 가이드 데이터
type ScoreGuide = {
  title: string;
  subtitle?: string;
  subtitleDescription?: string;
  table: { score: number; description: string }[];
};

const scoreGuides: { [key: string]: ScoreGuide } = {
  mood: {
    title: "기분 평가 기준",
    table: [
      {
        score: -4,
        description:
          "극도로 우울하거나 쳐진다. 자신을 돌보는 일과 해야 할 일을 전혀 못하고 극심한 불안, 초조, 자살사고로 인해 다른 사람의 돌봄을 요한다.",
      },
      {
        score: -3,
        description:
          "꽤 우울하고 쳐진다. 외출, 쇼핑 등 사회 생활에 뚜렷한 지장이 있고 학교, 직장에 나가지 못하거나 집안 일을 하지 못하는 일이 생긴다. <b>노력하여도 업무를 수행하는 기능의 저하가 뚜렷하다.</b>",
      },
      {
        score: -2,
        description:
          "우울하고 쳐지고, 사회 생활에 뚜렷한 지장이 있어 주변에서 우울한 것에 대해 알아본다. <b>일상생활에 약간의 지장이 생기지만 노력을 하면 일상을 유지 할 수 있다.</b>",
      },
      {
        score: -1,
        description:
          "시큰둥하고 의욕이 다소 떨어져 있는 등의 우울한 증상을 가지고는 있으나 업무를 수행하는 기능에 별 영향이 없음. <b>주관적으로 느끼는 우울은 뚜렷하지만 주변에서 우울한 것에 대해 잘 모르는 경우가 많다.</b>",
      },
      {
        score: 0,
        description:
          "기분이 보통이고 편안한 상태. 해야 하는 일을 모두 수행함. 업무수행 정도에 변화가 없고 기능의 변화가 없음.",
      },
      {
        score: 1,
        description:
          "평상시 기분이 좋은 것 이상으로 기분이 좋고, 의욕이 늘어나며, 때때로 짜증이 나기도 하는 등의 증상을 주관적으로 느끼지만, <b>주변에서 그 변화를 알아보지 못한다.</b> 집중을 하면 해야 하는 일을 실수하지 않고 마칠 수 있다.",
      },
      {
        score: 2,
        description:
          "말이나 하고 싶은 게 많아지고, 자신감에 차있고, 과도하게 짜증을 내는 등의 들뜬 증상이 뚜렷하여 <b>주변에서 평소와 다르다는 피드백을 받는다.</b> 일상생활에 약간의 지장이 생기지만 노력하면 일상을 유지할 수 있다.",
      },
      {
        score: 3,
        description:
          "나선다, 기고만장 하다, 감당하기 힘들 만큼 일을 벌이고 사소한 일에도 울화통을 터트리는 등의 증상으로 <b>주변 사람들과 다투거나 법적인 문제가 생기기도 한다.</b> 감당하기 힘든 정도의 지출을 하거나 충동적인 여행을 떠난다.",
      },
      {
        score: 4,
        description:
          "극도로 들뜸, 사람이나 물건에 대해 폭력을 휘두르기도 함. 환청이나 망상이 심하여 입원을 요하는 상태.",
      },
    ],
  },
  anxiety: {
    title: "두려움/소심함/걱정/불안 평가 기준",
    subtitle: "정서 반응",
    subtitleDescription:
      "정서반응이 일어날 만한 사건이 없었더라도 그러한 사건이 있었다면 어땠을 지 생각해보며 적어볼 수 있습니다.<br /><br />+: 평소에는 신경 쓰지 않을 일에 대해서도 두렵고, 소심하고, 걱정하고 불안하게 됨.<br />-: 평소에는 느껴야할 두려움/소심함/걱정/불안도 느낄 수 없음.<br /><br />※기분증상과 정서반응이 같은 방향으로 함께 움직이는지 관찰합니다.",
    table: [
      {
        score: -4,
        description: "위협적인 자극이나 사건도 전혀 대수롭지 않게 느껴짐.",
      },
      {
        score: -3,
        description: "매우 중요한 일들이 있어도 전혀 대수롭지 않게 느껴짐.",
      },
      {
        score: -2,
        description:
          "보다 중요하게 신경써야 하는 일들에 대해서도 대수롭지 않게 느껴짐.",
      },
      {
        score: -1,
        description:
          "사소하게 신경써야 하는 일들에 대해 반응하지 않고 지나치게 됨.",
      },
      { score: 0, description: "평소 편안할 때의 모습과 가장 가까운 정도." },
      {
        score: 1,
        description:
          "평소엔 신경쓰이지 않을 일들이 이런 감정을 일으키지만 내색하지 않음.",
      },
      {
        score: 2,
        description:
          "신경쓰이는 일들에 대해서 이런 감정을 말이나 행동으로 표현하게 됨.",
      },
      {
        score: 3,
        description:
          "이런 감정을 느끼는 것을 다른 사람이 쉽게 알 수 있을 정도로 표현.",
      },
      {
        score: 4,
        description: "이러한 감정에 휩싸여서 다른 감정을 느낄 수 없음.",
      },
    ],
  },
  anger: {
    title: "짜증/분노 평가 기준",
    subtitle: "정서 반응",
    subtitleDescription:
      "정서반응이 일어날 만한 사건이 없었더라도 그러한 사건이 있었다면 어땠을 지 생각해보며 적어볼 수 있습니다.<br /><br />+: 평소라면 지나칠 만한 일에도 신경이 예민해지고 화가 난다.<br />-: 누구라도 화를 내야할 만한 일에 대해서도 아무렇지 않다.<br /><br />※기분증상과 정서반응이 같은 방향으로 함께 움직이는지 관찰합니다.",
    table: [
      {
        score: -4,
        description:
          "위협적인 자극이나 사건도 아무렇지 않게 느껴지고 반응하지 않음.",
      },
      {
        score: -3,
        description: "갈등이 있더라도 나서야 하는 일에 대해서도 나서지 못함.",
      },
      {
        score: -2,
        description:
          "말이나 행동으로 스트레스에 대해 표현해야 할 때에도 표현하지 못함.",
      },
      {
        score: -1,
        description: "사소한 스트레스 대해 반응하지 않고 지나치게 됨.",
      },
      { score: 0, description: "합리적인 범위 안에서의 짜증과 분노." },
      {
        score: 1,
        description:
          "평소라면 신경쓰이지 않을 일들이 신경쓰이지만 내색하지 않음.",
      },
      {
        score: 2,
        description: "신경쓰이는 일들에 대해서 말이나 행동으로 표현하게 됨.",
      },
      {
        score: 3,
        description:
          "신경쓰이는 일들에 대해 다른 사람과 갈등이 생길 정도로 표현하게 됨.",
      },
      {
        score: 4,
        description:
          "신경쓰이는 일들에 대해서 폭력, 폭언, 충동적인 행동/생각을 하게 됨.",
      },
    ],
  },
  interest: {
    title: "관심/흥미/즐거움/소비/계획 평가 기준",
    subtitle: "의욕",
    subtitleDescription:
      "+: 평소보다 관심과 흥미가 많아지고, 같은 일을 해도 더욱 즐겁고, 돈을 쓸 일도 많아지거나, 투자를 하거나, 일이나 취미, 약속 등 계획이 많아짐.<br />-: 평소보다 하는 일이 관심도 흥미도 떨어지고, 즐겁던 일도 즐겁지 않고, 돈을 쓰는 일도 줄어들고, 일이나 취미, 약속에 대한 생각도 줄어듦.",
    table: [
      {
        score: -4,
        description:
          "거의 시간, 에너지, 돈을 사용하는 일이 없고, 공허하게 보냄.",
      },
      {
        score: -3,
        description:
          "평소보다 크게 감소하여 시간, 에너지, 돈을 쓰는 일이 매우 적음.",
      },
      { score: -2, description: "평소보다 확연히 감소함." },
      { score: -1, description: "평소보다 조금 감소함." },
      {
        score: 0,
        description: "평소 편안할 때의 모습과 가장 가까운 정도를 0으로 함.",
      },
      { score: 1, description: "평소보다 조금 증가함." },
      { score: 2, description: "평소보다 확연히 증가함." },
      {
        score: 3,
        description:
          "평소보다 크게 증가하여 상당한 시간, 에너지, 돈을 사용하여 부담이 됨.",
      },
      {
        score: 4,
        description:
          "매우 큰 시간, 에너지, 돈을 사용하여 상당한 부담이 되고 어려움이 발생.",
      },
    ],
  },
  activity: {
    title: "활동량 평가 기준",
    subtitle: "의욕",
    subtitleDescription:
      "+: 평소보다 많이 움직이고 많은 일을 처리함.<br />-: 평소보다 적게 움직이고, 일도 적게 함.",
    table: [
      {
        score: -4,
        description: "매우 활동량이 적어 거의 하루 종일 누워만 있는 정도.",
      },
      {
        score: -3,
        description: "평소보다 크게 감소하여 활동량이 매우 적은 정도.",
      },
      { score: -2, description: "평소보다 확연히 감소함." },
      { score: -1, description: "평소보다 조금 감소함." },
      {
        score: 0,
        description: "평소 편안할 때의 모습과 가장 가까운 정도를 0으로 함.",
      },
      { score: 1, description: "평소보다 조금 증가함." },
      { score: 2, description: "평소보다 확연히 증가함." },
      {
        score: 3,
        description:
          "평소보다 크게 증가하여 평소 체력에 비하면 부담이 될 정도.",
      },
      {
        score: 4,
        description:
          "매우 활동량이 많아 평소 체력에 비하면 상당한 부담이 되어 소진될 정도.",
      },
    ],
  },
  thoughtSpeed: {
    title: "생각의 속도와 양 평가 기준",
    subtitle: "생각",
    subtitleDescription:
      "+: 생각이 빨라지고 꼬리에 꼬리를 물고 이어짐, 많은 아이디어가 떠오르거나 생각에 골몰함. 때로는 말수가 많아지거나 글을 많이 쓰게 됨.<br />-: 생각이 느려지고 떠오르지 않음. 말을 하는 것도 쉽지 않고, 떠오르는 것이 적음.",
    table: [
      {
        score: -4,
        description:
          "매우 크게 감소하여 의사소통이 불가능하고 거의 생각이 없는 정도.",
      },
      {
        score: -3,
        description:
          "평소보다 크게 감소하여 다른 사람이 보기에 느리고 답답하게 느껴짐.",
      },
      { score: -2, description: "평소보다 확연히 감소함." },
      { score: -1, description: "평소보다 조금 감소함." },
      {
        score: 0,
        description: "평소 편안할 때의 모습과 가장 가까운 정도를 0으로 함.",
      },
      { score: 1, description: "평소보다 조금 증가함." },
      { score: 2, description: "평소보다 확연히 증가함." },
      {
        score: 3,
        description:
          "평소보다 크게 증가하여 다른 사람이 듣는다면 따라잡기 어려움.",
      },
      {
        score: 4,
        description:
          "매우 크게 증가하여 자기 자신도 따라가기 어렵고 혼란스러움.",
      },
    ],
  },
  thoughtContent: {
    title: "생각의 내용 평가 기준",
    subtitle: "생각",
    subtitleDescription:
      "+: 평소보다 낙관적임. 무엇이든 잘될 것 같은 생각이 들고 자신감이 생김. 심한 경우 자신이 특별하다는 생각이 듦.<br />-: 평소보다 부정적임. 무엇이든 잘되지 않을 것 같고, 자신감이 떨어짐. 심한 경우 죄책감이나 죽고 싶은 생각이 듦.",
    table: [
      {
        score: -4,
        description:
          "매우 부정적이어서 모든 일이 잘되지 않고, 삶의 의미가 없고, 무능력하다고 생각.",
      },
      {
        score: -3,
        description:
          "평소보다 크게 부정적인 생각이 늘어나 다른 사람들이 듣는다면 지나치다고 생각할 정도.",
      },
      { score: -2, description: "평소보다 확연히 부정적인 생각을 많이 함." },
      { score: -1, description: "평소보다 조금 부정적인 생각을 많이 함." },
      {
        score: 0,
        description: "평소 편안할 때의 모습과 가장 가까운 정도를 0으로 함.",
      },
      { score: 1, description: "평소보다 조금 긍정적인 생각을 많이 함." },
      { score: 2, description: "평소보다 확연히 긍정적인 생각을 많이 함." },
      {
        score: 3,
        description:
          "평소보다 크게 긍정적인 생각이 늘어나 다른 사람들이 듣는다면 지나치다고 생각할 정도.",
      },
      {
        score: 4,
        description:
          "매우 긍정적이어서 모든 일이 잘되고, 자신이 특별하고, 능력이 있다고 생각.",
      },
    ],
  },
};

export default function EditScreen() {
  const { user, loading: authLoading } = useAuth();
  const routerNav = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      routerNav.replace("/sign-in");
    }
  }, [user, authLoading]);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // 기존 데이터
  const [recordDate, setRecordDate] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<number[]>([]);
  // 음수를 처리 하지 못하는 라이브러리 버그로 0이 -4, 8이 4
  const [anxiety, setAnxiety] = useState(4);
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
  const [hasExercise, setHasExercise] = useState(false);
  const [hasCrying, setHasCrying] = useState(false);
  const [alcoholAmount, setAlcoholAmount] = useState("0");
  const [notes, setNotes] = useState("");

  // 가이드 모달 상태
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [currentGuide, setCurrentGuide] = useState<string | null>(null);

  // 가이드 모달 열기
  const openGuideModal = (guideKey: string) => {
    setCurrentGuide(guideKey);
    setShowGuideModal(true);
  };

  // 가이드 모달 닫기
  const closeGuideModal = () => {
    setShowGuideModal(false);
    setCurrentGuide(null);
  };

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

  useEffect(() => {
    if (user?.id && id) {
      fetchRecord();
    } else if (!user?.id) {
      setLoading(false);
    }
  }, [user?.id, id]);

  // 슬라이드 값 변환 함수
  const convertToDisplay = (value: number) => value - 4; // 0~8 -> -4~4
  const convertFromDisplay = (value: number) => value + 4; // -4~4 -> 0~8

  // 기분 버튼 클릭 핸들러
  const handleMoodPress = (value: number) => {
    if (!isEditMode) return; // 수정 모드가 아니면 무시

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
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("daily_records")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
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
      setHasExercise(data.has_exercise);
      setHasCrying(data.has_crying);
      setAlcoholAmount(data.has_alcohol.toString());
      setNotes(data.notes || "");
    } catch (error: any) {
      showAlert("오류", error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user?.id) return;

    // 유효성 검사
    if (selectedMoods.length === 0) {
      showAlert("오류", "기분을 최소 1개 이상 선택해주세요.");
      return;
    }

    if (!sleepHours || parseFloat(sleepHours) <= 0) {
      showAlert("오류", "수면 시간을 입력해주세요.");
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
          has_exercise: hasExercise,
          has_crying: hasCrying,
          has_alcohol: parseFloat(alcoholAmount),
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      showAlert("성공", "기록이 수정되었습니다!");
      setIsEditMode(false); // 수정 모드 종료
    } catch (error: any) {
      showAlert("오류", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("정말로 이 기록을 삭제하시겠습니까?");
      if (confirmed) {
        deleteRecord();
      }
    } else {
      Alert.alert(
        "삭제 확인",
        "정말로 이 기록을 삭제하시겠습니까?",
        [
          {
            text: "취소",
            style: "cancel",
          },
          {
            text: "삭제",
            style: "destructive",
            onPress: deleteRecord,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const deleteRecord = async () => {
    if (!user?.id) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("daily_records")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      showAlert("성공", "기록이 삭제되었습니다!");
      router.back();
    } catch (error: any) {
      showAlert("오류", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  // 읽기 모드 UI
  if (!isEditMode) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>기분 기록</Text>
        <Text style={styles.date}>{recordDate}</Text>

        <View style={styles.readOnlyCard}>
          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>기분</Text>
            <Text style={styles.readOnlyValue}>{selectedMoods.join(", ")}</Text>
          </View>

          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>불안</Text>
            <Text style={styles.readOnlyValue}>
              {convertToDisplay(anxiety)}
            </Text>
          </View>

          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>짜증/분노</Text>
            <Text style={styles.readOnlyValue}>{convertToDisplay(anger)}</Text>
          </View>

          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>관심/흥미</Text>
            <Text style={styles.readOnlyValue}>
              {convertToDisplay(interest)}
            </Text>
          </View>

          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>활동량</Text>
            <Text style={styles.readOnlyValue}>
              {convertToDisplay(activity)}
            </Text>
          </View>

          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>생각의 속도/양</Text>
            <Text style={styles.readOnlyValue}>
              {convertToDisplay(thoughtSpeed)}
            </Text>
          </View>

          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>생각의 내용</Text>
            <Text style={styles.readOnlyValue}>
              {convertToDisplay(thoughtContent)}
            </Text>
          </View>

          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>수면 시간</Text>
            <Text style={styles.readOnlyValue}>{sleepHours}시간</Text>
          </View>

          {weight && (
            <View style={styles.readOnlySection}>
              <Text style={styles.readOnlyLabel}>체중</Text>
              <Text style={styles.readOnlyValue}>{weight}kg</Text>
            </View>
          )}

          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>음주</Text>
            <Text style={styles.readOnlyValue}>{alcoholAmount}잔</Text>
          </View>

          {(hasMenstruation ||
            hasBingeEating ||
            hasPhysicalPain ||
            hasPanicAttack) && (
            <View style={styles.readOnlySection}>
              <Text style={styles.readOnlyLabel}>특이사항</Text>
              <View style={styles.booleanTags}>
                {hasMenstruation && <Text style={styles.booleanTag}>생리</Text>}
                {hasBingeEating && <Text style={styles.booleanTag}>폭식</Text>}
                {hasPhysicalPain && (
                  <Text style={styles.booleanTag}>신체 통증</Text>
                )}
                {hasPanicAttack && (
                  <Text style={styles.booleanTag}>공황 발작</Text>
                )}
                {hasCrying && <Text style={styles.booleanTag}>울음</Text>}
                {hasExercise && <Text style={styles.booleanTag}>운동</Text>}
              </View>
            </View>
          )}

          {notes && (
            <View style={styles.readOnlySection}>
              <Text style={styles.readOnlyLabel}>메모</Text>
              <Text style={styles.readOnlyValue}>{notes}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditMode(true)}
        >
          <Text style={styles.editButtonText}>수정하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, saving && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={saving}
        >
          <Text style={styles.deleteButtonText}>삭제하기</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // 수정 모드 UI
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>기분 기록 수정</Text>
      <Text style={styles.date}>{recordDate}</Text>

      {/* 기분 */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>기분 (최대 2개 선택)</Text>
          <TouchableOpacity
            style={styles.guideIcon}
            onPress={() => openGuideModal("mood")}
          >
            <Text style={styles.guideIconText}>ⓘ</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.scoreButtonsContainer}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.circleButton,
                { backgroundColor: getScoreColor(val) },
                selectedMoods.includes(val) && styles.circleButtonSelected,
              ]}
              onPress={() => handleMoodPress(val)}
            >
              <Text style={styles.circleButtonText}>{val}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 정서 반응 Subtitle */}
      <Text style={styles.subtitle}>정서 반응</Text>

      {/* 두려움/소심함/걱정/불안 점수 */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>두려움/소심함/걱정/불안</Text>
          <TouchableOpacity
            style={styles.guideIcon}
            onPress={() => openGuideModal("anxiety")}
          >
            <Text style={styles.guideIconText}>ⓘ</Text>
          </TouchableOpacity>
        </View>
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
              onPress={() => setAnxiety(convertFromDisplay(score))}
            >
              <Text style={styles.circleButtonText}>{score}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 짜증/분노 점수 */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>짜증/분노</Text>
          <TouchableOpacity
            style={styles.guideIcon}
            onPress={() => openGuideModal("anger")}
          >
            <Text style={styles.guideIconText}>ⓘ</Text>
          </TouchableOpacity>
        </View>
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
              onPress={() => setAnger(convertFromDisplay(score))}
            >
              <Text style={styles.circleButtonText}>{score}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 의욕 Subtitle */}
      <Text style={styles.subtitle}>의욕</Text>

      {/* 관심/흥미/즐거움/소비/계획 점수 */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>관심/흥미/즐거움/소비/계획</Text>
          <TouchableOpacity
            style={styles.guideIcon}
            onPress={() => openGuideModal("interest")}
          >
            <Text style={styles.guideIconText}>ⓘ</Text>
          </TouchableOpacity>
        </View>
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
              onPress={() => setInterest(convertFromDisplay(score))}
            >
              <Text style={styles.circleButtonText}>{score}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 활동량 점수 */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>활동량</Text>
          <TouchableOpacity
            style={styles.guideIcon}
            onPress={() => openGuideModal("activity")}
          >
            <Text style={styles.guideIconText}>ⓘ</Text>
          </TouchableOpacity>
        </View>
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
              onPress={() => setActivity(convertFromDisplay(score))}
            >
              <Text style={styles.circleButtonText}>{score}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 생각 Subtitle */}
      <Text style={styles.subtitle}>생각</Text>

      {/* 생각의 속도와 양 점수 */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>생각의 속도와 양</Text>
          <TouchableOpacity
            style={styles.guideIcon}
            onPress={() => openGuideModal("thoughtSpeed")}
          >
            <Text style={styles.guideIconText}>ⓘ</Text>
          </TouchableOpacity>
        </View>
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
              onPress={() => setThoughtSpeed(convertFromDisplay(score))}
            >
              <Text style={styles.circleButtonText}>{score}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 생각의 내용 점수 */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>생각의 내용</Text>
          <TouchableOpacity
            style={styles.guideIcon}
            onPress={() => openGuideModal("thoughtContent")}
          >
            <Text style={styles.guideIconText}>ⓘ</Text>
          </TouchableOpacity>
        </View>
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
              onPress={() => setThoughtContent(convertFromDisplay(score))}
            >
              <Text style={styles.circleButtonText}>{score}</Text>
            </TouchableOpacity>
          ))}
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
        <Text style={styles.label}>특이사항</Text>
        <View style={styles.iconButtonsContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setHasMenstruation(!hasMenstruation)}
          >
            <MaterialCommunityIcons
              name="water-circle"
              size={40}
              color={hasMenstruation ? "#D9A860" : "#BDBDBD"}
            />
            <Text
              style={[
                styles.iconButtonText,
                hasMenstruation && styles.iconButtonTextActive,
              ]}
            >
              생리
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setHasBingeEating(!hasBingeEating)}
          >
            <MaterialCommunityIcons
              name="food-variant"
              size={40}
              color={hasBingeEating ? "#D9A860" : "#BDBDBD"}
            />
            <Text
              style={[
                styles.iconButtonText,
                hasBingeEating && styles.iconButtonTextActive,
              ]}
            >
              폭식
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setHasPhysicalPain(!hasPhysicalPain)}
          >
            <MaterialCommunityIcons
              name="bandage"
              size={40}
              color={hasPhysicalPain ? "#D9A860" : "#BDBDBD"}
            />
            <Text
              style={[
                styles.iconButtonText,
                hasPhysicalPain && styles.iconButtonTextActive,
              ]}
            >
              신체 통증
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setHasPanicAttack(!hasPanicAttack)}
          >
            <MaterialCommunityIcons
              name="heart-pulse"
              size={40}
              color={hasPanicAttack ? "#D9A860" : "#BDBDBD"}
            />
            <Text
              style={[
                styles.iconButtonText,
                hasPanicAttack && styles.iconButtonTextActive,
              ]}
            >
              공황 발작
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setHasCrying(!hasCrying)}
          >
            <MaterialCommunityIcons
              name="emoticon-sad-outline"
              size={40}
              color={hasCrying ? "#D9A860" : "#BDBDBD"}
            />
            <Text
              style={[
                styles.iconButtonText,
                hasCrying && styles.iconButtonTextActive,
              ]}
            >
              울음
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setHasExercise(!hasExercise)}
          >
            <MaterialCommunityIcons
              name="run"
              size={40}
              color={hasExercise ? "#D9A860" : "#BDBDBD"}
            />
            <Text
              style={[
                styles.iconButtonText,
                hasExercise && styles.iconButtonTextActive,
              ]}
            >
              운동
            </Text>
          </TouchableOpacity>
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

      {/* 수정완료 버튼 */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleUpdate}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "저장 중..." : "수정 완료"}
        </Text>
      </TouchableOpacity>

      {/* 취소 버튼 */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setIsEditMode(false)}
      >
        <Text style={styles.cancelButtonText}>취소</Text>
      </TouchableOpacity>

      {/* 평가 기준 가이드 모달 */}
      <Modal
        visible={showGuideModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeGuideModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                {currentGuide && scoreGuides[currentGuide]?.subtitle && (
                  <Text style={styles.modalSubtitle}>
                    {scoreGuides[currentGuide].subtitle}
                  </Text>
                )}
                <Text style={styles.modalTitle}>
                  {currentGuide && scoreGuides[currentGuide]?.title}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeGuideModal}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 평가 기준 테이블 */}
            <ScrollView style={styles.modalContent}>
              {/* Subtitle 설명 */}
              {currentGuide &&
                scoreGuides[currentGuide]?.subtitleDescription && (
                  <View style={styles.subtitleDescriptionContainer}>
                    <RenderHTML
                      contentWidth={width * 0.9 - 32}
                      source={{
                        html:
                          scoreGuides[currentGuide].subtitleDescription || "",
                      }}
                      baseStyle={styles.subtitleDescriptionText}
                    />
                  </View>
                )}
              <View style={styles.guideTable}>
                {/* 테이블 헤더 */}
                <View style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.tableHeaderCell]}>
                    <Text style={styles.tableHeaderText}>점수</Text>
                  </View>
                  <View
                    style={[
                      styles.tableCell,
                      styles.tableHeaderCell,
                      styles.tableCellDescription,
                    ]}
                  >
                    <Text style={styles.tableHeaderText}>평가 기준</Text>
                  </View>
                </View>

                {/* 테이블 바디 */}
                {currentGuide &&
                  scoreGuides[currentGuide]?.table.map((row, index) => (
                    <View key={index} style={styles.tableRow}>
                      <View
                        style={[
                          styles.tableCell,
                          { backgroundColor: getScoreColor(row.score) },
                        ]}
                      >
                        <Text style={styles.tableCellText}>{row.score}</Text>
                      </View>
                      <View
                        style={[styles.tableCell, styles.tableCellDescription]}
                      >
                        <RenderHTML
                          contentWidth={width * 0.9 - 80}
                          source={{ html: row.description }}
                          baseStyle={styles.tableCellText}
                        />
                      </View>
                    </View>
                  ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.primary,
    marginTop: 16,
    marginBottom: 16,
  },
  // 읽기 모드 스타일
  readOnlyCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  readOnlySection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  readOnlyLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  booleanTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  booleanTag: {
    backgroundColor: Colors.light.primary,
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  // 수정 모드 스타일
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
  iconButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-around",
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    minWidth: 100,
  },
  iconButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  iconButtonTextActive: {
    color: Colors.light.text,
    fontWeight: "600",
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
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: Colors.light.error,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 40,
  },
  deleteButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  guideIcon: {
    marginLeft: 8,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  guideIconText: {
    fontSize: 18,
    color: Colors.light.primary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 24,
    color: Colors.light.textSecondary,
  },
  modalContent: {
    padding: 16,
  },
  subtitleDescriptionContainer: {
    backgroundColor: Colors.light.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  subtitleDescriptionText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  guideTable: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableCell: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  tableHeaderCell: {
    backgroundColor: Colors.light.primary,
  },
  tableCellDescription: {
    flex: 1,
    alignItems: "flex-start",
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  tableCellText: {
    fontSize: 14,
    color: Colors.light.text,
  },
});
