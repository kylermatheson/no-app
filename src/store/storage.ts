import AsyncStorage from '@react-native-async-storage/async-storage';

export type SlipContext = {
  timestamp: number;
  nosBefore: number;
  trigger?: string;
};

export type DailyRecord = {
  date: string;
  noCount: number;
  slipCount: number;
  slipContexts: SlipContext[];
};

export type AppState = {
  lifetimeNoCount: number;
  dailyRecords: DailyRecord[];
};

const KEY = 'no_app_state';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function loadState(): Promise<AppState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { lifetimeNoCount: 0, dailyRecords: [] };
  return JSON.parse(raw);
}

async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

function getOrCreateToday(state: AppState): DailyRecord {
  const today = todayStr();
  let record = state.dailyRecords.find((r) => r.date === today);
  if (!record) {
    record = { date: today, noCount: 0, slipCount: 0, slipContexts: [] };
    state.dailyRecords.push(record);
  }
  return record;
}

export async function logNo(): Promise<AppState> {
  const state = await loadState();
  const today = getOrCreateToday(state);
  today.noCount += 1;
  state.lifetimeNoCount += 1;
  await saveState(state);
  return state;
}

export async function logSlip(trigger?: string): Promise<{ nosBefore: number; state: AppState }> {
  const state = await loadState();
  const today = getOrCreateToday(state);
  const nosBefore = today.noCount;
  today.slipCount += 1;
  today.slipContexts.push({ timestamp: Date.now(), nosBefore, trigger });
  await saveState(state);
  return { nosBefore, state };
}

export function getTodayRecord(state: AppState): DailyRecord {
  const today = todayStr();
  return state.dailyRecords.find((r) => r.date === today) ?? { date: today, noCount: 0, slipCount: 0, slipContexts: [] };
}
