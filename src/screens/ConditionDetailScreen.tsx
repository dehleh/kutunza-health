import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getConditionById } from '../data/conditions';
import { NIGERIAN_FOODS, getFoodsForCondition } from '../data/nigerianFoods';
import { getRecipesForCondition } from '../data/recipes';
import { getMealPlanForCondition } from '../data/mealPlans';

export default function ConditionDetailScreen({ route, navigation }: any) {
  const { conditionId } = route.params;
  const condition = getConditionById(conditionId);
  const foods = getFoodsForCondition(conditionId).slice(0, 8);
  const recipes = getRecipesForCondition(conditionId);
  const mealPlan = getMealPlanForCondition(conditionId);

  if (!condition) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient
        colors={[condition.color + '30', '#0D0D0D']}
        style={styles.hero}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backBtnInner}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          </View>
        </TouchableOpacity>

        <Text style={styles.heroEmoji}>{condition.icon}</Text>
        <Text style={styles.heroTitle}>{condition.label}</Text>
        <Text style={styles.heroDesc}>{condition.description}</Text>

        {/* Daily targets */}
        <View style={styles.targetsRow}>
          <View style={styles.targetItem}>
            <Text style={styles.targetVal}>{condition.dailyTargets.calories[0]}-{condition.dailyTargets.calories[1]}</Text>
            <Text style={styles.targetLabel}>Calories</Text>
          </View>
          <View style={styles.targetDivider} />
          <View style={styles.targetItem}>
            <Text style={styles.targetVal}>{condition.dailyTargets.sodium}mg</Text>
            <Text style={styles.targetLabel}>Max Sodium</Text>
          </View>
          <View style={styles.targetDivider} />
          <View style={styles.targetItem}>
            <Text style={styles.targetVal}>{condition.dailyTargets.fiber}g+</Text>
            <Text style={styles.targetLabel}>Min Fiber</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Key Facts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Facts</Text>
        {condition.keyFacts.map((fact, i) => (
          <View key={i} style={styles.factRow}>
            <View style={[styles.factDot, { backgroundColor: condition.color }]} />
            <Text style={styles.factText}>{fact}</Text>
          </View>
        ))}
      </View>

      {/* Dietary Guidelines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Guidelines</Text>
        <View style={styles.guidelinesCard}>
          {condition.dietaryGuidelines.map((g, i) => (
            <View key={i} style={styles.guidelineRow}>
              <Ionicons name="checkmark-circle" size={16} color={condition.color} />
              <Text style={styles.guidelineText}>{g}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Foods to eat */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Best Foods for You</Text>
        <View style={styles.foodTagsRow}>
          {condition.foodsToEat.map((food, i) => (
            <View key={i} style={[styles.foodTag, { backgroundColor: condition.color + '20', borderColor: condition.color + '40' }]}>
              <Text style={[styles.foodTagText, { color: condition.color }]}>✓ {food}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Foods to avoid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Foods to Limit/Avoid</Text>
        <View style={styles.foodTagsRow}>
          {condition.foodsToAvoid.map((food, i) => (
            <View key={i} style={styles.avoidTag}>
              <Text style={styles.avoidTagText}>✗ {food}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recipes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended Recipes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'MealPlans' })}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recipes.map(recipe => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.recipeCard}
              onPress={() => navigation.navigate('MealDetail', { recipeId: recipe.id })}
            >
              <Text style={styles.recipeEmoji}>🍲</Text>
              <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
              <Text style={styles.recipeMeta}>{recipe.nutrition.calories} kcal · {recipe.cookTime + recipe.prepTime}min</Text>
              <View style={[styles.diffBadge, {
                backgroundColor: recipe.difficulty === 'easy' ? COLORS.success + '20' : COLORS.warning + '20',
              }]}>
                <Text style={[styles.diffText, {
                  color: recipe.difficulty === 'easy' ? COLORS.success : COLORS.warning,
                }]}>
                  {recipe.difficulty}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Warning */}
      <View style={styles.warningCard}>
        <Ionicons name="information-circle" size={18} color={COLORS.warning} />
        <Text style={styles.warningText}>{condition.warningSign}</Text>
      </View>

      {/* CTA - get meal plan */}
      {mealPlan && (
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('Main', { screen: 'MealPlans' })}>
          <LinearGradient
            colors={[condition.color + 'cc', condition.color]}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View>
              <Text style={styles.ctaTitle}>Start {mealPlan.name}</Text>
              <Text style={styles.ctaSub}>{mealPlan.duration}-day plan · {mealPlan.targetCalories} kcal/day</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="rgba(0,0,0,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  hero: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 56, left: 20 },
  backBtnInner: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 56, marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  heroDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, maxWidth: 300, marginBottom: 20 },
  targetsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 14,
  },
  targetItem: { flex: 1, alignItems: 'center' },
  targetVal: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  targetLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  targetDivider: { width: 1, backgroundColor: COLORS.border, alignSelf: 'stretch' },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  seeAll: { fontSize: 13, color: COLORS.gold, fontWeight: '600' },

  factRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  factDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  factText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 21, flex: 1 },

  guidelinesCard: {
    backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  guidelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  guidelineText: { fontSize: 14, color: COLORS.textSecondary, flex: 1, lineHeight: 20 },

  foodTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodTag: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 50, borderWidth: 1,
  },
  foodTagText: { fontSize: 12, fontWeight: '700' },
  avoidTag: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 50,
    backgroundColor: COLORS.error + '15', borderWidth: 1, borderColor: COLORS.error + '30',
  },
  avoidTagText: { fontSize: 12, fontWeight: '700', color: COLORS.error },

  recipeCard: {
    width: 160, backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginRight: 10,
  },
  recipeEmoji: { fontSize: 32, marginBottom: 8 },
  recipeName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4, lineHeight: 18 },
  recipeMeta: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },
  diffBadge: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50 },
  diffText: { fontSize: 10, fontWeight: '700' },

  warningCard: {
    marginHorizontal: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.warning + '10', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.warning + '30',
  },
  warningText: { fontSize: 13, color: COLORS.warning, flex: 1, lineHeight: 19 },

  ctaButton: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  ctaTitle: { fontSize: 16, fontWeight: '800', color: 'rgba(0,0,0,0.85)' },
  ctaSub: { fontSize: 12, color: 'rgba(0,0,0,0.6)', marginTop: 2 },
});
