import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getRecipeById } from '../data/recipes';
import { getConditionById } from '../data/conditions';

export default function MealDetailScreen({ route, navigation }: any) {
  const { recipeId } = route.params;
  const recipe = getRecipeById(recipeId);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={{ color: COLORS.textPrimary }}>Recipe not found</Text>
      </View>
    );
  }

  const difficultyColor = recipe.difficulty === 'easy' ? COLORS.success : recipe.difficulty === 'medium' ? COLORS.warning : COLORS.error;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient
        colors={['#1a0a0e', '#1E1E1E']}
        style={styles.hero}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backBtnInner}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          </View>
        </TouchableOpacity>

        <Text style={styles.heroEmoji}>🍲</Text>
        <Text style={styles.heroTitle}>{recipe.name}</Text>
        <Text style={styles.heroDesc}>{recipe.description}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{recipe.prepTime + recipe.cookTime} min</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{recipe.servings} servings</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
            <Text style={[styles.metaText, { color: difficultyColor }]}>
              {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Conditions this is safe for */}
      <View style={styles.conditionsRow}>
        <Text style={styles.sectionLabel}>Safe for:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.condScroll}>
          {recipe.conditions.map(condId => {
            const cond = getConditionById(condId);
            if (!cond) return null;
            return (
              <View key={condId} style={[styles.condTag, { backgroundColor: cond.color + '20' }]}>
                <Text style={[styles.condTagText, { color: cond.color }]}>
                  {cond.icon} {cond.shortLabel}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Nutrition */}
      <View style={styles.nutritionCard}>
        <Text style={styles.sectionTitle}>Nutrition Per Serving</Text>
        <View style={styles.nutritionGrid}>
          {[
            { label: 'Calories', val: recipe.nutrition.calories, unit: 'kcal', color: COLORS.gold },
            { label: 'Protein', val: recipe.nutrition.protein, unit: 'g', color: COLORS.info },
            { label: 'Carbs', val: recipe.nutrition.carbs, unit: 'g', color: COLORS.warning },
            { label: 'Fat', val: recipe.nutrition.fat, unit: 'g', color: COLORS.diabetes },
            { label: 'Fiber', val: recipe.nutrition.fiber, unit: 'g', color: COLORS.healthy },
            { label: 'Sodium', val: recipe.nutrition.sodium, unit: 'mg', color: COLORS.textMuted },
          ].map(n => (
            <View key={n.label} style={styles.nutritionItem}>
              <Text style={[styles.nutritionVal, { color: n.color }]}>{n.val}{n.unit}</Text>
              <Text style={styles.nutritionLabel}>{n.label}</Text>
            </View>
          ))}
        </View>
        {recipe.nutrition.glycemicIndex && (
          <View style={styles.giRow}>
            <Ionicons name="analytics-outline" size={14} color={COLORS.success} />
            <Text style={styles.giText}>
              Glycemic Index: <Text style={{ color: COLORS.success, fontWeight: '700' }}>{recipe.nutrition.glycemicIndex}</Text>
              <Text style={styles.giNote}> (Low GI — excellent for blood sugar)</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Ingredients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ing, i) => (
          <View key={i} style={styles.ingredientRow}>
            <View style={styles.ingredientDot} />
            <Text style={styles.ingredientText}>
              <Text style={{ color: COLORS.gold, fontWeight: '700' }}>
                {ing.quantity} {ing.unit}
              </Text>
              {'  '}{ing.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Cook</Text>
        {recipe.steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <LinearGradient
              colors={[COLORS.burgundy, COLORS.burgundyLight]}
              style={styles.stepNumber}
            >
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </LinearGradient>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Chef's Tip */}
      {recipe.tip && (
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipLabel}>Kutunza Nutrition Tip</Text>
          </View>
          <Text style={styles.tipText}>{recipe.tip}</Text>
        </View>
      )}

      {/* Tags */}
      <View style={styles.tagsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recipe.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  hero: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backBtn: { position: 'absolute', top: 56, left: 20 },
  backBtnInner: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 64, marginBottom: 16 },
  heroTitle: {
    fontSize: 26, fontWeight: '800', color: COLORS.textPrimary,
    textAlign: 'center', marginBottom: 8,
  },
  heroDesc: {
    fontSize: 15, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22, maxWidth: 300,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 50,
    paddingVertical: 10, paddingHorizontal: 20, gap: 16,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  metaDivider: { width: 1, height: 16, backgroundColor: COLORS.border },
  difficultyDot: { width: 8, height: 8, borderRadius: 4 },

  conditionsRow: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  condScroll: { flex: 1 },
  condTag: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50, marginRight: 8 },
  condTagText: { fontSize: 12, fontWeight: '700' },

  nutritionCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.darkCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  nutritionItem: { width: '30%', alignItems: 'center', paddingVertical: 8 },
  nutritionVal: { fontSize: 18, fontWeight: '800' },
  nutritionLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  giRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  giText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  giNote: { color: COLORS.textMuted, fontWeight: '400' },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  ingredientRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  ingredientText: { fontSize: 15, color: COLORS.textPrimary, flex: 1, lineHeight: 22 },

  stepRow: { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumberText: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  stepText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, flex: 1 },

  tipCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.goldDark + '20', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.goldDark,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipIcon: { fontSize: 18 },
  tipLabel: { fontSize: 14, fontWeight: '800', color: COLORS.gold },
  tipText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 21 },

  tagsSection: { paddingHorizontal: 16, paddingBottom: 8 },
  tag: {
    backgroundColor: COLORS.darkCard, paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 50, marginRight: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  tagText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
});
