import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Loading from "../../components/Loading";
import { Colors } from "../../constants/theme";
import { supabase } from "../../lib/supabase";
import type { DailyRecord } from "../../types/database";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";

interface MonthlyStats {
  month: string;
  recordCount: number;
  avgMoodUp: number | null;
  avgMoodDown: number | null;
  avgAnxiety: number;
  avgTension: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const convertToDisplay = (value: number) => value - 4;

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
            avgTension:
              records.reduce((sum, r) => sum + r.tension_score, 0) / count,
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

  if (loading) {
    return <Loading message="통계를 불러오는 중..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>월별 통계</Text>
      <Text style={styles.subtitle}>최근 6개월 평균 기록</Text>

      {monthlyStats.length === 0 ? (
        <Text style={styles.empty}>아직 기록이 없습니다.</Text>
      ) : (
        monthlyStats.map((stat) => (
          <View key={stat.month} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.monthText}>{formatMonth(stat.month)}</Text>
              <Text style={styles.countText}>
                {stat.recordCount}일 기록됨
              </Text>
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
                <Text style={styles.statLabel}>긴장/흥분</Text>
                <Text style={styles.statValue}>
                  {convertToDisplay(stat.avgTension).toFixed(1)}
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
