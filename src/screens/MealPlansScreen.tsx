import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { MEAL_PLANS } from '../data/mealPlans';
import { RECIPES, getRecipeById } from '../data/recipes';
import { getConditionById } from '../data/conditions';
import { HealthCondition } from '../types';

const CONDITION_FILTERS: { id: HealthCondition | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Plans', icon: '🍽️' },
  { id: 'diabetes', label: 'Diabetes', icon: '🩸' },
  { id: 'highBP', label: 'High BP', icon: '❤️' },
  { id: 'weightLoss', label: 'Weight Loss', icon: '📉' },
  { id: 'weightGain', label: 'Weight Gain', icon: '📈' },
  { id: 'obesity', label: 'Obesity', icon: '⚖️' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🌿' },
  { id: 'healthy', label: 'Healthy', icon: '🥗' },
];

export default function MealPlansScreen({ navigation }: any) {
  const { profile } = useUser();
  const [activeFilter, setActiveFilter] = useState<HealthCondition | 'all'>(
    profile?.conditions[0] || 'all'
  );

  const filteredPlans = activeFilter === 'all'
    ? MEAL_PLANS
    : MEAL_PLANS.filter(p => p.condition === activeFilter);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Plans</Text>
        <Text style={styles.headerSubtitle}>7-day Nigerian health meal plans</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {CONDITION_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              activeFilter === filter.id && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter.id as any)}
          >
            <Text style={styles.filterIcon}>{filter.icon}</Text>
            <Text style={[
              styles.filterLabel,
              activeFilter === filter.id && styles.filterLabelActive,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Plans */}
      {filteredPlans.map(plan => {
        const condInfo = getConditionById(plan.condition);
        const today = new Date().getDay();
        const todayMeals = plan.days[today % 7 || 0];

        return (
          <View key={plan.id} style={styles.planCard}>
            {/* Plan header */}
            <View style={styles.planHeader}>
              <View style={[styles.condBadge, { backgroundColor: (condInfo?.color || COLORS.gold) + '20' }]}>
                <Text style={[styles.condBadgeText, { color: condInfo?.color || COLORS.gold }]}>
                  {condInfo?.icon} {condInfo?.shortLabel}
                </Text>
              </View>
              <View style={styles.planMeta}>
                <Text style={styles.planDuration}>{plan.duration} days</Text>
                <Text style={styles.planCalories}>{plan.targetCalories} kcal/day</Text>
              </View>
            </View>

            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDesc}>{plan.description}</Text>

            {/* Benefits */}
            <View style={styles.benefitsList}>
              {plan.benefits.slice(0, 2).map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={14} color={condInfo?.color || COLORS.gold} />
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>

            {/* Today's meals preview */}
            <View style={styles.todayPreview}>
              <Text style={styles.todayLabel}>Today's Menu (Day {(today % 7) + 1})</Text>
              {[
                { meal: 'Breakfast', id: todayMeals?.breakfast, icon: '🌅' },
                { meal: 'Lunch', id: todayMeals?.lunch, icon: '☀️' },
                { meal: 'Dinner', id: todayMeals?.dinner, icon: '🌙' },
              ].map(({ meal, id, icon }) => {
                const recipe = id ? getRecipeById(id) : null;
                return (
                  <TouchableOpacity
                    key={meal}
                    style={styles.mealPreviewRow}
                    onPress={() => id && navigation.navigate('MealDetail', { recipeId: id })}
                    disabled={!id}
                  >
                    <Text style={styles.mealPreviewIcon}>{icon}</Text>
                    <View style={styles.mealPreviewInfo}>
                      <Text style={styles.mealPreviewType}>{meal}</Text>
                      <Text style={styles.mealPreviewName} numberOfLines={1}>
                        {recipe?.name || 'Rest day / Flexible'}
                      </Text>
                    </View>
                    {recipe && (
                      <View style={styles.mealPreviewCal}>
                        <Text style={styles.mealPreviewCalText}>{recipe.nutrition.calories} kcal</Text>
                      </View>
                    )}
                    {recipe && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('ConditionDetail', { conditionId: plan.condition })}
            >
              <LinearGradient
                colors={[condInfo?.color + 'cc' || COLORS.goldDark, condInfo?.color || COLORS.gold]}
                style={styles.startGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.startText}>View Full Plan →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  scrollContent: { paddingBottom: 20 },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  filterScroll: { marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 50, backgroundColor: COLORS.darkCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.goldDark + '40', borderColor: COLORS.gold },
  filterIcon: { fontSize: 14 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  filterLabelActive: { color: COLORS.gold },

  planCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  condBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50 },
  condBadgeText: { fontSize: 12, fontWeight: '700' },
  planMeta: { alignItems: 'flex-end' },
  planDuration: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  planCalories: { fontSize: 11, color: COLORS.textMuted },
  planName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  planDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 14 },

  benefitsList: { gap: 6, marginBottom: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },

  todayPreview: {
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  todayLabel: { fontSize: 12, color: COLORS.gold, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
  mealPreviewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  mealPreviewIcon: { fontSize: 16 },
  mealPreviewInfo: { flex: 1 },
  mealPreviewType: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  mealPreviewName: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', marginTop: 1 },
  mealPreviewCal: {
    backgroundColor: COLORS.darkCard, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50,
  },
  mealPreviewCalText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  startButton: { borderRadius: 12, overflow: 'hidden' },
  startGradient: { paddingVertical: 14, alignItems: 'center' },
  startText: { fontSize: 14, fontWeight: '800', color: COLORS.dark },
});
