import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';

const STATUS_META = {
  open:        { label: 'Requested',   bg: 'rgba(59,130,246,0.15)',   text: '#60a5fa',  icon: '📩' },
  in_progress: { label: 'In Progress', bg: 'rgba(245,158,11,0.15)',   text: '#fbbf24',  icon: '🔄' },
  completed:   { label: 'Completed',   bg: 'rgba(34,197,94,0.15)',    text: '#4ade80',  icon: '✅' },
  expired:     { label: 'Expired',     bg: 'rgba(239,68,68,0.15)',    text: '#f87171',  icon: '⏰' },
  rejected:    { label: 'Cancelled',   bg: 'rgba(239,68,68,0.15)',    text: '#f87171',  icon: '❌' },
};

function getIcon(desc = '') {
  const d = desc.toLowerCase();
  if (d.includes('electric') || d.includes('wiring')) return '⚡';
  if (d.includes('plumb')  || d.includes('pipe'))    return '🔧';
  if (d.includes('clean'))                            return '✨';
  if (d.includes('paint'))                            return '🎨';
  if (d.includes('carpent')|| d.includes('wood'))    return '🪚';
  if (d.includes('mechanic')|| d.includes('car'))    return '🚗';
  return '🛠️';
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date, time };
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

export default function MyRequestsScreen() {
  const { user } = useAuth();
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/api/queries/user/${user._id}`);
      const sorted = (res.data.queries || res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(sorted);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { fetchRequests(); }, [fetchRequests]));

  const markComplete = async (id) => {
    Alert.alert('Mark Complete?', 'Confirm that the work has been done.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Done!',
        onPress: async () => {
          try {
            await api.patch(`/api/queries/${id}/complete`, { userId: user._id });
            setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'completed' } : r));
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not update.');
          }
        },
      },
    ]);
  };

  const rejectHero = async (id) => {
    Alert.alert(
      'Reject Hero?',
      'The hero will be removed and your request will be reopened for other heroes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/api/queries/${id}/reject`, { userId: user._id });
              setRequests(prev => prev.map(r =>
                r._id === id ? { ...r, status: 'open', heroId: null, heroName: null } : r
              ));
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Could not reject.');
            }
          },
        },
      ]
    );
  };

  const cancelRequest = async (id) => {
    Alert.alert(
      'Cancel Request?',
      'Are you sure you want to cancel this service request?',
      [
        { text: 'No, Keep it', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/api/queries/${id}/user-cancel`, { userId: user._id });
              setRequests(prev => prev.map(r =>
                r._id === id ? { ...r, status: 'rejected' } : r
              ));
              Alert.alert('Success', 'Request cancelled successfully.');
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Could not cancel request.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item: req }) => {
    const meta = STATUS_META[req.status] || STATUS_META.open;
    const icon = getIcon(req.workDescription);
    const { date, time } = formatDateTime(req.createdAt);
    const timeAgo = getTimeAgo(req.createdAt);
    const isInProgress = req.status === 'in_progress';

    return (
      <View style={s.card}>
        {/* Status Bar */}
        <View style={[s.statusBar, { backgroundColor: meta.bg }]}>
          <View style={s.statusLeft}>
            <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
            <Text style={[s.statusLabel, { color: meta.text }]}>{meta.label}</Text>
          </View>
          <Text style={s.timeAgo}>{timeAgo}</Text>
        </View>

        {/* Card Content */}
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <View style={s.iconWrap}><Text style={{ fontSize: 22 }}>{icon}</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.desc} numberOfLines={2}>{req.workDescription}</Text>
              <Text style={s.location}>📍 {req.houseNumber ? `${req.houseNumber}, ` : ''}{req.area}, {req.city}</Text>
            </View>
          </View>

          {/* Posted time + Price Row */}
          <View style={s.detailsRow}>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>POSTED</Text>
              <Text style={s.detailValue}>{date}</Text>
              <Text style={s.detailSub}>{time}</Text>
            </View>
            <View style={s.detailDivider} />
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>BUDGET</Text>
              <Text style={[s.detailValue, { color: COLORS.accentLight }]}>₹{req.price}</Text>
            </View>
            <View style={s.detailDivider} />
            <View style={[s.detailItem, { flex: 1.5 }]}>
              <Text style={s.detailLabel}>HERO</Text>
              <Text style={s.detailValue} numberOfLines={1}>
                {req.heroName ? `✅ ${req.heroName}` : '🔍 Searching…'}
              </Text>
            </View>
          </View>

          {/* Action Buttons for open status */}
          {req.status === 'open' && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={s.cancelRequestBtn}
                onPress={() => cancelRequest(req._id)}
              >
                <Text style={s.cancelRequestBtnText}>✕ Cancel Request</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons for in_progress */}
          {isInProgress && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={s.completeBtn}
                onPress={() => markComplete(req._id)}
              >
                <Text style={s.completeBtnText}>✓ Mark Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.rejectBtn}
                onPress={() => rejectHero(req._id)}
              >
                <Text style={s.rejectBtnText}>✕ Reject Hero</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  // Count stats
  const openCount      = requests.filter(r => r.status === 'open').length;
  const progressCount  = requests.filter(r => r.status === 'in_progress').length;
  const doneCount      = requests.filter(r => r.status === 'completed').length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerRow}>        
      </View>

      <View style={s.headerRow}>
        <Text style={s.title}>My Requests</Text>                
        <Text style={s.count}>{requests.length} total</Text>        
      </View>
      <View style={s.statsRow}>
        <Text style={[s.statNum, { color: '#6f92bd' }]}>Helpline: +91 96994 06232</Text>
      </View>

      {/* Stats Row */}
      {requests.length > 0 && (
        <View style={s.statsRow}>
          <View style={[s.statChip, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
            <Text style={[s.statNum, { color: '#60a5fa' }]}>{openCount}</Text>
            <Text style={s.statLabel}>Requested</Text>
          </View>
          <View style={[s.statChip, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
            <Text style={[s.statNum, { color: '#fbbf24' }]}>{progressCount}</Text>
            <Text style={s.statLabel}>In Progress</Text>
          </View>
          <View style={[s.statChip, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
            <Text style={[s.statNum, { color: '#4ade80' }]}>{doneCount}</Text>
            <Text style={s.statLabel}>Completed</Text>
          </View>
        </View>
      )}

      <FlatList
        data={requests}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
            <Text style={s.emptyText}>No requests yet.</Text>
            <Text style={s.emptyHint}>Post a service request to get started!</Text>
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

  // Stats row
  statsRow:  { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: 10, marginBottom: 12 },
  statChip:  { flex: 1, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  statNum:   { fontSize: FONTS.sizes.lg, fontWeight: '800' },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },

  list: { padding: SPACING.lg, paddingTop: 4 },

  // Card
  card:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  statusBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusLabel:{ fontSize: FONTS.sizes.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeAgo:    { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },

  cardBody: { padding: 16, paddingTop: 12 },
  cardTop:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },

  iconWrap: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  desc:     { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  location: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },

  // Details Row
  detailsRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, padding: 12 },
  detailItem:    { flex: 1, alignItems: 'center' },
  detailDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 8 },
  detailLabel:   { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  detailValue:   { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.white },
  detailSub:     { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 1 },

  // Action buttons
  actionRow:  { flexDirection: 'row', gap: 10, marginTop: 14 },
  completeBtn:     { flex: 1, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center' },
  completeBtnText: { color: '#4ade80', fontWeight: '700', fontSize: FONTS.sizes.sm },
  rejectBtn:       { flex: 1, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center' },
  rejectBtnText:   { color: '#f87171', fontWeight: '700', fontSize: FONTS.sizes.sm },
  cancelRequestBtn:     { flex: 1, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.2)', borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center' },
  cancelRequestBtnText: { color: '#f87171', fontWeight: '700', fontSize: FONTS.sizes.sm },

  emptyBox:  { alignItems: 'center', padding: 48 },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
  emptyHint: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 6 },
});
