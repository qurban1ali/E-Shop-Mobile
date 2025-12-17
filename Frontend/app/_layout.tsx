import Providers from '@/config/Providers';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import "./globals.css";
import { LogBox } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  LogBox.ignoreAllLogs();
  const colorScheme = useColorScheme();
  

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView>
        <Providers>
          <Stack screenOptions={{headerShown:false}}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(routes)/login/index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </Providers>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
