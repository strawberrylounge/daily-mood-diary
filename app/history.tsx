import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Loading from "../components/Loading";
import { supabase } from "../lib/supabase";
import type { DailyRecord } from "../types/database";
import { Colors } from "../constants/theme";

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

const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void
) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: onConfirm },
    ]);
  }
};
// ========================================

export default function HistoryScreen() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_records")
        .select("*")
        .order("record_date", { ascending: false })
        .limit(30); // 최근 30일

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      // Alert.alert("오류", error.message); // 웹 호환 전
      showAlert("오류", error.message); // 웹 호환
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, date: string) => {
    // ======== 웹 호환 전 코드 ========
    // Alert.alert("삭제 확인", `${date} 기록을 삭제하시겠습니까?`, [
    //   { text: "취소", style: "cancel" },
    //   {
    //     text: "삭제",
    //     style: "destructive",
    //     onPress: async () => {
    //       try {
    //         const { error } = await supabase
    //           .from("daily_records")
    //           .delete()
    //           .eq("id", id);
    //
    //         if (error) throw error;
    //
    //         Alert.alert("성공", "기록이 삭제되었습니다.");
    //         fetchRecords(); // 목록 새로고침
    //       } catch (error: any) {
    //         Alert.alert("오류", error.message);
    //       }
    //     },
    //   },
    // ]);
    // ======== 웹 호환 코드 ========
    showConfirm("삭제 확인", `${date} 기록을 삭제하시겠습니까?`, async () => {
      try {
        const { error } = await supabase
          .from("daily_records")
          .delete()
          .eq("id", id);

        if (error) throw error;

        showAlert("성공", "기록이 삭제되었습니다.");
        fetchRecords(); // 목록 새로고침
      } catch (error: any) {
        showAlert("오류", error.message);
      }
    });
  };

  const renderItem = ({ item }: { item: DailyRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.record_date}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/edit/${item.id}`)}
          >
            <Text style={styles.editButtonText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.record_date)}
          >
            <Text style={styles.deleteButtonText}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardContent}>
        {item.mood_up_score !== null && (
          <Text style={styles.info}>기분 Up: {item.mood_up_score}</Text>
        )}
        {item.mood_down_score !== null && (
          <Text style={styles.info}>기분 Down: {item.mood_down_score}</Text>
        )}
        <Text style={styles.info}>불안: {item.anxiety_score}</Text>
        <Text style={styles.info}>수면: {item.sleep_hours}시간</Text>
        {item.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            메모: {item.notes}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return <Loading message="기록을 불러오는 중..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>기록이 없습니다.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: Colors.light.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cardContent: {
    gap: 6,
  },
  info: {
    fontSize: 14,
    color: Colors.light.text,
  },
  notes: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  empty: {
    textAlign: "center",
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 40,
  },
});
