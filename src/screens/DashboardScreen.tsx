import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { CONDITIONS, getConditionById } from '../data/conditions';
import { getMealPlanForCondition } from '../data/mealPlans';

const { width } = Dimensions.get('window');
const LOGO_DARK = require('../../assets/logo-dark.jpg');

export default function DashboardScreen({ navigation }: any) {
  const { profile, todayLog, getCalorieTarget, getBMI, getBMICategory } = useUser();

  if (!profile) return null;

  const calorieTarget = getCalorieTarget();
  const todayCalories = todayLog?.totalCalories || 0;
  const caloriePercent = Math.min((todayCalories / calorieTarget) * 100, 100);
  const waterTarget = 2500;
  const todayWater = todayLog?.water || 0;
  const bmi = getBMI();
  const bmiCategory = getBMICategory();
  const timeNow = new Date().getHours();
  const greeting = timeNow < 12 ? 'Good morning' : timeNow < 17 ? 'Good afternoon' : 'Good evening';

  const primaryCondition = profile.conditions[0];
  const conditionInfo = getConditionById(primaryCondition);
  const mealPlan = getMealPlanForCondition(primaryCondition);
  const today = new Date().getDay();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={['#1a0a0e', '#0D0D0D']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{profile.name} 👑</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Go to profile" accessibilityRole="button"
          >
            <Image source={LOGO_DARK} style={styles.logoAvatar} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Brand tag */}
        <View style={styles.brandTag}>
          <View style={styles.brandDot} />
          <Text style={styles.brandTagText}>KutunzaCare · Nurturing Kings</Text>
        </View>
      </LinearGradient>

      {/* Today's Calories */}
      <View style={styles.calorieCard}>
        <View style={styles.calorieHeader}>
          <Text style={styles.cardTitle}>Today's Nutrition</Text>
          <Text style={styles.calorieDate}>
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })}
          </Text>
        </View>

        <View style={styles.calorieMain}>
          <View style={styles.calorieNumbers}>
            <Text style={styles.calorieConsumed}>{todayCalories}</Text>
            <Text style={styles.calorieSep}> / </Text>
            <Text style={styles.calorieTarget}>{calorieTarget} kcal</Text>
          </View>
          <Text style={styles.calorieRemaining}>
            {calorieTarget - todayCalories > 0
              ? `${calorieTarget - todayCalories} kcal remaining`
              : 'Target reached!'}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <LinearGradient
            colors={[COLORS.goldDark, COLORS.gold]}
            style={[styles.progressFill, { width: `${caloriePercent}%` as any }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        {/* Macros quick view */}
        <View style={styles.macrosRow}>
          {[
            { label: 'Protein', val: todayLog?.totalProtein || 0, unit: 'g', color: COLORS.info },
            { label: 'Carbs', val: todayLog?.totalCarbs || 0, unit: 'g', color: COLORS.warning },
            { label: 'Fat', val: todayLog?.totalFat || 0, unit: 'g', color: COLORS.diabetes },
            { label: 'Water', val: Math.round(todayWater / 100) / 10, unit: 'L', color: COLORS.weightGain },
          ].map(macro => (
            <View key={macro.label} style={styles.macroItem}>
              <Text style={[styles.macroVal, { color: macro.color }]}>
                {macro.val}{macro.unit}
              </Text>
              <Text style={styles.macroLabel}>{macro.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Health Conditions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Health Goals</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.conditionScroll}>
          {profile.conditions.map(condId => {
            const cond = getConditionById(condId);
            if (!cond) return null;
            return (
              <TouchableOpacity
                key={condId}
                style={styles.conditionPill}
                onPress={() => navigation.navigate('ConditionDetail', { conditionId: condId })}
              >
                <View style={[styles.conditionDot, { backgroundColor: cond.color }]} />
                <Text style={styles.conditionPillText}>{cond.icon} {cond.shortLabel}</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Today's Meal Plan */}
      {mealPlan && conditionInfo && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meal Plan</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MealPlans')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mealPlanCard}>
            <View style={[styles.mealPlanBadge, { backgroundColor: conditionInfo.color + '20' }]}>
              <Text style={[styles.mealPlanBadgeText, { color: conditionInfo.color }]}>
                {conditionInfo.icon} {conditionInfo.shortLabel} Plan
              </Text>
            </View>
            <Text style={styles.mealPlanName}>{mealPlan.name}</Text>

            {['Breakfast', 'Lunch', 'Dinner'].map((meal, i) => {
              const dayData = mealPlan.days[today % 7 || 0];
              const mealIds = [dayData?.breakfast, dayData?.lunch, dayData?.dinner];
              return (
                <TouchableOpacity
                  key={meal}
                  style={styles.mealRow}
                  onPress={() => mealIds[i] && navigation.navigate('MealDetail', { recipeId: mealIds[i] })}
                >
                  <View style={[styles.mealDot, { backgroundColor: i === 0 ? COLORS.warning : i === 1 ? COLORS.gold : COLORS.burgundyLight }]} />
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealType}>{meal}</Text>
                    <Text style={styles.mealName}>View Recipe →</Text>
                  </View>
                  <Ionicons name="restaurant-outline" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Health Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>BMI</Text>
            <Text style={styles.statValue}>{bmi || '--'}</Text>
            <Text style={[styles.statCategory, {
              color: bmiCategory === 'Healthy Weight' ? COLORS.success :
                bmiCategory === 'Underweight' ? COLORS.info : COLORS.warning
            }]}>
              {bmiCategory}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>{profile.weight}kg</Text>
            {profile.targetWeight && (
              <Text style={styles.statCategory}>
                Goal: {profile.targetWeight}kg
              </Text>
            )}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Water</Text>
            <Text style={styles.statValue}>{Math.round(todayWater / 100) / 10}L</Text>
            <Text style={styles.statCategory}>Goal: 2.5L</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>0🔥</Text>
            <Text style={styles.statCategory}>days logged</Text>
          </View>
        </View>
      </View>

      {/* KutunzaCare CTA */}
      <TouchableOpacity style={styles.ctaCard} activeOpacity={0.88}>
        <LinearGradient colors={[COLORS.burgundyDark, COLORS.burgundy]} style={styles.ctaGradient}>
          <View style={styles.ctaContent}>
            <View>
              <Text style={styles.ctaTitle}>Want meals prepared?</Text>
              <Text style={styles.ctaSubtitle}>Order chef-cooked healthy meals →</Text>
            </View>
            <Text style={styles.ctaEmoji}>👨‍🍳</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  scrollContent: { paddingBottom: 20 },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  greeting: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  userName: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  profileBtn: {
    marginTop: 4, width: 44, height: 44, borderRadius: 8,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.gold + '50',
  },
  logoAvatar: { width: 44, height: 44 },
  brandTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  brandTagText: { fontSize: 12, color: COLORS.gold, fontWeight: '600', letterSpacing: 0.5 },

  calorieCard: {
    margin: 16,
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calorieHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  calorieDate: { fontSize: 12, color: COLORS.textMuted },
  calorieMain: { marginBottom: 12 },
  calorieNumbers: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  calorieConsumed: { fontSize: 36, fontWeight: '800', color: COLORS.gold },
  calorieSep: { fontSize: 20, color: COLORS.textMuted },
  calorieTarget: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary },
  calorieRemaining: { fontSize: 13, color: COLORS.textMuted },
  progressBg: { height: 8, backgroundColor: COLORS.darkBorder, borderRadius: 4, marginBottom: 16 },
  progressFill: { height: 8, borderRadius: 4, minWidth: 4 },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center' },
  macroVal: { fontSize: 16, fontWeight: '700' },
  macroLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  seeAll: { fontSize: 13, color: COLORS.gold, fontWeight: '600' },

  conditionScroll: { marginBottom: 8 },
  conditionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.darkCard, borderRadius: 50,
    paddingVertical: 10, paddingHorizontal: 16,
    marginRight: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  conditionDot: { width: 8, height: 8, borderRadius: 4 },
  conditionPillText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },

  mealPlanCard: {
    backgroundColor: COLORS.darkCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  mealPlanBadge: {
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 50, marginBottom: 8,
  },
  mealPlanBadgeText: { fontSize: 12, fontWeight: '700' },
  mealPlanName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  mealRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  mealDot: { width: 10, height: 10, borderRadius: 5 },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 1 },
  mealName: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.darkCard,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  statCategory: { fontSize: 12, color: COLORS.textMuted },

  ctaCard: { margin: 16, borderRadius: 16, overflow: 'hidden' },
  ctaGradient: { borderRadius: 16 },
  ctaContent: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  ctaSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  ctaEmoji: { fontSize: 36 },
});
