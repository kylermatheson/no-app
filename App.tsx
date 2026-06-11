import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { COLORS } from './src/constants/noLogAnimation';
import * as Notifications from 'expo-notifications';
import { Session } from '@supabase/supabase-js';
import MainScreen from './src/screens/MainScreen';
import SlipConfirmationScreen from './src/screens/SlipConfirmationScreen';
import AuthScreen from './src/screens/AuthScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadState, getTodayRecord } from './src/store/storage';
import { supabase } from './src/lib/supabase';
import { pullAndMergeFromCloud } from './src/store/cloudStorage';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function scheduleMidnightSummary(todayNOs: number) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 5, 0);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'No',
      body: `You said No ${todayNOs} ${todayNOs === 1 ? 'time' : 'times'} today 🌊`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: tomorrow,
    },
  });
}

type AppView = 'loading' | 'auth' | 'main';

export default function App() {
  const [view, setView] = useState<AppView>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [slipModal, setSlipModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [nosBefore, setNosBefore] = useState(0);
  const [mainRefreshKey, setMainRefreshKey] = useState(0);

  useEffect(() => {
    // Check for existing session or skipped auth
    Promise.all([
      supabase.auth.getSession(),
      AsyncStorage.getItem('no_app_skipped_auth'),
    ]).then(([{ data: { session } }, skipped]) => {
      setSession(session);
      if (session) {
        pullAndMergeFromCloud(session.user.id)
          .catch(() => {})
          .finally(() => setView('main'));
      } else if (skipped === 'true') {
        setView('main');
      } else {
        setView('auth');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    if (Platform.OS !== 'web') {
      Notifications.requestPermissionsAsync();
    }

    return () => subscription.unsubscribe();
  }, []);

  async function handleAuthSuccess() {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session) {
      setView('loading');
      await pullAndMergeFromCloud(session.user.id).catch(() => {});
      setMainRefreshKey((k) => k + 1);
    }
    setView('main');
  }

  function handleSlipPress(todayNOs: number) {
    setNosBefore(todayNOs);
    setSlipModal(true);
  }

  function handleSlipConfirm() {
    setSlipModal(false);
    setMainRefreshKey((k) => k + 1);
  }

  function handleNOLogged() {
    loadState().then((s) => scheduleMidnightSummary(getTodayRecord(s).noCount));
  }

  if (view === 'loading') {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={COLORS.ACCENT_OCEAN} size="large" />
      </View>
    );
  }

  if (view === 'auth') {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} onSkip={() => { AsyncStorage.setItem('no_app_skipped_auth', 'true'); setView('main'); }} />;
  }

  return (
    <View style={styles.root}>
      <MainScreen
        onSlipPress={handleSlipPress}
        refreshKey={mainRefreshKey}
        onNOLogged={handleNOLogged}
        session={session}
        onSettingsPress={() => setSettingsModal(true)}
      />
      <Modal visible={settingsModal} animationType="slide" presentationStyle="pageSheet">
        <SettingsScreen
          session={session}
          onClose={() => setSettingsModal(false)}
          onSignOut={async () => {
            setSettingsModal(false);
            await supabase.auth.signOut();
            await AsyncStorage.removeItem('no_app_skipped_auth');
            setView('auth');
          }}
        />
      </Modal>
      <Modal visible={slipModal} animationType="slide" presentationStyle="pageSheet">
        <SlipConfirmationScreen
          nosBefore={nosBefore}
          onConfirm={handleSlipConfirm}
          onCancel={() => setSlipModal(false)}
          session={session}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { alignItems: 'center', justifyContent: 'center' },
});
