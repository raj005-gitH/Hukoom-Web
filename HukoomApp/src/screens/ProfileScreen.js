import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';

export default function ProfileScreen() {
  const { user, role, logout } = useAuth();

  const isHero      = role === 'hero';
  const displayName = isHero ? user?.fullname : user?.username;
  const initials    = (displayName || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const INFO_ROWS = [
    { icon: '📧', label: 'Email',    value: user?.email    || '—' },
    { icon: '📞', label: 'Phone',    value: user?.phone    || '—' },
    { icon: '📍', label: 'City',     value: user?.city     || '—' },
    { icon: '👤', label: 'Role',     value: isHero ? 'Hero (Service Provider)' : 'Customer' },
    ...(isHero && user?.skills?.length ? [{ icon: '🛠️', label: 'Skills', value: user.skills.join(', ') }] : []),
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.headerRow}>        
        </View>

        {/* ── Avatar Card ── */}
        <View style={s.avatarCard}>
          <View style={[s.avatarRing, { borderColor: isHero ? COLORS.gold : COLORS.accent }]}>
            <View style={[s.avatarInner, { backgroundColor: isHero ? COLORS.gold : COLORS.accent }]}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={s.displayName}>{displayName}</Text>
          <Text style={s.email}>{user?.email}</Text>
          <View style={[s.roleBadge, { backgroundColor: isHero ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', borderColor: isHero ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)' }]}>
            <Text style={[s.roleBadgeText, { color: isHero ? COLORS.goldLight : COLORS.accentLight }]}>
              {isHero ? '⭐ Hero Account' : '✓ Verified Member'}
            </Text>
          </View>
        </View>

        {/* ── Info Card ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account Details</Text>
          {INFO_ROWS.map((row, i) => (
            <View key={row.label} style={[s.infoRow, i < INFO_ROWS.length - 1 && s.infoRowBorder]}>
              <Text style={s.infoIcon}>{row.icon}</Text>
              <View>
                <Text style={s.infoLabel}>{row.label}</Text>
                <Text style={s.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── App Info ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>About Hukoom</Text>
          <Text style={s.aboutText}>
            Hukoom connects customers with trusted local service professionals across India.
            Find electricians, plumbers, cleaners, mechanics and more — right at your doorstep.
          </Text>
          <Text style={s.version}>Helpline: +91 96994 06232</Text>
          <Text style={s.version}>Version 1.0.0 (MVP)</Text>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>🚪  Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: 8 },

  // Avatar card
  avatarCard:   { alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  avatarRing:   { width: 88, height: 88, borderRadius: 44, borderWidth: 3, padding: 3, marginBottom: 16 },
  avatarInner:  { flex: 1, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText:   { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  displayName:  { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  email:        { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 16 },
  roleBadge:    { paddingHorizontal: 16, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  roleBadgeText:{ fontSize: FONTS.sizes.sm, fontWeight: '600' },

  // Info card
  card:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.md },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoIcon:  { fontSize: 18, marginTop: 2 },
  infoLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  infoValue: { fontSize: FONTS.sizes.base, color: COLORS.white, fontWeight: '500' },

  // About
  aboutText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 22 },
  version:   { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 12 },

  // Logout
  logoutBtn:  { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.2)', borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', marginTop: SPACING.sm },
  logoutText: { color: '#f87171', fontSize: FONTS.sizes.base, fontWeight: '700' },
});
