import { Tabs } from "expo-router";
import { Colors } from "../../constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.light.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="stats"
        options={{
          title: "통계",
          tabBarLabel: "통계",
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarLabel: "홈",
        }}
      />
    </Tabs>
  );
}
