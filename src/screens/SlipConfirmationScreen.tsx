import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { logSlip } from '../store/storage';
import { cloudLogSlip } from '../store/cloudStorage';

const PRESET_TRIGGERS = ['Stress', 'Boredom', 'Loneliness', 'Late night', 'Other'];

type Props = {
  nosBefore: number;
  onConfirm: () => void;
  onCancel: () => void;
  session?: Session | null;
};

export default function SlipConfirmationScreen({ nosBefore, onConfirm, onCancel, session }: Props) {
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [customTrigger, setCustomTrigger] = useState('');

  async function handleConfirm() {
    const trigger = selectedTrigger === 'Other' ? customTrigger || 'Other' : selectedTrigger ?? undefined;
    await logSlip(trigger || undefined);
    if (session?.user?.id) {
      cloudLogSlip(session.user.id, nosBefore, trigger || undefined).catch(() => {});
    }
    onConfirm();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.wave}>🌊</Text>
            <Text style={styles.reframe}>The wave passed.{'\n'}Keep going.</Text>
          </View>

          <View style={styles.evidenceBlock}>
            <Text style={styles.evidenceLabel}>Before this moment, today you said</Text>
            <Text style={styles.evidenceCount}>{nosBefore}</Text>
            <Text style={styles.evidenceLabel}>{nosBefore === 1 ? 'time' : 'times'}</Text>
            <Text style={styles.evidenceSubtext}>That is yours. It cannot be taken.</Text>
          </View>

          <View style={styles.triggerSection}>
            <Text style={styles.triggerLabel}>What was the trigger? (optional)</Text>
            <View style={styles.chips}>
              {PRESET_TRIGGERS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, selectedTrigger === t && styles.chipSelected]}
                  onPress={() => setSelectedTrigger(selectedTrigger === t ? null : t)}
                >
                  <Text style={[styles.chipText, selectedTrigger === t && styles.chipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedTrigger === 'Other' && (
              <TextInput
                style={styles.input}
                placeholder="Describe it..."
                placeholderTextColor="rgba(26,43,51,0.3)"
                value={customTrigger}
                onChangeText={setCustomTrigger}
                maxLength={60}
              />
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Log it and move on</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel — I didn't slip</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 32, gap: 36 },
  header: { alignItems: 'center', gap: 12, paddingTop: 16 },
  wave: { fontSize: 48 },
  reframe: { fontSize: 22, color: '#1A2B33', fontWeight: '700', textAlign: 'center', lineHeight: 30 },
  evidenceBlock: { alignItems: 'center', gap: 4, backgroundColor: 'rgba(26,43,51,0.04)', borderRadius: 16, padding: 24 },
  evidenceLabel: { fontSize: 13, color: 'rgba(26,43,51,0.45)', letterSpacing: 0.5, textAlign: 'center' },
  evidenceCount: { fontSize: 80, color: '#1A2B33', fontWeight: '900', lineHeight: 88 },
  evidenceSubtext: { fontSize: 12, color: 'rgba(26,43,51,0.3)', marginTop: 4, textAlign: 'center' },
  triggerSection: { gap: 12 },
  triggerLabel: { fontSize: 13, color: 'rgba(26,43,51,0.45)', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(26,43,51,0.18)' },
  chipSelected: { backgroundColor: 'rgba(91,163,199,0.12)', borderColor: '#7FB9D4' },
  chipText: { fontSize: 13, color: 'rgba(26,43,51,0.45)' },
  chipTextSelected: { color: '#5BA3C7' },
  input: { borderWidth: 1, borderColor: 'rgba(26,43,51,0.18)', borderRadius: 10, padding: 12, color: '#1A2B33', fontSize: 14 },
  actions: { gap: 12, paddingBottom: 16 },
  confirmBtn: { backgroundColor: '#7FB9D4', borderRadius: 12, padding: 16, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, color: 'rgba(26,43,51,0.35)' },
});
