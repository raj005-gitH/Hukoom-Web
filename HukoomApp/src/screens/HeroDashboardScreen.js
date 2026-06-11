import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';

export default function HeroDashboardScreen() {
  const { user } = useAuth();
  const [jobs,       setJobs]       = useState([]);
  const [activeJob,  setActiveJob]  = useState(null); // current in-progress job
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const heroName = user?.fullname || 'Hero';
  const initials = heroName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const fetchJobs = useCallback(async () => {
    try {
      // Fetch all open queries
      const [allRes, heroJobsRes] = await Promise.all([
        api.get('/api/queries/all'),
        api.get(`/api/queries/hero/${user?._id}`),
      ]);

      const allOpen = allRes.data || [];
      const heroJobs = heroJobsRes.data?.queries || [];

      // Find if hero already has an active in-progress job
      const inProgress = heroJobs.find(j => j.status === 'in_progress') || null;
      setActiveJob(inProgress);
      setJobs(allOpen);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  const acceptJob = async (jobId) => {
    if (activeJob) {
      Alert.alert(
        '⚠️ Active Job',
        'You already have a job in progress. Complete or cancel it first before accepting a new one.',
      );
      return;
    }
    Alert.alert('Accept Job?', 'You will be assigned to this request.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await api.patch(`/api/queries/${jobId}/accept`, {
              heroId:   user._id,
              heroName: user.fullname,
            });
            fetchJobs(); // refresh to show active job banner
            Alert.alert('✅ Accepted!', 'You have been assigned to this job. Contact the customer.');
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not accept job.');
          }
        },
      },
    ]);
  };

  const cancelActiveJob = async () => {
    if (!activeJob) return;
    Alert.alert('Cancel Job?', 'This may affect your rating.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Job',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/api/queries/${activeJob._id}/cancel`, {
              heroId: user._id,
            });
            fetchJobs();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not cancel.');
          }
        },
      },
    ]);
  };

  const renderJob = ({ item: job }) => {
    const date = new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const isBusy = !!activeJob;
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.jobArea}>📍 {job.houseNumber ? `${job.houseNumber}, ` : ''}{job.area}, {job.city}</Text>
            <Text style={s.jobDesc} numberOfLines={3}>{job.workDescription}</Text>
            <Text style={s.postedBy}>👤 {job.userName || 'Customer'}</Text>
          </View>
          <View style={s.priceTag}>
            <Text style={s.priceLabel}>Budget</Text>
            <Text style={s.priceAmount}>₹{job.price}</Text>
          </View>
        </View>

        <View style={s.cardFooter}>
          <Text style={s.dateText}>Posted {date}</Text>
          <TouchableOpacity
            style={[s.acceptBtn, isBusy && s.acceptBtnDisabled]}
            onPress={() => acceptJob(job._id)}
          >
            <Text style={s.acceptBtnText}>{isBusy ? '🔒 Busy' : 'Accept Job →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Welcome back ⭐</Text>
          <Text style={s.name}>{heroName}</Text>
          <Text style={s.city}>📍 {user?.city || 'Your city'}</Text>
        </View>
        <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
      </View>

      {/* Skills */}
      {user?.skills?.length > 0 && (
        <View style={s.skillsRow}>
          {user.skills.slice(0, 4).map(sk => (
            <View key={sk} style={s.skillChip}>
              <Text style={s.skillText}>{sk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Active Job Banner */}
      {activeJob && (
        <View style={s.activeBanner}>
          <View style={s.activeBannerLeft}>
            <Text style={s.activeBannerTitle}>🔥 Active Job</Text>
            <Text style={s.activeBannerDesc} numberOfLines={2}>{activeJob.workDescription}</Text>
            <Text style={s.activeBannerLocation}>📍 {activeJob.houseNumber ? `${activeJob.houseNumber}, ` : ''}{activeJob.area}, {activeJob.city}</Text>
            <Text style={s.activeBannerPrice}>₹{activeJob.price} · <Text style={s.activeBannerCustomer}>👤 {activeJob.userName}</Text></Text>
          </View>
          <TouchableOpacity style={s.cancelActiveBtn} onPress={cancelActiveJob}>
            <Text style={s.cancelActiveBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.sectionTitle}>  {activeJob ? '⏳ Other Jobs (Complete your current job first)' : 'Available Jobs'}</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={i => i._id}
          renderItem={renderJob}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} tintColor={COLORS.gold} />}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
              <Text style={s.emptyText}>No open jobs available right now.</Text>
              <Text style={s.emptyHint}>Pull down to refresh.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: SPACING.lg, paddingBottom: 12 },
  greeting:   { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  name:       { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  city:       { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  avatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.background, fontWeight: '800', fontSize: FONTS.sizes.base },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: 8, marginBottom: 16 },
  skillChip: { backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 },
  skillText: { fontSize: FONTS.sizes.xs, color: COLORS.goldLight, fontWeight: '600' },

  // Active job banner
  activeBanner:       { marginHorizontal: SPACING.lg, marginBottom: 14, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.4)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeBannerLeft:   { flex: 1 },
  activeBannerTitle:  { fontSize: FONTS.sizes.sm, fontWeight: '800', color: COLORS.goldLight, marginBottom: 4 },
  activeBannerDesc:   { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600', lineHeight: 18, marginBottom: 4 },
  activeBannerLocation: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: 2 },
  activeBannerPrice:  { fontSize: FONTS.sizes.xs, color: COLORS.goldLight, fontWeight: '700' },
  activeBannerCustomer: { color: COLORS.textSecondary, fontWeight: '500' },
  cancelActiveBtn:    { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 8 },
  cancelActiveBtnText:{ color: '#f87171', fontSize: FONTS.sizes.xs, fontWeight: '700' },

  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white, marginBottom: 12, paddingLeft: 4 },
  list:         { padding: SPACING.lg, paddingTop: 4, paddingBottom: 32 },

  card:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTop:   { flexDirection: 'row', gap: 12, marginBottom: 14 },
  jobArea:   { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.accentLight, marginBottom: 4 },
  jobDesc:   { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 4 },
  postedBy:  { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  priceTag:  { alignItems: 'flex-end', minWidth: 70 },
  priceLabel:{ fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: 2 },
  priceAmount:{ fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.goldLight },

  cardFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  dateText:        { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  acceptBtn:       { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingHorizontal: 18, paddingVertical: 9 },
  acceptBtnDisabled:{ backgroundColor: 'rgba(255,255,255,0.08)' },
  acceptBtnText:   { color: COLORS.background, fontWeight: '800', fontSize: FONTS.sizes.sm },

  emptyBox:  { alignItems: 'center', padding: 48 },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, textAlign: 'center' },
  emptyHint: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 6 },
});
