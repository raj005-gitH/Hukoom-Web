import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';

const ROLES = [
  { id: 'user', label: 'Customer', emoji: '👤', desc: 'Find & book trusted professionals near you.' },
  { id: 'hero', label: 'Hero (Pro)', emoji: '⭐', desc: 'Offer your services and earn money.' },
];

export default function AuthScreen() {
  const { login } = useAuth();

  const [mode, setMode] = useState('login');   // 'login' | 'register'
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [supportedCities, setSupportedCities] = useState([]);

  useEffect(() => {
    api.get('/api/supported-cities')
      .then(r => {
        console.log('[AuthScreen] Supported cities response:', r.data);
        setSupportedCities(r.data.cities || []);
      })
      .catch((err) => {
        console.log('[AuthScreen] Failed to fetch supported cities:', err.message);
      });
  }, []);

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  // User-only
  const [username, setUsername] = useState('');

  // Hero-only
  const [fullname, setFullname] = useState('');
  const [skills, setSkills] = useState('');
  const [heroCode, setHeroCode] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Password validation: alphanumeric combination of letters and numbers only
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Invalid Password',
        'Password must be a combination of letters and numbers only, with no special characters or symbols.'
      );
      return;
    }

    // Phone validation for registration
    if (mode === 'register') {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.trim())) {
        Alert.alert(
          'Invalid Phone Number',
          'Please enter a valid 10-digit Indian phone number.'
        );
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.post('/api/auth/login', { email: email.trim(), password });
        const { user: u, role: r } = res.data;
        await login(u, r);
      } else {
        // Register
        if (role === 'user') {
          if (!username || !phone || !city) {
            Alert.alert('Missing Fields', 'Please fill all fields.');
            setLoading(false);
            return;
          }
          const res = await api.post('/api/auth/register/user', {
            username, email: email.trim(), password, phone: phone.trim(), city,
          });
          await login(res.data.user, 'user');
        } else {
          if (!fullname || !phone || !city || !heroCode) {
            Alert.alert('Missing Fields', 'Please fill all fields.');
            setLoading(false);
            return;
          }
          const formattedSkills = skills
            .split(',')
            .map(s => {
              const trimmed = s.trim();
              return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : '';
            })
            .filter(Boolean);

          const res = await api.post('/api/auth/register/hero', {
            fullname, email: email.trim(), password, phone: phone.trim(), city, heroCode,
            skills: formattedSkills,
          });
          await login(res.data.hero, 'hero');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Check your connection';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={s.headerRow}>        
          </View>

          {/* ── Brand ── */}
          <View style={s.brand}>
            <View style={s.logoBox}><Text style={s.logoLetter}>H</Text></View>
            <Text style={s.appName}>Hukoom</Text>
            <Text style={s.tagline}>Your trusted local services marketplace</Text>
          </View>

          {/* ── Mode Toggle ── */}
          <View style={s.modeRow}>
            {['login', 'register'].map(m => (
              <TouchableOpacity
                key={m}
                style={[s.modeBtn, mode === m && s.modeBtnActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>
                  {m === 'login' ? 'Login' : 'Register'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Role Selector (Register only) ── */}
          {mode === 'register' && (
            <View style={s.roleRow}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[s.roleCard, role === r.id && s.roleCardActive]}
                  onPress={() => setRole(r.id)}
                >
                  <Text style={s.roleEmoji}>{r.emoji}</Text>
                  <Text style={[s.roleLabel, role === r.id && s.roleLabelActive]}>{r.label}</Text>
                  <Text style={s.roleDesc}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Form Card ── */}
          <View style={s.card}>

            {/* Register-only: Username (user) or Fullname (hero) */}
            {mode === 'register' && role === 'user' && (
              <Field label="Username" value={username} onChange={setUsername} placeholder="e.g. rahul_xyz" />
            )}
            {mode === 'register' && role === 'hero' && (
              <Field label="Full Name" value={fullname} onChange={setFullname} placeholder="e.g. Rahul Sharma" />
            )}

            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="••••••••" secure />

            {mode === 'register' && (
              <>
                <Field label="Phone" value={phone} onChange={setPhone} placeholder="9876543210" keyboard="phone-pad" />

                {/* Supported Cities Selector */}
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>City</Text>
                  {supportedCities.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 12 }}>
                      {supportedCities.map(c => (
                        <TouchableOpacity
                          key={c}
                          style={[s.cityChip, city === c && s.cityChipActive]}
                          onPress={() => setCity(c)}
                        >
                          <Text style={[s.cityChipText, city === c && s.cityChipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <TextInput
                      style={s.input}
                      value={city}
                      onChangeText={setCity}
                      placeholder="Enter your city"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="words"
                    />
                  )}
                </View>

                {role === 'hero' && (
                  <>
                    <Field
                      label="Skills (comma-separated)"
                      value={skills}
                      onChange={setSkills}
                      placeholder="Electrician, Plumber, Painter"
                    />
                    <Field
                      label="Hero Code"
                      value={heroCode}
                      onChange={setHeroCode}
                      placeholder="e.g. 1234"
                      secure
                    />
                  </>
                )}
              </>
            )}

            <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={s.submitText}>{mode === 'login' ? 'Login' : 'Create Account'}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.switchLink} onPress={() => setMode(m => m === 'login' ? 'register' : 'login')}>
              <Text style={s.switchText}>
                {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>

            <View style={s.headerRow}>        
            </View>

            <Text style={s.switchText}>
              <Text style={s.tagline}>Need Help? Contact: +91 9699406232</Text>
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Reusable Input ───────────────────────────────────────
function Field({ label, value, onChange, placeholder, secure, keyboard }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secure}
        keyboardType={keyboard || 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },

  // Brand
  brand: { alignItems: 'center', marginBottom: SPACING.xl, marginTop: SPACING.lg },
  logoBox: { width: 60, height: 60, borderRadius: RADIUS.lg, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: COLORS.accent, shadowOpacity: 0.5, shadowRadius: 16 },
  logoLetter: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  appName: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  tagline: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

  // Mode toggle
  modeRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4, marginBottom: SPACING.md },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: COLORS.accent },
  modeBtnText: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textSecondary },
  modeBtnTextActive: { color: COLORS.white },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: 8 },

  // Role cards
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: SPACING.md },
  roleCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  roleCardActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(59,130,246,0.08)' },
  roleEmoji: { fontSize: 28, marginBottom: 6 },
  roleLabel: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  roleLabelActive: { color: COLORS.accentLight },
  roleDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, textAlign: 'center', lineHeight: 16 },

  // Card
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },

  // Field
  fieldWrap: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.md, padding: 14, fontSize: FONTS.sizes.base, color: COLORS.white },

  // Submit
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, padding: 15, alignItems: 'center', marginTop: SPACING.sm, shadowColor: COLORS.accent, shadowOpacity: 0.4, shadowRadius: 12 },
  submitText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },

  // Switch link
  switchLink: { alignItems: 'center', marginTop: SPACING.md },
  switchText: { color: COLORS.accentLight, fontSize: FONTS.sizes.sm, fontWeight: '500' },

  // City selection chips
  cityChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cityChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  cityChipText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },
  cityChipTextActive: { color: COLORS.white },
});
