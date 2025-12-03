import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/theme";

interface LoadingProps {
  message?: string;
}

export default function Loading({ message = "로딩 중..." }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
});
