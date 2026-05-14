import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fonts } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { getStoredStudentId } from '../../utils/studentStorage';
import { listAssignments, getAssignment, type AssignmentListItem, type AssignmentDetail } from '../../api/assignments';

export default function StudentAssignmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [detail, setDetail] = useState<AssignmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const studentId = await getStoredStudentId(user?.id ?? 0);
      if (studentId) {
        const list = await listAssignments({ studentId });
        setAssignments(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAssignments();
    }, [user?.id])
  );

  const pendingAssignments = useMemo(
    () => assignments.filter((a) => (a.completed_exercises ?? 0) < (a.exercise_count ?? 0)),
    [assignments]
  );
  
  const completedAssignments = useMemo(
    () => assignments.filter((a) => (a.exercise_count ?? 0) > 0 && (a.completed_exercises ?? 0) >= (a.exercise_count ?? 0)),
    [assignments]
  );

  const openAssignmentPlay = async (id: number) => {
    navigation.navigate('Practice', { assignmentId: id });
  };

  const openAssignmentDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const d = await getAssignment(id);
      setDetail(d);
    } catch (e) {
      setError('Failed to load assignment details');
    } finally {
      setDetailLoading(false);
    }
  };

  if (detail) {
    const scores = detail.exercises.map(e => e.last_result?.score).filter((s): s is number => typeof s === 'number');
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => setDetail(null)}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backButtonText}>Back to Assignments</Text>
        </TouchableOpacity>

        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{detail.title}</Text>
          <Text style={styles.detailAvg}>
            Average score: {avgScore != null ? `${Math.round(avgScore * 100)}%` : '—'}
          </Text>
          {detail.due_at && <Text style={styles.detailSub}>Deadline: {new Date(detail.due_at).toLocaleDateString()}</Text>}
        </View>

        {detail.exercises.map((ex, idx) => (
          <View key={ex.id} style={styles.exCard}>
            <View style={styles.exHeaderRow}>
              <Text style={styles.exType}>{idx + 1}. {ex.type.replace('_', ' ')}</Text>
              {ex.last_result?.score != null ? (
                <Text style={styles.exScore}>{Math.round(ex.last_result.score * 100)}%</Text>
              ) : (
                <Text style={styles.exStatus}>{ex.completed ? 'Completed' : 'Pending'}</Text>
              )}
            </View>
            <View style={styles.exContentRow}>
              <Text style={styles.exLabel}>Expected:</Text>
              <Text style={styles.exText}>{ex.expected}</Text>
            </View>
            {ex.last_result?.student_response ? (
              <View style={styles.exContentRow}>
                <Text style={styles.exLabel}>Written:</Text>
                <Text style={styles.exText}>{ex.last_result.student_response}</Text>
              </View>
            ) : null}
            {ex.last_result?.feedback ? (
              <View style={styles.exContentRow}>
                <Text style={styles.exLabel}>Feedback:</Text>
                <Text style={styles.exText}>{ex.last_result.feedback}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>My Assignments</Text>
      
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading || detailLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: spacing.xl }} />
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending assignments</Text>
            {pendingAssignments.length === 0 ? (
              <Text style={styles.muted}>No pending assignments.</Text>
            ) : (
              pendingAssignments.map(a => (
                <TouchableOpacity key={a.id} style={styles.card} onPress={() => openAssignmentPlay(a.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{a.title}</Text>
                    <Text style={styles.cardSub}>Progress: {a.completed_exercises}/{a.exercise_count}</Text>
                    {a.due_at && <Text style={styles.cardWarn}>Due: {new Date(a.due_at).toLocaleDateString()}</Text>}
                  </View>
                  <MaterialIcons name="play-circle-outline" size={32} color={colors.primary} />
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed assignments</Text>
            {completedAssignments.length === 0 ? (
              <Text style={styles.muted}>No completed assignments yet.</Text>
            ) : (
              completedAssignments.map(a => (
                <TouchableOpacity key={a.id} style={styles.card} onPress={() => openAssignmentDetail(a.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{a.title}</Text>
                    <Text style={styles.cardSub}>Completed: {a.exercise_count}/{a.exercise_count}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={32} color={colors.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: colors.text, fontFamily: fonts.bold, marginBottom: spacing.lg },
  
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: fonts.semiBold, marginBottom: spacing.sm },
  muted: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.regular },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: fonts.semiBold },
  cardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontFamily: fonts.regular },
  cardWarn: { fontSize: 13, color: colors.warning, marginTop: 2, fontFamily: fonts.regular },
  
  errorBox: { backgroundColor: '#ffebee', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontFamily: fonts.regular },
  
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backButtonText: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 16, marginLeft: 4 },
  
  detailHeader: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: borderRadius.md, marginBottom: spacing.lg },
  detailTitle: { fontSize: 22, fontWeight: '700', color: colors.text, fontFamily: fonts.bold, marginBottom: 4 },
  detailAvg: { fontSize: 16, color: colors.text, fontFamily: fonts.semiBold, marginBottom: 4 },
  detailSub: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.regular },
  
  exCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  exHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  exType: { fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: fonts.semiBold, textTransform: 'capitalize' },
  exScore: { fontSize: 16, fontWeight: '700', color: colors.success, fontFamily: fonts.bold },
  exStatus: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.semiBold },
  
  exContentRow: { marginBottom: spacing.xs },
  exLabel: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.semiBold },
  exText: { fontSize: 14, color: colors.text, fontFamily: fonts.regular },
});
