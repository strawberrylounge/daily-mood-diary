import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  ASSESSMENT_QUESTIONS,
  type AssessmentOption,
  type AssessmentQuestion,
} from "../types/assessment";

export default function AssessmentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, AssessmentOption>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  const handleSelectOption = (
    question: AssessmentQuestion,
    option: AssessmentOption
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: option.id,
    }));
    setSelectedOptions((prev) => ({
      ...prev,
      [question.id]: option,
    }));
  };

  const calculateTotalScore = () => {
    let total = 0;
    Object.values(selectedOptions).forEach((option) => {
      total += option.score;
    });
    return total;
  };

  const handleSubmit = async () => {
    // 모든 질문에 답했는지 확인
    if (Object.keys(answers).length !== ASSESSMENT_QUESTIONS.length) {
      Alert.alert("알림", "모든 질문에 답해주세요.");
      return;
    }

    if (!user?.id) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const score = calculateTotalScore();
      const currentMonth = new Date();
      currentMonth.setDate(1); // 월의 첫째 날로 설정
      const assessmentMonth = currentMonth.toISOString().split("T")[0];

      // 기존 평가가 있는지 확인
      const { data: existing } = await supabase
        .from("monthly_assessments")
        .select("id")
        .eq("user_id", user.id)
        .eq("assessment_month", assessmentMonth)
        .single();

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from("monthly_assessments")
          .update({
            total_score: score,
            answers: answers,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // 새로 생성
        const { error } = await supabase.from("monthly_assessments").insert({
          user_id: user.id,
          assessment_month: assessmentMonth,
          total_score: score,
          answers: answers,
        });

        if (error) throw error;
      }

      setTotalScore(score);
      setShowResult(true);
    } catch (error: any) {
      console.error("Error saving assessment:", error);
      Alert.alert("오류", "평가 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (showResult) {
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>평가 완료!</Text>
          <Text style={styles.resultScore}>{totalScore}점</Text>
          <Text style={styles.resultTotal}>/ 100점</Text>

          <View style={styles.resultFeedback}>
            {totalScore >= 80 && (
              <>
                <Text style={styles.feedbackEmoji}>🎉</Text>
                <Text style={styles.feedbackText}>
                  훌륭합니다! 매우 잘 관리하고 계시네요.
                </Text>
              </>
            )}
            {totalScore >= 60 && totalScore < 80 && (
              <>
                <Text style={styles.feedbackEmoji}>👍</Text>
                <Text style={styles.feedbackText}>
                  잘하고 계십니다! 조금만 더 신경쓰면 더 좋아질 거예요.
                </Text>
              </>
            )}
            {totalScore >= 40 && totalScore < 60 && (
              <>
                <Text style={styles.feedbackEmoji}>💪</Text>
                <Text style={styles.feedbackText}>
                  괜찮습니다. 좀 더 노력이 필요해 보여요.
                </Text>
              </>
            )}
            {totalScore < 40 && (
              <>
                <Text style={styles.feedbackEmoji}>🤔</Text>
                <Text style={styles.feedbackText}>
                  관리에 더 신경을 쓰실 필요가 있어 보입니다.
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>월간 셀프 평가</Text>
        <Text style={styles.subtitle}>
          지난 한 달 동안의 자신을 평가해보세요
        </Text>
      </View>

      {ASSESSMENT_QUESTIONS.map((question, index) => (
        <View key={question.id} style={styles.questionCard}>
          <Text style={styles.questionNumber}>질문 {index + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleSelectOption(question, option)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.radio,
                        isSelected && styles.radioSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option.text}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.optionScore,
                      isSelected && styles.optionScoreSelected,
                    ]}
                  >
                    {option.score}점
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.progressText}>
          {Object.keys(answers).length} / {ASSESSMENT_QUESTIONS.length} 완료
        </Text>
        <TouchableOpacity
          style={[
            styles.submitButton,
            Object.keys(answers).length !== ASSESSMENT_QUESTIONS.length &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            isSubmitting ||
            Object.keys(answers).length !== ASSESSMENT_QUESTIONS.length
          }
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "제출 중..." : "제출하기"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  questionCard: {
    backgroundColor: Colors.light.surface,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  optionButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#E6F4FE",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: Colors.light.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: "600",
    color: Colors.light.primary,
  },
  optionScore: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  optionScoreSelected: {
    color: Colors.light.primary,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  progressText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 24,
  },
  resultScore: {
    fontSize: 72,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  resultTotal: {
    fontSize: 24,
    color: Colors.light.textSecondary,
    marginBottom: 32,
  },
  resultFeedback: {
    alignItems: "center",
    marginBottom: 48,
  },
  feedbackEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 18,
    color: Colors.light.text,
    textAlign: "center",
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
