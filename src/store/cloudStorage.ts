import { supabase } from '../lib/supabase';
import { AppState, DailyRecord, SlipContext, loadState, saveStateRaw } from './storage';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Push local state up to Supabase (called after merge on sign-in)
export async function pushLocalStateToCloud(state: AppState, userId: string): Promise<void> {
  // Upsert lifetime count
  await supabase.from('user_stats').upsert({
    user_id: userId,
    lifetime_no_count: state.lifetimeNoCount,
    updated_at: new Date().toISOString(),
  });

  // Upsert each daily record
  for (const record of state.dailyRecords) {
    await supabase.from('daily_records').upsert({
      user_id: userId,
      date: record.date,
      no_count: record.noCount,
      slip_count: record.slipCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' });

    // Insert any slip contexts not yet in cloud
    for (const slip of record.slipContexts) {
      await supabase.from('slip_contexts').upsert({
        user_id: userId,
        date: record.date,
        timestamp_ms: slip.timestamp,
        nos_before: slip.nosBefore,
        trigger: slip.trigger ?? null,
      }, { onConflict: 'id' });
    }
  }
}

// Pull cloud state and merge with local (local wins on conflicts — higher count wins)
export async function pullAndMergeFromCloud(userId: string): Promise<AppState> {
  const local = await loadState();

  // Fetch cloud data
  const [statsRes, recordsRes, slipsRes] = await Promise.all([
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    supabase.from('daily_records').select('*').eq('user_id', userId),
    supabase.from('slip_contexts').select('*').eq('user_id', userId),
  ]);

  const cloudLifetime = statsRes.data?.lifetime_no_count ?? 0;
  const cloudRecords: any[] = recordsRes.data ?? [];
  const cloudSlips: any[] = slipsRes.data ?? [];

  // Merge: for each date, take the higher no_count
  const mergedMap = new Map<string, DailyRecord>();

  // Start with local
  for (const r of local.dailyRecords) {
    mergedMap.set(r.date, { ...r });
  }

  // Merge cloud records
  for (const cr of cloudRecords) {
    const existing = mergedMap.get(cr.date);
    const cloudSlipsForDay: SlipContext[] = cloudSlips
      .filter((s) => s.date === cr.date)
      .map((s) => ({ timestamp: s.timestamp_ms, nosBefore: s.nos_before, trigger: s.trigger ?? undefined }));

    if (existing) {
      // Take higher counts, merge slip contexts
      const allSlips = [...existing.slipContexts];
      for (const cs of cloudSlipsForDay) {
        if (!allSlips.find((ls) => ls.timestamp === cs.timestamp)) allSlips.push(cs);
      }
      mergedMap.set(cr.date, {
        date: cr.date,
        noCount: Math.max(existing.noCount, cr.no_count),
        slipCount: Math.max(existing.slipCount, cr.slip_count),
        slipContexts: allSlips,
      });
    } else {
      mergedMap.set(cr.date, {
        date: cr.date,
        noCount: cr.no_count,
        slipCount: cr.slip_count,
        slipContexts: cloudSlipsForDay,
      });
    }
  }

  const merged: AppState = {
    lifetimeNoCount: Math.max(local.lifetimeNoCount, cloudLifetime),
    dailyRecords: Array.from(mergedMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };

  // Save merged state locally
  await saveStateRaw(merged);
  // Push merged state back to cloud
  await pushLocalStateToCloud(merged, userId);

  return merged;
}

// Log a NO to cloud — reads current counts from local state and pushes
export async function cloudLogNo(userId: string): Promise<void> {
  const state = await (await import('./storage')).loadState();
  const today = todayStr();
  const todayRecord = state.dailyRecords.find((r) => r.date === today);

  await Promise.all([
    supabase.from('daily_records').upsert({
      user_id: userId,
      date: today,
      no_count: todayRecord?.noCount ?? 1,
      slip_count: todayRecord?.slipCount ?? 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' }),
    supabase.from('user_stats').upsert({
      user_id: userId,
      lifetime_no_count: state.lifetimeNoCount,
      updated_at: new Date().toISOString(),
    }),
  ]);
}

// Log a slip to cloud
export async function cloudLogSlip(userId: string, nosBefore: number, trigger?: string): Promise<void> {
  const state = await (await import('./storage')).loadState();
  const date = todayStr();
  const todayRecord = state.dailyRecords.find((r) => r.date === date);

  await Promise.all([
    supabase.from('slip_contexts').insert({
      user_id: userId,
      date,
      timestamp_ms: Date.now(),
      nos_before: nosBefore,
      trigger: trigger ?? null,
    }),
    supabase.from('daily_records').upsert({
      user_id: userId,
      date,
      no_count: todayRecord?.noCount ?? 0,
      slip_count: todayRecord?.slipCount ?? 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' }),
  ]);
}
