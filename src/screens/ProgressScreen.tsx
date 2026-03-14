import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { DailyLog } from '../types';

function SimpleBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <View style={chartStyles.container}>
      {data.map((val, i) => (
        <View key={i} style={chartStyles.barContainer}>
          <View style={chartStyles.barBg}>
            <LinearGradient
              colors={[color + '80', color]}
              style={[chartStyles.barFill, { height: `${(val / max) * 100}%` as any }]}
            />
          </View>
          <Text style={chartStyles.dayLabel}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 },
  barContainer: { flex: 1, alignItems: 'center', gap: 4 },
  barBg: { flex: 1, width: '100%', backgroundColor: COLORS.darkBorder, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  dayLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
});

export default function ProgressScreen() {
  const { profile, logs, todayLog, saveDailyLog, getWeekLogs, getCalorieTarget } = useUser();
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    weight: profile?.weight?.toString() || '',
    water: '0',
    systolic: '',
    diastolic: '',
    bloodSugar: '',
    mood: 3 as 1 | 2 | 3 | 4 | 5,
    notes: '',
  });

  const weekLogs = getWeekLogs();
  const calorieTarget = getCalorieTarget();

  // Last 7 days calorie data
  const weekCalories = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return weekLogs.find(l => l.date === dateStr)?.totalCalories || 0;
  });

  const weekWater = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return (weekLogs.find(l => l.date === dateStr)?.water || 0) / 100;
  });

  const handleSaveLog = async () => {
    const today = new Date().toISOString().split('T')[0];
    const log: DailyLog = {
      id: Date.now().toString(),
      date: today,
      userId: profile?.id || '1',
      meals: todayLog?.meals || [],
      water: parseInt(logForm.water) * 100,
      weight: logForm.weight ? parseFloat(logForm.weight) : undefined,
      bloodPressure: logForm.systolic && logForm.diastolic ? {
        systolic: parseInt(logForm.systolic),
        diastolic: parseInt(logForm.diastolic),
      } : undefined,
      bloodSugar: logForm.bloodSugar ? parseFloat(logForm.bloodSugar) : undefined,
      mood: logForm.mood,
      notes: logForm.notes,
      totalCalories: todayLog?.totalCalories || 0,
      totalProtein: todayLog?.totalProtein || 0,
      totalCarbs: todayLog?.totalCarbs || 0,
      totalFat: todayLog?.totalFat || 0,
    };
    await saveDailyLog(log);
    setShowLogModal(false);
    Alert.alert('Logged! ✅', 'Your health data has been saved.');
  };

  const avgCalories = weekLogs.length > 0
    ? Math.round(weekLogs.reduce((s, l) => s + l.totalCalories, 0) / weekLogs.length)
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => setShowLogModal(true)}
        >
          <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.logButtonGrad}>
            <Ionicons name="add" size={18} color={COLORS.dark} />
            <Text style={styles.logButtonText}>Log Today</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Week Summary */}
      <View style={styles.weekCard}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekStats}>
          <View style={styles.weekStat}>
            <Text style={styles.weekStatVal}>{weekLogs.length}</Text>
            <Text style={styles.weekStatLabel}>Days Logged</Text>
          </View>
          <View style={styles.weekStatDivider} />
          <View style={styles.weekStat}>
            <Text style={styles.weekStatVal}>{avgCalories}</Text>
            <Text style={styles.weekStatLabel}>Avg Calories</Text>
          </View>
          <View style={styles.weekStatDivider} />
          <View style={styles.weekStat}>
            <Text style={styles.weekStatVal}>
              {weekLogs.length > 0
                ? (weekLogs.reduce((s, l) => s + (l.water || 0), 0) / weekLogs.length / 1000).toFixed(1)
                : '0'}L
            </Text>
            <Text style={styles.weekStatLabel}>Avg Water</Text>
          </View>
        </View>
      </View>

      {/* Calorie Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Calories (7 days)</Text>
          <Text style={styles.chartTarget}>Target: {calorieTarget}</Text>
        </View>
        <SimpleBarChart data={weekCalories} color={COLORS.gold} />
      </View>

      {/* Water Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Water Intake (100ml)</Text>
        <SimpleBarChart data={weekWater} color={COLORS.weightGain} />
      </View>

      {/* Today's Stats */}
      <View style={styles.todayCard}>
        <Text style={styles.sectionTitle}>Today's Log</Text>
        {todayLog ? (
          <View style={styles.todayStats}>
            {[
              { icon: '🔥', label: 'Calories', val: `${todayLog.totalCalories} kcal` },
              { icon: '💧', label: 'Water', val: `${(todayLog.water / 1000).toFixed(1)} L` },
              { icon: '⚖️', label: 'Weight', val: todayLog.weight ? `${todayLog.weight} kg` : '--' },
              {
                icon: '❤️', label: 'Blood Pressure',
                val: todayLog.bloodPressure
                  ? `${todayLog.bloodPressure.systolic}/${todayLog.bloodPressure.diastolic}`
                  : '--'
              },
              {
                icon: '🩸', label: 'Blood Sugar',
                val: todayLog.bloodSugar ? `${todayLog.bloodSugar} mg/dL` : '--'
              },
              { icon: '😊', label: 'Mood', val: ['😞', '😕', '😐', '🙂', '😁'][todayLog.mood - 1] },
            ].map(stat => (
              <View key={stat.label} style={styles.todayStat}>
                <Text style={styles.todayStatIcon}>{stat.icon}</Text>
                <View>
                  <Text style={styles.todayStatLabel}>{stat.label}</Text>
                  <Text style={styles.todayStatVal}>{stat.val}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noLog}>
            <Text style={styles.noLogText}>No data logged today</Text>
            <TouchableOpacity onPress={() => setShowLogModal(true)}>
              <Text style={styles.noLogCta}>Log your health data →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent logs */}
      {weekLogs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Logs</Text>
          {weekLogs.slice(-5).reverse().map(log => (
            <View key={log.id} style={styles.logRow}>
              <View>
                <Text style={styles.logDate}>
                  {new Date(log.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                </Text>
                <Text style={styles.logMeta}>
                  {log.totalCalories} kcal · {(log.water / 1000).toFixed(1)}L water
                </Text>
              </View>
              {log.bloodSugar && (
                <Text style={styles.logBadge}>🩸 {log.bloodSugar}</Text>
              )}
              {log.bloodPressure && (
                <Text style={styles.logBadge}>❤️ {log.bloodPressure.systolic}/{log.bloodPressure.diastolic}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* Log Modal */}
      <Modal visible={showLogModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Log Today's Health Data</Text>

              {[
                { label: 'Weight (kg)', key: 'weight', placeholder: profile?.weight?.toString() || '70', keyboard: 'decimal-pad' },
                { label: 'Water drunk (glasses of 250ml)', key: 'water', placeholder: '8', keyboard: 'numeric' },
                { label: 'Systolic BP (top number)', key: 'systolic', placeholder: '120', keyboard: 'numeric' },
                { label: 'Diastolic BP (bottom number)', key: 'diastolic', placeholder: '80', keyboard: 'numeric' },
                { label: 'Blood Sugar (mg/dL)', key: 'bloodSugar', placeholder: '100', keyboard: 'decimal-pad' },
              ].map(field => (
                <View key={field.key} style={styles.modalField}>
                  <Text style={styles.modalLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={(logForm as any)[field.key]}
                    onChangeText={v => setLogForm(f => ({ ...f, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType={field.keyboard as any}
                  />
                </View>
              ))}

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Mood today</Text>
                <View style={styles.moodRow}>
                  {['😞', '😕', '😐', '🙂', '😁'].map((emoji, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.moodBtn, logForm.mood === i + 1 && styles.moodBtnActive]}
                      onPress={() => setLogForm(f => ({ ...f, mood: (i + 1) as any }))}
                    >
                      <Text style={styles.moodEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.modalInput, { height: 80 }]}
                  value={logForm.notes}
                  onChangeText={v => setLogForm(f => ({ ...f, notes: v }))}
                  placeholder="How are you feeling? Any food notes..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowLogModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveLog} style={{ flex: 1 }}>
                  <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.saveBtn}>
                    <Text style={styles.saveText}>Save Log</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  logButton: { borderRadius: 50, overflow: 'hidden' },
  logButtonGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16 },
  logButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.dark },

  weekCard: {
    margin: 16, backgroundColor: COLORS.darkCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  weekStats: { flexDirection: 'row', alignItems: 'center' },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatVal: { fontSize: 28, fontWeight: '800', color: COLORS.gold },
  weekStatLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  weekStatDivider: { width: 1, height: 40, backgroundColor: COLORS.border },

  chartCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.darkCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTarget: { fontSize: 11, color: COLORS.textMuted },

  todayCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.darkCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  todayStats: { gap: 12 },
  todayStat: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayStatIcon: { fontSize: 20, width: 28 },
  todayStatLabel: { fontSize: 11, color: COLORS.textMuted },
  todayStatVal: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  noLog: { alignItems: 'center', padding: 20 },
  noLogText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8 },
  noLogCta: { fontSize: 14, color: COLORS.gold, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginBottom: 12 },
  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  logDate: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  logMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  logBadge: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.darkCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 20 },
  modalField: { marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  modalInput: {
    backgroundColor: COLORS.dark, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 12, fontSize: 16, color: COLORS.textPrimary,
  },
  moodRow: { flexDirection: 'row', gap: 10 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.dark, borderWidth: 1, borderColor: COLORS.border },
  moodBtnActive: { borderColor: COLORS.gold, backgroundColor: COLORS.goldDark + '20' },
  moodEmoji: { fontSize: 24 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 32 },
  cancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { fontSize: 15, color: COLORS.textMuted, fontWeight: '700' },
  saveBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
});
