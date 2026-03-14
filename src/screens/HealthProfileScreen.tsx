import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { UserProfile, HealthCondition } from '../types';
import { CONDITIONS } from '../data/conditions';

const STEPS = ['Personal', 'Body', 'Conditions', 'Activity'];

export default function HealthProfileScreen({ navigation }: any) {
  const { saveProfile } = useUser();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    weight: '',
    height: '',
    targetWeight: '',
    conditions: [] as HealthCondition[],
    activityLevel: 'moderate' as UserProfile['activityLevel'],
    allergies: [] as string[],
  });

  const toggleCondition = (id: HealthCondition) => {
    setForm(f => ({
      ...f,
      conditions: f.conditions.includes(id)
        ? f.conditions.filter(c => c !== id)
        : [...f.conditions, id],
    }));
  };

  const handleNext = () => {
    if (step === 0) {
      if (!form.name.trim()) {
        Alert.alert('Required', 'Please enter your name.'); return;
      }
      const age = parseInt(form.age, 10);
      if (!form.age || isNaN(age) || age < 10 || age > 110) {
        Alert.alert('Invalid Age', 'Please enter a valid age between 10 and 110.'); return;
      }
    }
    if (step === 1) {
      const weight = parseFloat(form.weight);
      const height = parseFloat(form.height);
      if (!form.weight || isNaN(weight) || weight < 20 || weight > 300) {
        Alert.alert('Invalid Weight', 'Please enter a valid weight between 20 and 300 kg.'); return;
      }
      if (!form.height || isNaN(height) || height < 50 || height > 250) {
        Alert.alert('Invalid Height', 'Please enter a valid height between 50 and 250 cm.'); return;
      }
      if (form.targetWeight) {
        const tw = parseFloat(form.targetWeight);
        if (isNaN(tw) || tw < 20 || tw > 300) {
          Alert.alert('Invalid Target Weight', 'Target weight must be between 20 and 300 kg.'); return;
        }
      }
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (form.conditions.length === 0) {
      Alert.alert('Select Condition', 'Please select at least one health goal.');
      return;
    }
    try {
      const profile: UserProfile = {
        id: Date.now().toString(),
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        gender: form.gender,
        weight: parseFloat(form.weight),
        height: parseFloat(form.height),
        targetWeight: form.targetWeight ? parseFloat(form.targetWeight) : undefined,
        conditions: form.conditions,
        activityLevel: form.activityLevel,
        allergies: form.allergies,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveProfile(profile);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>
            <Text style={styles.stepSubtitle}>We'll personalize your nutrition plan</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder="e.g. Adewale"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={form.age}
                onChangeText={v => setForm(f => ({ ...f, age: v }))}
                placeholder="e.g. 35"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.toggleRow}>
                {(['male', 'female', 'other'] as const).map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.toggleBtn, form.gender === g && styles.toggleBtnActive]}
                    onPress={() => setForm(f => ({ ...f, gender: g }))}
                  >
                    <Text style={[styles.toggleText, form.gender === g && styles.toggleTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Your body metrics</Text>
            <Text style={styles.stepSubtitle}>Used to calculate your calorie target</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={form.weight}
                  onChangeText={v => setForm(f => ({ ...f, weight: v }))}
                  placeholder="75"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={form.height}
                  onChangeText={v => setForm(f => ({ ...f, height: v }))}
                  placeholder="170"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Weight (kg) — optional</Text>
              <TextInput
                style={styles.input}
                value={form.targetWeight}
                onChangeText={v => setForm(f => ({ ...f, targetWeight: v }))}
                placeholder="e.g. 70"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            {form.weight && form.height ? (
              <View style={styles.bmiCard}>
                <Text style={styles.bmiLabel}>Your BMI</Text>
                <Text style={styles.bmiValue}>
                  {(parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Your health goals</Text>
            <Text style={styles.stepSubtitle}>Select all that apply to you</Text>

            <View style={styles.conditionsGrid}>
              {CONDITIONS.map(condition => {
                const isSelected = form.conditions.includes(condition.id);
                return (
                  <TouchableOpacity
                    key={condition.id}
                    style={[
                      styles.conditionCard,
                      isSelected && { borderColor: condition.color, borderWidth: 2 },
                    ]}
                    onPress={() => toggleCondition(condition.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={[styles.conditionCheck, { backgroundColor: condition.color }]}>
                        <Ionicons name="checkmark" size={12} color="#000" />
                      </View>
                    )}
                    <Text style={styles.conditionEmoji}>{condition.icon}</Text>
                    <Text style={styles.conditionName}>{condition.shortLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 3:
        const levels = [
          { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, minimal movement' },
          { id: 'light', label: 'Light', desc: 'Walk 1-3 days/week' },
          { id: 'moderate', label: 'Moderate', desc: 'Exercise 3-5 days/week' },
          { id: 'active', label: 'Active', desc: 'Hard exercise 6-7 days' },
          { id: 'very_active', label: 'Very Active', desc: 'Physical job + exercise' },
        ];
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Activity level</Text>
            <Text style={styles.stepSubtitle}>Helps us calculate your daily calorie needs</Text>

            {levels.map(level => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.activityCard,
                  form.activityLevel === level.id && styles.activityCardActive,
                ]}
                onPress={() => setForm(f => ({ ...f, activityLevel: level.id as any }))}
              >
                <View style={styles.activityLeft}>
                  {form.activityLevel === level.id ? (
                    <View style={styles.radioActive}>
                      <View style={styles.radioInner} />
                    </View>
                  ) : (
                    <View style={styles.radio} />
                  )}
                </View>
                <View style={styles.activityRight}>
                  <Text style={[styles.activityLabel, form.activityLevel === level.id && { color: COLORS.gold }]}>
                    {level.label}
                  </Text>
                  <Text style={styles.activityDesc}>{level.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#0D0D0D', '#161616']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          {STEPS.map((s, i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                { backgroundColor: i <= step ? COLORS.gold : COLORS.darkBorder },
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepCounter}>{step + 1}/{STEPS.length}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      {/* Footer button */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.goldDark, COLORS.gold]}
            style={styles.nextButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextText}>
              {step === STEPS.length - 1 ? 'Create My Plan 🌿' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  progressContainer: { flex: 1, flexDirection: 'row', gap: 6 },
  progressBar: { flex: 1, height: 3, borderRadius: 2 },
  stepCounter: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  stepContent: { paddingTop: 8 },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  row: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.darkCard,
  },
  toggleBtnActive: { backgroundColor: COLORS.goldDark, borderColor: COLORS.gold },
  toggleText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: COLORS.gold },
  bmiCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.goldDark,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bmiLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  bmiValue: { fontSize: 24, fontWeight: '800', color: COLORS.gold },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conditionCard: {
    width: '30%',
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  conditionCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionEmoji: { fontSize: 28, marginBottom: 8 },
  conditionName: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center' },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  activityCardActive: { borderColor: COLORS.goldDark },
  activityLeft: { marginRight: 14 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.textMuted,
  },
  radioActive: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.gold,
  },
  activityRight: { flex: 1 },
  activityLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  activityDesc: { fontSize: 13, color: COLORS.textMuted },
  footer: { padding: 24, paddingBottom: 40 },
  nextButton: {
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextText: { color: COLORS.dark, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
