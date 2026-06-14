import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  RefreshControl, ActivityIndicator, Alert, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';

const STATUS_META = {
  open:        { label: 'Open',        bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa',  icon: '📩' },
  in_progress: { label: 'In Progress', bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24',  icon: '🔄' },
  completed:   { label: 'Completed',   bg: 'rgba(34,197,94,0.15)',   text: '#4ade80',  icon: '✅' },
  expired:     { label: 'Expired',     bg: 'rgba(239,68,68,0.15)',   text: '#f87171',  icon: '⏰' },
  rejected:    { label: 'Cancelled',   bg: 'rgba(239,68,68,0.15)',   text: '#f87171',  icon: '❌' },
};

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
}

function getTimeAgo(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)    return 'Just now';
  if (diffMin < 60)   return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)    return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7)   return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function HeroJobsScreen() {
  const { user } = useAuth();
  const [activeJobs,  setActiveJobs]  = useState([]);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [tab,         setTab]         = useState('active'); // 'active' | 'history'

  const fetchJobs = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/api/queries/hero/${user._id}`);
      const allJobs = (res.data.queries || res.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Split into active (in_progress) and history (completed, expired, etc.)
      const active = allJobs.filter(j => j.status === 'in_progress');
      const history = allJobs.filter(j => j.status !== 'in_progress');

      setActiveJobs(active);
      setHistoryJobs(history);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  const cancelJob = async (jobId) => {
    Alert.alert('Cancel Work?', 'This may affect your rating.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Work',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/api/queries/${jobId}/cancel`, { heroId: user._id });
            fetchJobs(); // Refresh to update both tabs
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not cancel.');
          }
        },
      },
    ]);
  };

  const renderActiveJob = ({ item: job }) => {
    const timeAgo = getTimeAgo(job.createdAt);
    const postedAt = formatDateTime(job.createdAt);

    return (
      <View style={s.activeCard}>
        {/* Glow accent bar */}
        <View style={s.activeAccent} />

        <View style={s.activeBody}>
          <View style={s.activeHeader}>
            <View style={s.liveChip}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>ACTIVE</Text>
            </View>
            <Text style={s.timeAgo}>{timeAgo}</Text>
          </View>

          <Text style={s.activeDesc} numberOfLines={3}>{job.workDescription}</Text>

          <View style={s.activeDetails}>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>LOCATION</Text>
              <Text style={s.detailValue}>📍 {job.houseNumber ? `${job.houseNumber}, ` : ''}{job.area}, {job.city}</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>CUSTOMER</Text>
              <Text style={s.detailValue}>👤 {job.userName || 'Customer'}</Text>
            </View>
          </View>

          <View style={s.activeFooter}>
            <View>
              <Text style={s.priceLabel}>BUDGET</Text>
              <Text style={s.priceValue}>₹{job.price}</Text>
            </View>
            <View style={s.activeActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => cancelJob(job._id)}>
                <Text style={s.cancelText}>✕ Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={s.postedAt}>Posted: {postedAt}</Text>
        </View>
      </View>
    );
  };

  const renderHistoryJob = ({ item: job }) => {
    const meta = STATUS_META[job.status] || STATUS_META.completed;
    const postedAt = formatDateTime(job.createdAt);

    return (
      <View style={s.historyCard}>
        {/* Status header bar */}
        <View style={[s.historyStatusBar, { backgroundColor: meta.bg }]}>
          <View style={s.historyStatusLeft}>
            <Text style={{ fontSize: 13 }}>{meta.icon}</Text>
            <Text style={[s.historyStatusLabel, { color: meta.text }]}>{meta.label}</Text>
          </View>
          <Text style={s.historyTime}>{postedAt}</Text>
        </View>

        <View style={s.historyBody}>
          <Text style={s.historyDesc} numberOfLines={2}>{job.workDescription}</Text>
          <View style={s.historyMeta}>
            <Text style={s.historyLocation}>📍 {job.houseNumber ? `${job.houseNumber}, ` : ''}{job.area}, {job.city}</Text>
            <Text style={s.historyCustomer}>👤 {job.userName || 'Customer'}</Text>
          </View>
          <View style={s.historyFooter}>
            <Text style={s.historyPrice}>₹{job.price}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </SafeAreaView>
    );
  }

  const currentData = tab === 'active' ? activeJobs : historyJobs;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={s.title}>My Jobs</Text>        
        <Text style={s.count}>{activeJobs.length + historyJobs.length} total</Text>
      </View>

      <View style={s.headerRow}>
        <Text style={s.title, {color: '#a39b86'}}>Helpline: +91 9699406232</Text>
      </View>

      {/* Stats Row */}
      <View style={s.statsRow}>
        <View style={[s.statChip, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
          <Text style={[s.statNum, { color: '#fbbf24' }]}>{activeJobs.length}</Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={[s.statChip, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
          <Text style={[s.statNum, { color: '#4ade80' }]}>{historyJobs.filter(j => j.status === 'completed').length}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={[s.statChip, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
          <Text style={[s.statNum, { color: '#f87171' }]}>{historyJobs.filter(j => j.status === 'expired' || j.status === 'rejected').length}</Text>
          <Text style={s.statLabel}>Expired</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tab, tab === 'active' && s.tabActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[s.tabText, tab === 'active' && s.tabTextActive]}>
            🔥 Active ({activeJobs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'history' && s.tabActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[s.tabText, tab === 'history' && s.tabTextActive]}>
            📜 History ({historyJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Job List */}
      <FlatList
        data={currentData}
        keyExtractor={i => i._id}
        renderItem={tab === 'active' ? renderActiveJob : renderHistoryJob}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchJobs(); }}
            tintColor={COLORS.gold}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>
              {tab === 'active' ? '💼' : '📜'}
            </Text>
            <Text style={s.emptyText}>
              {tab === 'active'
                ? 'No active jobs right now.\nAccept a job from the Dashboard!'
                : 'No job history yet.\nCompleted jobs will appear here.'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: 8 },
  title:     { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  count:     { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },

  // Stats
  statsRow:  { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: 10, marginBottom: 12 },
  statChip:  { flex: 1, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  statNum:   { fontSize: FONTS.sizes.lg, fontWeight: '800' },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },

  // Tabs
  tabRow:       { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: 14, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.sm },
  tabActive:    { backgroundColor: 'rgba(245,158,11,0.15)' },
  tabText:      { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textMuted },
  tabTextActive:{ color: COLORS.goldLight },

  list: { padding: SPACING.lg, paddingTop: 4, paddingBottom: 32 },

  // ── Active Job Card ──
  activeCard:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 16, borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.3)', overflow: 'hidden' },
  activeAccent: { height: 3, backgroundColor: COLORS.gold },
  activeBody:   { padding: 16 },

  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  liveChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  liveDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gold },
  liveText:     { fontSize: FONTS.sizes.xs, fontWeight: '800', color: COLORS.goldLight, letterSpacing: 1 },
  timeAgo:      { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },

  activeDesc:    { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.white, lineHeight: 22, marginBottom: 14 },

  activeDetails: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  detailItem:    { flex: 1 },
  detailLabel:   { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  detailValue:   { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },

  activeFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12 },
  priceLabel:    { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 2 },
  priceValue:    { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.goldLight },

  activeActions: { flexDirection: 'row', gap: 10 },
  cancelBtn:     { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  cancelText:    { color: '#f87171', fontSize: FONTS.sizes.sm, fontWeight: '700' },

  postedAt:      { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 10, fontStyle: 'italic' },

  // ── History Card ──
  historyCard:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  historyStatusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  historyStatusLeft:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyStatusLabel:{ fontSize: FONTS.sizes.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  historyTime:      { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '500' },

  historyBody:     { padding: 14, paddingTop: 10 },
  historyDesc:     { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.white, lineHeight: 20, marginBottom: 8 },
  historyMeta:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  historyLocation: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  historyCustomer: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  historyFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 8 },
  historyPrice:    { fontSize: FONTS.sizes.sm, fontWeight: '800', color: COLORS.goldLight },

  emptyBox:  { alignItems: 'center', padding: 48 },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, textAlign: 'center', lineHeight: 20 },
});
