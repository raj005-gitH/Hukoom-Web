import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';

const SERVICES = [
  { emoji: '⚡', title: 'Electrician', color: '#f59e0b' },
  { emoji: '🔧', title: 'Plumber',     color: '#3b82f6' },
  { emoji: '✨', title: 'Cleaning',    color: '#06b6d4' },
  { emoji: '🛠️', title: 'Mechanic',    color: '#8b5cf6' },
  { emoji: '🎨', title: 'Painter',     color: '#ec4899' },
  { emoji: '🪚', title: 'Carpenter',   color: '#10b981' },
];

const STATUS_STYLES = {
  open:        { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa',  label: 'Requested'   },
  in_progress: { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24',  label: 'In Progress' },
  completed:   { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80',  label: 'Completed'   },
  expired:     { bg: 'rgba(239,68,68,0.15)',   text: '#f87171',  label: 'Expired'     },
  rejected:    { bg: 'rgba(239,68,68,0.15)',   text: '#f87171',  label: 'Rejected'    },
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const displayName = user?.username || user?.fullname || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const fetchRequests = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/api/queries/user/${user._id}`);
      const sorted = (res.data.queries || res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(sorted.slice(0, 5));
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good day 👋</Text>
            <Text style={s.name}>{displayName}</Text>
          </View>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
        </View>

        {/* ── Services Grid ── */}
        <Text style={s.sectionTitle}>What do you need help with?</Text>
        <View style={s.grid}>
          {SERVICES.map((svc) => (
            <TouchableOpacity
              key={svc.title}
              style={s.serviceCard}
              onPress={() => navigation.navigate('PostQuery', { preset: svc.title })}
              activeOpacity={0.75}
            >
              <View style={[s.serviceIconBg, { backgroundColor: svc.color + '22' }]}>
                <Text style={s.serviceEmoji}>{svc.emoji}</Text>
              </View>
              <Text style={s.serviceTitle}>{svc.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Requests ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyRequests')}>
            <Text style={s.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
        ) : requests.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyText}>No requests yet. Tap a service above to get started!</Text>
          </View>
        ) : (
          requests.map(req => {
            const meta = STATUS_STYLES[req.status] || STATUS_STYLES.open;
            const postTime = new Date(req.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            const postDate = new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            return (
              <View key={req._id} style={s.reqCard}>
                <View style={s.reqTop}>
                  <Text style={s.reqLocation}>📍 {req.houseNumber ? `${req.houseNumber}, ` : ''}{req.area}, {req.city}</Text>
                  <View style={[s.badge, { backgroundColor: meta.bg }]}>
                    <Text style={[s.badgeText, { color: meta.text }]}>{meta.label}</Text>
                  </View>
                </View>
                <Text style={s.reqDesc} numberOfLines={2}>{req.workDescription}</Text>
                <View style={s.reqBottom}>
                  <Text style={s.reqPrice}>₹{req.price}</Text>
                  <Text style={s.reqTime}>🕐 {postDate}, {postTime}</Text>
                  <Text style={s.reqHero}>
                    {req.heroName ? `✅ ${req.heroName}` : '🔍 Searching…'}
                  </Text>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 32 },

  // Header
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  greeting:   { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  name:       { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: FONTS.sizes.base },

  // Section
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white, marginBottom: 14 },
  seeAll:       { fontSize: FONTS.sizes.sm, color: COLORS.accentLight, fontWeight: '600' },

  // Services grid
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: SPACING.xl },
  serviceCard:   { width: '30%', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  serviceIconBg: { width: 44, height: 44, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  serviceEmoji:  { fontSize: 22 },
  serviceTitle:  { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center' },

  // Request cards
  reqCard:     { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  reqTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reqLocation: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.white },
  badge:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full },
  badgeText:   { fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  reqDesc:     { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  reqBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reqPrice:    { fontSize: FONTS.sizes.sm, fontWeight: '800', color: COLORS.accentLight },
  reqTime:     { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  reqHero:     { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontStyle: 'italic' },

  // Empty
  emptyBox:  { alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed' },
  emptyEmoji:{ fontSize: 36, marginBottom: 12 },
  emptyText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});
