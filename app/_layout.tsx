import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="record" options={{ title: '기록 작성' }} />
        <Stack.Screen name="edit/[id]" options={{ title: '기록 수정' }} />
        <Stack.Screen name="history" options={{ title: '전체 기록' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
