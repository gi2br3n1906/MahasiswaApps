import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { firebase } from '@react-native-firebase/app'; // <--- IMPORT INI
import { firebaseConfig } from '../firebaseConfig'; // <--- IMPORT KONFIGURASI KAMU

import { useColorScheme } from '@/hooks/use-color-scheme';

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully!');
}

export const unstable_settings = {
  anchor: '(tabs)',
};



export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
