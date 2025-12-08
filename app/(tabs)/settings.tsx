import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Colors } from "../../constants/theme";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert("오류", error.message || "로그아웃에 실패했습니다.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>

      <View style={styles.section}>
        <Text style={styles.label}>계정 정보</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>이메일</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
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
    marginBottom: 24,
    fontWeight: "bold",
    fontSize: 32,
    textAlign: "center",
    color: Colors.light.text,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: Colors.light.text,
  },
  infoBox: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  logoutButton: {
    backgroundColor: Colors.light.error,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 40,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
