import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import OfflineBanner from '@/components/OfflineBanner';

function RootNavigator() {
  const { utilisateur, loading } = useAuth();
  const { colors, mode } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.forest950 }]}>
        <ActivityIndicator size="large" color={colors.mint400} />
      </View>
    );
  }

  return (
    <>
      {utilisateur ? (
        <NotificationProvider>
          <NetworkProvider>
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="meteo" />
              <Stack.Screen name="conseils" />
              <Stack.Screen name="marches" />
              <Stack.Screen name="localisation" />
              <Stack.Screen name="statistiques" />
              <Stack.Screen name="exploitation/[id]" />
              <Stack.Screen name="forum" />
            </Stack>
            <OfflineBanner />
          </NetworkProvider>
        </NotificationProvider>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
        </Stack>
      )}
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});