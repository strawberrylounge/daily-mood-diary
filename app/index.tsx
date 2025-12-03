import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { supabase } from "../lib/supabase";

export default function Index() {
  const [recordedDates, setRecordedDates] = useState<{ [key: string]: any }>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecordedDates();
  }, []);

  const fetchRecordedDates = async () => {
    try {
      // 최근 3개월 기록 가져오기
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data, error } = await supabase
        .from("daily_records")
        .select("record_date, id")
        .gte("record_date", threeMonthsAgo.toISOString().split("T")[0])
        .order("record_date", { ascending: false });

      if (error) throw error;

      // 기록 있는 날짜를 객체로 변환
      const marked: { [key: string]: any } = {};
      data?.forEach((record) => {
        marked[record.record_date] = {
          marked: true,
          dotColor: "#007AFF",
          recordId: record.id, // ID 저장
        };
      });

      setRecordedDates(marked);
    } catch (error) {
      console.error("Error fetching dates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = async (day: DateData) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);

    // 해당 날짜에 기록이 있는지 확인
    if (recordedDates[dateString]) {
      // 기록 있음 -> 수정 화면으로
      const recordId = recordedDates[dateString].recordId;
      router.push(`/edit/${recordId}`);
    } else {
      // 기록 없음 -> 새로 작성
      router.push({
        pathname: "/record",
        params: { date: dateString },
      });
    }
  };

  // 오늘 날짜
  const today = new Date().toISOString().split("T")[0];

  // markedDates 객체 생성 (기록 있는 날 + 선택된 날)
  const markedDates = {
    ...recordedDates,
    [selectedDate]: {
      ...recordedDates[selectedDate],
      selected: true,
      selectedColor: "#34C759",
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>기분 기록</Text>
      <Text style={styles.subtitle}>날짜를 선택해서 기록하세요</Text>

      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        maxDate={today}
        theme={{
          todayTextColor: "#FF3B30",
          selectedDayBackgroundColor: "#34C759",
          selectedDayTextColor: "#ffffff",
          arrowColor: "#007AFF",
          monthTextColor: "#000",
          textMonthFontSize: 18,
          textMonthFontWeight: "bold",
          dotColor: "#007AFF",
        }}
        style={styles.calendar}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#007AFF" }]} />
          <Text style={styles.legendText}>기록 있음</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#34C759" }]} />
          <Text style={styles.legendText}>선택됨</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FF3B30" }]} />
          <Text style={styles.legendText}>오늘</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => router.push("/history")}
      >
        <Text style={styles.historyButtonText}>📋 전체 기록 보기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  calendar: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
  },
  historyButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
