import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { COLORS } from '../constants/noLogAnimation';

type Props = {
  session: Session | null;
  onSignOut: () => void;
  onClose: () => void;
};

export default function SettingsScreen({ session, onSignOut, onClose }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Signed in as</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{session?.user?.email ?? '—'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG_DEFAULT },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
  title: { fontSize: 22, color: COLORS.TEXT_ON_WHITE, fontWeight: '700', letterSpacing: 1 },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 18, color: 'rgba(26,43,51,0.35)' },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 11, letterSpacing: 3, color: 'rgba(26,43,51,0.35)', fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(26,43,51,0.1)' },
  rowLabel: { fontSize: 15, color: 'rgba(26,43,51,0.6)' },
  rowValue: { fontSize: 15, color: 'rgba(26,43,51,0.4)', maxWidth: '60%', textAlign: 'right' },
  signOutBtn: { marginTop: 'auto', paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(200,50,50,0.35)', borderRadius: 8 },
  signOutText: { fontSize: 15, color: 'rgba(190,40,40,0.8)', fontWeight: '600', letterSpacing: 0.5 },
});
