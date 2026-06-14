import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';

const EXPIRY_OPTIONS = [
  { label: '1 hour',   value: 60   },
  { label: '2 hours',  value: 120  },
  { label: '6 hours',  value: 360  },
  { label: '12 hours', value: 720  },
  { label: '1 day',    value: 1440 },
  { label: '3 days',   value: 4320 },
];

export default function PostQueryScreen({ route, navigation }) {
  const { user } = useAuth();
  const preset = route?.params?.preset || '';

  const [cities,  setCities]  = useState([]);
  const [city,    setCity]    = useState('');
  const [areas,   setAreas]   = useState([]);
  const [area,    setArea]    = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [desc,    setDesc]    = useState(preset ? `Need a professional ${preset} to: ` : '');
  const [price,   setPrice]   = useState('');
  const [expiry,  setExpiry]  = useState(120);
  const [loading, setLoading] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [step,    setStep]    = useState(1); // 1=location, 2=details

  useEffect(() => {
    api.get('/api/supported-cities')
      .then(r => setCities(r.data.cities || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!city) {
      setAreas([]);
      return;
    }
    setLoadingAreas(true);
    api.get(`/api/city-areas/${encodeURIComponent(city)}`)
      .then(r => {
        setAreas(r.data.areas || []);
        setArea(''); // reset selected area
      })
      .catch(() => {})
      .finally(() => setLoadingAreas(false));
  }, [city]);

  const submitQuery = async () => {
    if (!city || !area || !houseNumber || !desc || !price) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/queries', {
        userId:          user._id,
        userName:        user.username || user.fullname,
        city,
        area,
        houseNumber,
        workDescription: desc,
        price:           Number(price),
        expiryMinutes:   expiry,
      });
      Alert.alert('✅ Request Posted!', 'Your service request is live. Heroes will contact you soon.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not post request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>        
          </View>
          
          <View style={s.header}>
            <Text style={s.title}>Post a Request</Text>
            <Text style={s.sub}>Tell us what you need — Heroes will respond quickly.</Text>
          </View>

          {/* Step indicator */}
          <View style={s.stepRow}>
            {[1, 2].map(n => (
              <View key={n} style={[s.stepDot, step >= n && s.stepDotActive]}>
                <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
              </View>
            ))}
            <View style={s.stepLine} />
          </View>

          {step === 1 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>📍 Location</Text>

              <Text style={s.label}>City</Text>
              {cities.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {cities.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[s.chip, city === c && s.chipActive]}
                      onPress={() => setCity(c)}
                    >
                      <Text style={[s.chipText, city === c && s.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <TextInput
                  style={s.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Greater Noida"
                  placeholderTextColor={COLORS.textMuted}
                />
              )}

              <Text style={s.label}>Area / Locality</Text>
              {loadingAreas ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 12 }} />
              ) : areas.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {areas.map(a => (
                    <TouchableOpacity
                      key={a}
                      style={[s.chip, area === a && s.chipActive]}
                      onPress={() => setArea(a)}
                    >
                      <Text style={[s.chipText, area === a && s.chipTextActive]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <TextInput
                  style={s.input}
                  value={area}
                  onChangeText={setArea}
                  placeholder="Type your area"
                  placeholderTextColor={COLORS.textMuted}
                />
              )}

              <Text style={s.label}>House / Flat / Plot No.</Text>
              <TextInput
                style={s.input}
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder="e.g. House No. 45, Sector 12"
                placeholderTextColor={COLORS.textMuted}
              />

              <TouchableOpacity
                style={[s.btn, !city || !area || !houseNumber ? s.btnDisabled : null]}
                onPress={() => setStep(2)}
                disabled={!city || !area || !houseNumber}
              >
                <Text style={s.btnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>📝 Job Details</Text>

              <Text style={s.label}>Describe the work</Text>
              <TextInput
                style={[s.input, { height: 100, textAlignVertical: 'top' }]}
                value={desc}
                onChangeText={setDesc}
                placeholder="Describe what you need done…"
                placeholderTextColor={COLORS.textMuted}
                multiline
              />

              <Text style={s.label}>Your Budget (₹)</Text>
              <TextInput
                style={s.input}
                value={price}
                onChangeText={setPrice}
                placeholder="e.g. 500"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />

              <Text style={s.label}>Request expires in</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {EXPIRY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.chip, expiry === opt.value && s.chipActive]}
                    onPress={() => setExpiry(opt.value)}
                  >
                    <Text style={[s.chipText, expiry === opt.value && s.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={s.row}>
                <TouchableOpacity style={[s.btn, s.btnOutline, { flex: 1, marginRight: 8 }]} onPress={() => setStep(1)}>
                  <Text style={[s.btnText, { color: COLORS.textSecondary }]}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { flex: 2 }]} onPress={submitQuery} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color={COLORS.white} />
                    : <Text style={s.btnText}>Post Request ✓</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },

  header: { marginBottom: SPACING.lg },
  title:  { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  sub:    { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },

  stepRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, position: 'relative' },
  stepLine:      { position: 'absolute', left: 20, right: 0, height: 2, backgroundColor: COLORS.surface, zIndex: -1 },
  stepDot:       { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  stepDotActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  stepNum:       { color: COLORS.textMuted, fontWeight: '700' },
  stepNumActive: { color: COLORS.white },

  card:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.md },

  label: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.md, padding: 14, fontSize: FONTS.sizes.base, color: COLORS.white, marginBottom: 16 },

  chip:          { paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginRight: 8 },
  chipActive:    { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText:      { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive:{ color: COLORS.white },

  row:       { flexDirection: 'row' },
  btn:       { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, padding: 15, alignItems: 'center' },
  btnOutline:{ backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  btnDisabled:{ opacity: 0.4 },
  btnText:   { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
