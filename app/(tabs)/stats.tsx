import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Loading from "../../components/Loading";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import type { DailyRecord } from "../../types/database";

const screenWidth = Dimensions.get("window").width;

interface MonthlyStats {
  month: string;
  recordCount: number;
  avgMoodUp: number | null;
  avgMoodDown: number | null;
  avgAnxiety: number;
  avgAnger: number;
  avgInterest: number;
  avgActivity: number;
  avgThoughtSpeed: number;
  avgThoughtContent: number;
  avgSleepHours: number;
  avgWeight: number | null;
}

export default function StatsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [recentRecords, setRecentRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/sign-in");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
      fetchRecentRecords();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const convertToDisplay = (value: number) => value - 4;

  const fetchRecentRecords = async () => {
    if (!user?.id) return;

    try {
      // 이전 월(11월) 데이터 가져오기
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 이전 월 1일
      const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("daily_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("record_date", startOfMonth.toISOString().split("T")[0])
        .lte("record_date", endOfMonth.toISOString().split("T")[0])
        .order("record_date", { ascending: true });

      if (error) throw error;
      setRecentRecords(data || []);
    } catch (error: any) {
      console.error("Error fetching recent records:", error);
    }
  };

  const fetchStats = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // 최근 6개월 데이터 가져오기
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from("daily_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("record_date", sixMonthsAgo.toISOString().split("T")[0])
        .order("record_date", { ascending: false });

      if (error) throw error;

      // 월별로 그룹화
      const groupedByMonth: { [key: string]: DailyRecord[] } = {};
      data?.forEach((record) => {
        const month = record.record_date.substring(0, 7); // YYYY-MM
        if (!groupedByMonth[month]) {
          groupedByMonth[month] = [];
        }
        groupedByMonth[month].push(record);
      });

      // 월별 평균 계산
      const stats: MonthlyStats[] = Object.keys(groupedByMonth)
        .sort()
        .reverse()
        .map((month) => {
          const records = groupedByMonth[month];
          const count = records.length;

          // 각 항목의 평균 계산
          const moodUpRecords = records.filter((r) => r.mood_up_score !== null);
          const moodDownRecords = records.filter(
            (r) => r.mood_down_score !== null
          );
          const weightRecords = records.filter((r) => r.weight !== null);

          return {
            month,
            recordCount: count,
            avgMoodUp:
              moodUpRecords.length > 0
                ? moodUpRecords.reduce((sum, r) => sum + r.mood_up_score!, 0) /
                  moodUpRecords.length
                : null,
            avgMoodDown:
              moodDownRecords.length > 0
                ? moodDownRecords.reduce(
                    (sum, r) => sum + r.mood_down_score!,
                    0
                  ) / moodDownRecords.length
                : null,
            avgAnxiety:
              records.reduce((sum, r) => sum + r.anxiety_score, 0) / count,
            avgAnger:
              records.reduce((sum, r) => sum + r.anger_score, 0) / count,
            avgInterest:
              records.reduce((sum, r) => sum + r.interest_score, 0) / count,
            avgActivity:
              records.reduce((sum, r) => sum + r.activity_score, 0) / count,
            avgThoughtSpeed:
              records.reduce((sum, r) => sum + r.thought_speed_score, 0) /
              count,
            avgThoughtContent:
              records.reduce((sum, r) => sum + r.thought_content_score, 0) /
              count,
            avgSleepHours:
              records.reduce((sum, r) => sum + r.sleep_hours, 0) / count,
            avgWeight:
              weightRecords.length > 0
                ? weightRecords.reduce((sum, r) => sum + r.weight!, 0) /
                  weightRecords.length
                : null,
          };
        });

      setMonthlyStats(stats);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (month: string) => {
    const [year, mon] = month.split("-");
    return `${year}년 ${parseInt(mon)}월`;
  };

  const prepareMoodChartData = () => {
    if (recentRecords.length === 0) {
      return null;
    }

    // 날짜 순으로 정렬 (오름차순: 과거 → 현재)
    const sortedRecords = [...recentRecords].sort((a, b) => {
      return new Date(a.record_date).getTime() - new Date(b.record_date).getTime();
    });

    // 날짜별 라벨 생성 (1일, 15일, 말일만 표시)
    const labels = sortedRecords.map((record) => {
      // YYYY-MM-DD 형식의 문자열을 직접 파싱 (타임존 문제 방지)
      const [year, month, dayStr] = record.record_date.split('-');
      const day = parseInt(dayStr, 10);
      const monthNum = parseInt(month, 10);

      // 말일 계산
      const lastDay = new Date(parseInt(year, 10), monthNum, 0).getDate();

      // 1일, 15일, 말일만 표시
      if (day === 1 || day === 15 || day === lastDay) {
        return `${monthNum}/${day}`;
      }
      return ''; // 나머지는 빈 문자열
    });

    // 각 레코드의 기분 값 (mood_up 또는 mood_down 중 하나)
    const moodValues = sortedRecords.map((record) => {
      if (record.mood_up_score !== null && record.mood_up_score !== undefined) {
        return record.mood_up_score;
      } else if (
        record.mood_down_score !== null &&
        record.mood_down_score !== undefined
      ) {
        return record.mood_down_score;
      }
      return 0; // null 값은 0으로 처리
    });

    // 1개의 라인으로 표시
    const datasets = [
      {
        data: moodValues,
        color: (opacity = 1) => `rgba(147, 135, 163, ${opacity})`, // 보라색 단일 라인
        strokeWidth: 3,
      },
    ];

    return {
      labels,
      datasets,
    };
  };

  const moodChartData = prepareMoodChartData();

  if (loading) {
    return <Loading message="통계를 불러오는 중..." />;
  }

  const getChartMonth = () => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${targetMonth.getFullYear()}년 ${targetMonth.getMonth() + 1}월`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>기분 추세</Text>
      <Text style={styles.subtitle}>{getChartMonth()} mood_score 변화</Text>

      {moodChartData && moodChartData.datasets.length > 0 ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: moodChartData.labels,
              datasets: moodChartData.datasets,
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: Colors.light.surface,
              backgroundGradientFrom: Colors.light.surface,
              backgroundGradientTo: Colors.light.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "3",
                strokeWidth: "2",
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            segments={4}
          />
          <Text style={styles.chartNote}>
            * {getChartMonth()} 데이터 (1일, 15일, 말일만 라벨 표시)
          </Text>
        </View>
      ) : (
        <Text style={styles.empty}>{getChartMonth()} 기록이 없습니다.</Text>
      )}

      <Text style={styles.sectionTitle}>월별 통계</Text>
      <Text style={styles.subtitle}>최근 6개월 평균 기록</Text>

      {monthlyStats.length === 0 ? (
        <Text style={styles.empty}>아직 기록이 없습니다.</Text>
      ) : (
        monthlyStats.map((stat) => (
          <View key={stat.month} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.monthText}>{formatMonth(stat.month)}</Text>
              <Text style={styles.countText}>{stat.recordCount}일 기록됨</Text>
            </View>

            <View style={styles.statsGrid}>
              {stat.avgMoodUp !== null && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>기분 Up 평균</Text>
                  <Text style={styles.statValue}>
                    {stat.avgMoodUp.toFixed(1)}
                  </Text>
                </View>
              )}
              {stat.avgMoodDown !== null && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>기분 Down 평균</Text>
                  <Text style={styles.statValue}>
                    {stat.avgMoodDown.toFixed(1)}
                  </Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>불안</Text>
                <Text style={styles.statValue}>
                  {convertToDisplay(stat.avgAnxiety).toFixed(1)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>짜증/분노</Text>
                <Text style={styles.statValue}>
                  {convertToDisplay(stat.avgAnger).toFixed(1)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>관심/흥미</Text>
                <Text style={styles.statValue}>
                  {convertToDisplay(stat.avgInterest).toFixed(1)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>활동량</Text>
                <Text style={styles.statValue}>
                  {convertToDisplay(stat.avgActivity).toFixed(1)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>생각의 속도/양</Text>
                <Text style={styles.statValue}>
                  {convertToDisplay(stat.avgThoughtSpeed).toFixed(1)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>생각의 내용</Text>
                <Text style={styles.statValue}>
                  {convertToDisplay(stat.avgThoughtContent).toFixed(1)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>수면 시간</Text>
                <Text style={styles.statValue}>
                  {stat.avgSleepHours.toFixed(1)}h
                </Text>
              </View>
              {stat.avgWeight !== null && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>체중</Text>
                  <Text style={styles.statValue}>
                    {stat.avgWeight.toFixed(1)}kg
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 20,
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
    marginBottom: 24,
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  sectionTitle: {
    marginTop: 40,
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 28,
    textAlign: "center",
    color: Colors.light.text,
  },
  chartContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  chartNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  monthText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  countText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  statsGrid: {
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  empty: {
    textAlign: "center",
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 40,
  },
});
