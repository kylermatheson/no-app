import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Props = {
  onAuthSuccess: () => void;
  onSkip: () => void;
};

type Mode = 'login' | 'signup';

export default function AuthScreen({ onAuthSuccess, onSkip }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setConfirmSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (confirmSent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.wave}>📬</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to{'\n'}{email}
          </Text>
          <Text style={styles.hint}>Once confirmed, come back and sign in.</Text>
          <TouchableOpacity onPress={() => setConfirmSent(false)} style={styles.linkBtn}>
            <Text style={styles.linkText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.appName}>No</Text>
            <Text style={styles.tagline}>Your NOs live here.{'\n'}Never lose them.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
                onPress={() => { setMode('login'); setError(null); }}
              >
                <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Sign in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
                onPress={() => { setMode('signup'); setError(null); }}
              >
                <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Create account</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(26,43,51,0.3)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(26,43,51,0.3)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading || !email || !password}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.submitText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipText}>Continue without account</Text>
            <Text style={styles.skipHint}>Your data stays on this device only</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 32, gap: 40, flexGrow: 1, justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  header: { alignItems: 'center', gap: 12 },
  appName: { fontSize: 56, fontWeight: '900', color: '#1A2B33', letterSpacing: 8 },
  tagline: { fontSize: 16, color: 'rgba(26,43,51,0.45)', textAlign: 'center', lineHeight: 24 },
  form: { gap: 12 },
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(26,43,51,0.06)', borderRadius: 12, padding: 4, marginBottom: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: 'rgba(91,163,199,0.15)' },
  toggleText: { fontSize: 14, color: 'rgba(26,43,51,0.4)', fontWeight: '600' },
  toggleTextActive: { color: '#5BA3C7', fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(26,43,51,0.15)',
    borderRadius: 12,
    padding: 14,
    color: '#1A2B33',
    fontSize: 15,
    backgroundColor: 'rgba(26,43,51,0.03)',
  },
  errorText: { fontSize: 13, color: '#C0392B', textAlign: 'center' },
  submitBtn: { backgroundColor: '#7FB9D4', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  skipBtn: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  skipText: { fontSize: 14, color: 'rgba(26,43,51,0.35)' },
  skipHint: { fontSize: 11, color: 'rgba(26,43,51,0.2)' },
  wave: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A2B33' },
  subtitle: { fontSize: 15, color: 'rgba(26,43,51,0.5)', textAlign: 'center', lineHeight: 22 },
  hint: { fontSize: 13, color: 'rgba(26,43,51,0.3)', textAlign: 'center' },
  linkBtn: { marginTop: 8, padding: 8 },
  linkText: { fontSize: 14, color: 'rgba(26,43,51,0.4)' },
});
