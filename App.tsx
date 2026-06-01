import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import MainScreen from './src/screens/MainScreen';
import SlipConfirmationScreen from './src/screens/SlipConfirmationScreen';
import { loadState, getTodayRecord } from './src/store/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function scheduleMidnightSummary(todayNOs: number) {
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

export default function App() {
  const [slipModal, setSlipModal] = useState(false);
  const [nosBefore, setNosBefore] = useState(0);
  const [mainRefreshKey, setMainRefreshKey] = useState(0);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

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

  return (
    <View style={styles.root}>
      <MainScreen
        onSlipPress={handleSlipPress}
        refreshKey={mainRefreshKey}
        onNOLogged={handleNOLogged}
      />
      <Modal visible={slipModal} animationType="slide" presentationStyle="pageSheet">
        <SlipConfirmationScreen
          nosBefore={nosBefore}
          onConfirm={handleSlipConfirm}
          onCancel={() => setSlipModal(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D1A' },
});
