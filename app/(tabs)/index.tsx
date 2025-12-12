import { router, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import Loading from "../../components/Loading";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const routerNav = useRouter();
  const [recordedDates, setRecordedDates] = useState<{ [key: string]: any }>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      routerNav.replace("/sign-in");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.id) {
      fetchRecordedDates();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // 페이지가 focus될 때마다 selectedDate 초기화 및 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      setSelectedDate(""); // 선택된 날짜 초기화
      if (user?.id) {
        fetchRecordedDates(); // 최신 데이터 가져오기
      }
    }, [user?.id])
  );

  const fetchRecordedDates = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // 최근 3개월 기록 가져오기
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data, error } = await supabase
        .from("daily_records")
        .select("record_date, id, user_id")
        .eq("user_id", user.id)
        .gte("record_date", threeMonthsAgo.toISOString().split("T")[0])
        .order("record_date", { ascending: false });

      if (error) throw error;

      // 기록 있는 날짜를 객체로 변환
      const marked: { [key: string]: any } = {};
      data?.forEach((record) => {
        marked[record.record_date] = {
          marked: true,
          dotColor: Colors.light.primary,
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
      selectedColor: Colors.light.success,
    },
  };

  if (loading) {
    return <Loading message="불러오는 중..." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracker</Text>
      <Text style={styles.subtitle}>오늘의 기분을 기록하세요.</Text>

      <TouchableOpacity
        style={styles.assessmentButton}
        onPress={() => router.push("/assessment")}
        activeOpacity={0.7}
      >
        <Text style={styles.assessmentButtonText}>📝 월간 셀프 평가</Text>
      </TouchableOpacity>

      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        maxDate={today}
        theme={{
          todayBackgroundColor: Colors.light.success,
          todayTextColor: "#fff",
          arrowColor: Colors.light.primaryDark,
          monthTextColor: Colors.light.text,
          textMonthFontSize: 18,
          textMonthFontWeight: "bold",
          textDayFontSize: 16,
          dotStyle: {
            marginTop: 10,
            color: Colors.light.primary,
          },
        }}
        renderArrow={(direction) => (
          <Text style={styles.arrow}>{direction === "left" ? "◀" : "▶"}</Text>
        )}
        style={styles.calendar}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: Colors.light.primary },
            ]}
          />
          <Text style={styles.legendText}>기록 있음</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: Colors.light.success },
            ]}
          />
          <Text style={styles.legendText}>오늘</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  title: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 32,
    textAlign: "center",
    color: Colors.light.text,
  },
  subtitle: {
    marginBottom: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  assessmentButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assessmentButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  calendar: {
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  arrow: {
    fontSize: 18,
    color: Colors.light.primaryDark,
    fontWeight: "bold",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 20,
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
    color: Colors.light.textSecondary,
  },
});
