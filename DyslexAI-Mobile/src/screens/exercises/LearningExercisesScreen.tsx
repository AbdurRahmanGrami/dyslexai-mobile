import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fonts } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { getStoredStudentId } from '../../utils/studentStorage';
import { getStudentStats, type StudentStats } from '../../api/exercises';

const LEARNING_MODULES: Array<{ id: 'word_typing' | 'sentence_typing' | 'handwriting' | 'tracing'; title: string; subtitle: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
  { id: 'word_typing', title: 'Word Typing', subtitle: 'Spell and type individual words', icon: 'sort' },
  { id: 'sentence_typing', title: 'Sentence Builder', subtitle: 'Type full sentences', icon: 'segment' },
  { id: 'handwriting', title: 'Write & Upload', subtitle: 'Write a letter, word, or sentence on paper (or whiteboard), then upload a photo', icon: 'edit' },
  { id: 'tracing', title: 'Letter & Word Tracing', subtitle: 'Draw letters and words on screen with your finger (no photo)', icon: 'gesture' },
];

export default function LearningExercisesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'LearningExercises'>>();
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const studentId = await getStoredStudentId(user?.id ?? 0);
      if (studentId) {
        const s = await getStudentStats(studentId);
        setStats(s);
      } else {
        setStats(null);
      }
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
  }, []);

  // Refetch stats when user returns to this screen so progress is up to date
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const accuracyByType = stats?.accuracy_by_type ?? {};
  const modules = LEARNING_MODULES.map((mod) => ({
    ...mod,
    progress: Math.round((accuracyByType[mod.id] ?? 0) * 100),
  }));

  const totalSessions = stats?.total_sessions ?? 0;
  const avgScore = stats?.average_score ?? 0;
  const trend = stats?.score_trend ?? [];
  const starsToday = trend.length; // approximate: last N sessions as "recent"

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <Text style={styles.screenTitle}>Learning Exercises - DyslexAI</Text>

      <TouchableOpacity
        style={styles.startPracticeCard}
        onPress={() => navigation.navigate('Practice')}
        activeOpacity={0.8}
      >
        <View style={styles.startPracticeIconWrap}>
          <MaterialIcons name="fitness-center" size={32} color="#fff" />
        </View>
        <View style={styles.startPracticeContent}>
          <Text style={styles.startPracticeTitle}>Start practice</Text>
          <Text style={styles.startPracticeSubtitle}>Adaptive word & typing exercises with instant feedback</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.heading}>Your Progress</Text>
        <Text style={styles.subheading}>Keep it up! You're doing great.</Text>
        {loading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : (
          <>
            <View style={styles.starsRow}>
              <Text style={styles.starsCount}>{totalSessions}</Text>
              <Text style={styles.starsLabel}>Sessions total</Text>
            </View>
            <View style={styles.starsRow}>
              <Text style={styles.starsCount}>{Math.round(avgScore * 100)}%</Text>
              <Text style={styles.starsLabel}>Average score</Text>
            </View>
            <View style={styles.streakRow}>
              <MaterialIcons name="bolt" size={20} color={colors.primary} />
              <Text style={styles.streakText}>Recent sessions: {trend.length > 0 ? trend.map((s) => `${Math.round(s * 100)}%`).join(', ') : '—'}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Learning Modules</Text>
        <Text style={styles.subheading}>Accuracy by exercise type (from your practice)</Text>
        {modules.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            style={styles.moduleCard}
            onPress={() => navigation.navigate('Practice', { exerciseType: mod.id })}
            activeOpacity={0.8}
          >
            <View style={styles.moduleIconWrap}>
              <MaterialIcons name={mod.icon} size={28} color={colors.primary} />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
              <View style={styles.progressBarWrap}>
                <View style={[styles.progressBar, { width: `${Math.min(100, mod.progress)}%` }]} />
              </View>
              <Text style={styles.progressPct}>{mod.progress}%</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    fontFamily: fonts.bold,
  },
  section: { marginBottom: spacing.lg },
  heading: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, fontFamily: fonts.semiBold },
  subheading: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm, fontFamily: fonts.regular },
  muted: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.regular },
  starsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: spacing.sm },
  starsCount: { fontSize: 24, fontWeight: '700', color: colors.primary, fontFamily: fonts.bold },
  starsLabel: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.regular },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  streakText: { fontSize: 14, color: colors.text, fontFamily: fonts.regular },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  moduleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  moduleContent: { flex: 1 },
  moduleTitle: { fontSize: 16, fontWeight: '600', color: colors.text, fontFamily: fonts.semiBold },
  moduleSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontFamily: fonts.regular },
  progressBarWrap: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressPct: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontFamily: fonts.regular },
  startPracticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  startPracticeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  startPracticeContent: { flex: 1 },
  startPracticeTitle: { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: fonts.bold },
  startPracticeSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2, fontFamily: fonts.regular },
});
