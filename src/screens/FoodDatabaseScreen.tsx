import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { NIGERIAN_FOODS, searchFoods, getFoodsForCondition } from '../data/nigerianFoods';
import { Food, FoodCategory, HealthCondition, CustomFood } from '../types';
import { useUser } from '../context/UserContext';
import { getConditionById } from '../data/conditions';

const CATEGORIES: { id: FoodCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🍽️' },
  { id: 'grains', label: 'Grains', icon: '🌾' },
  { id: 'protein', label: 'Protein', icon: '🥩' },
  { id: 'vegetables', label: 'Veggies', icon: '🥬' },
  { id: 'fruits', label: 'Fruits', icon: '🍎' },
  { id: 'soups', label: 'Soups', icon: '🍲' },
  { id: 'swallows', label: 'Swallows', icon: '🫓' },
  { id: 'beverages', label: 'Drinks', icon: '🥤' },
  { id: 'oils', label: 'Oils', icon: '🫙' },
];

function FoodCard({ food, userConditions }: { food: Food; userConditions: string[] }) {
  const [expanded, setExpanded] = useState(false);

  const safeForUser = userConditions.some(c => food.safeFor.includes(c as any));
  const avoidForUser = userConditions.some(c => food.avoidFor.includes(c as any));

  return (
    <TouchableOpacity
      style={styles.foodCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.foodCardHeader}>
        <View style={styles.foodInfo}>
          <View style={styles.foodNameRow}>
            <Text style={styles.foodName}>{food.name}</Text>
            {food.isNigerian && (
              <View style={styles.nigerianBadge}>
                <Text style={styles.nigerianBadgeText}>🇳🇬 Local</Text>
              </View>
            )}
          </View>
          {food.localName && (
            <Text style={styles.localName}>{food.localName}</Text>
          )}
          <View style={styles.nutritionRow}>
            <Text style={styles.calText}>{food.nutrition.calories} kcal</Text>
            <Text style={styles.nutritionSep}>·</Text>
            <Text style={styles.macroText}>P: {food.nutrition.protein}g</Text>
            <Text style={styles.nutritionSep}>·</Text>
            <Text style={styles.macroText}>C: {food.nutrition.carbs}g</Text>
            <Text style={styles.nutritionSep}>·</Text>
            <Text style={styles.macroText}>F: {food.nutrition.fat}g</Text>
          </View>
          {food.nutrition.glycemicIndex && (
            <Text style={styles.giText}>GI: {food.nutrition.glycemicIndex}</Text>
          )}
        </View>

        <View style={styles.foodRight}>
          {avoidForUser ? (
            <View style={styles.avoidBadge}>
              <Ionicons name="warning" size={12} color={COLORS.error} />
              <Text style={styles.avoidText}>Limit</Text>
            </View>
          ) : safeForUser ? (
            <View style={styles.safeBadge}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
              <Text style={styles.safeText}>Good for you</Text>
            </View>
          ) : null}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.textMuted}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.foodDesc}>{food.description}</Text>
          <View style={styles.benefitsList}>
            {food.benefits.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Text style={styles.benefitDot}>•</Text>
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Full nutrition */}
          <View style={styles.fullNutrition}>
            <Text style={styles.fullNutritionTitle}>Per 100g</Text>
            <View style={styles.fullNutritionGrid}>
              {[
                { l: 'Calories', v: food.nutrition.calories, u: 'kcal' },
                { l: 'Protein', v: food.nutrition.protein, u: 'g' },
                { l: 'Carbs', v: food.nutrition.carbs, u: 'g' },
                { l: 'Fat', v: food.nutrition.fat, u: 'g' },
                { l: 'Fiber', v: food.nutrition.fiber, u: 'g' },
                { l: 'Sodium', v: food.nutrition.sodium, u: 'mg' },
              ].map(n => (
                <View key={n.l} style={styles.fullNutItem}>
                  <Text style={styles.fullNutVal}>{n.v}{n.u}</Text>
                  <Text style={styles.fullNutLabel}>{n.l}</Text>
                </View>
              ))}
            </View>
          </View>

          {food.avoidFor.length > 0 && (
            <View style={styles.avoidWarning}>
              <Ionicons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.avoidWarningText}>
                Limit/avoid if you have: {food.avoidFor.map(c => {
                  const cond = getConditionById(c);
                  return cond?.shortLabel || c;
                }).join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function FoodDatabaseScreen() {
  const { profile, customFoods, addCustomFood, removeCustomFood } = useUser();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FoodCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFood, setNewFood] = useState({
    name: '', localName: '', category: 'protein' as FoodCategory, description: '',
    calories: '', protein: '', carbs: '', fat: '', fiber: '', sodium: '',
    isNigerian: true,
  });

  const allFoods = useMemo(() => {
    const custom: Food[] = customFoods.map(cf => ({
      ...cf, image: undefined, safeFor: cf.safeFor, avoidFor: cf.avoidFor,
    }));
    return [...NIGERIAN_FOODS, ...custom];
  }, [customFoods]);

  const filteredFoods = useMemo(() => {
    let foods = allFoods;
    if (search.trim()) {
      const q = search.toLowerCase();
      foods = foods.filter(
        f => f.name.toLowerCase().includes(q) ||
          (f.localName && f.localName.toLowerCase().includes(q)) ||
          f.description.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') {
      foods = foods.filter(f => f.category === activeCategory);
    }
    return foods;
  }, [search, activeCategory, allFoods]);

  const handleAddFood = async () => {
    if (!newFood.name.trim()) {
      Alert.alert('Required', 'Please enter a food name.');
      return;
    }
    const cal = parseFloat(newFood.calories) || 0;
    const prot = parseFloat(newFood.protein) || 0;
    const carb = parseFloat(newFood.carbs) || 0;
    const fatVal = parseFloat(newFood.fat) || 0;

    const food: CustomFood = {
      id: `custom_${Date.now()}`,
      name: newFood.name.trim(),
      localName: newFood.localName.trim() || undefined,
      category: newFood.category,
      nutrition: {
        calories: cal, protein: prot, carbs: carb, fat: fatVal,
        fiber: parseFloat(newFood.fiber) || 0,
        sodium: parseFloat(newFood.sodium) || 0,
        sugar: 0,
      },
      safeFor: profile?.conditions || [],
      avoidFor: [],
      description: newFood.description.trim() || `Custom ${newFood.category} food`,
      benefits: [],
      isNigerian: newFood.isNigerian,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    await addCustomFood(food);
    setShowAddModal(false);
    setNewFood({
      name: '', localName: '', category: 'protein', description: '',
      calories: '', protein: '', carbs: '', fat: '', fiber: '', sodium: '',
      isNigerian: true,
    });
    Alert.alert('Added! ✅', `${food.name} has been added to your food database.`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Food Database</Text>
            <Text style={styles.headerSubtitle}>Nigerian foods & nutrition facts</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addFoodBtn}>
            <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.addFoodGrad}>
              <Ionicons name="add" size={18} color={COLORS.dark} />
              <Text style={styles.addFoodText}>Add Food</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ugwu, eja, beans..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catTab, activeCategory === cat.id && styles.catTabActive]}
            onPress={() => setActiveCategory(cat.id as any)}
          >
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.resultCount}>
        {filteredFoods.length} foods found{customFoods.length > 0 ? ` · ${customFoods.length} custom` : ''}
      </Text>

      <FlatList
        data={filteredFoods}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <FoodCard
            food={item}
            userConditions={profile?.conditions || []}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Custom Food Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Food</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Food Name *', key: 'name', placeholder: 'e.g. Turmeric Rice', keyboard: 'default' },
                { label: 'Local Name', key: 'localName', placeholder: 'e.g. Ọṣikapa Ata Ire', keyboard: 'default' },
                { label: 'Description', key: 'description', placeholder: 'Brief description...', keyboard: 'default' },
              ].map(field => (
                <View key={field.key} style={styles.modalField}>
                  <Text style={styles.modalLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={(newFood as any)[field.key]}
                    onChangeText={v => setNewFood(f => ({ ...f, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType={field.keyboard as any}
                  />
                </View>
              ))}

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.catPickerRow}>
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catPickerItem, newFood.category === cat.id && styles.catPickerActive]}
                        onPress={() => setNewFood(f => ({ ...f, category: cat.id as FoodCategory }))}
                      >
                        <Text style={styles.catPickerIcon}>{cat.icon}</Text>
                        <Text style={[styles.catPickerLabel, newFood.category === cat.id && styles.catPickerLabelActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Text style={[styles.modalLabel, { paddingHorizontal: 0, marginBottom: 8 }]}>Nutrition (per 100g)</Text>
              <View style={styles.nutritionGrid}>
                {[
                  { label: 'Calories', key: 'calories', placeholder: '0' },
                  { label: 'Protein (g)', key: 'protein', placeholder: '0' },
                  { label: 'Carbs (g)', key: 'carbs', placeholder: '0' },
                  { label: 'Fat (g)', key: 'fat', placeholder: '0' },
                  { label: 'Fiber (g)', key: 'fiber', placeholder: '0' },
                  { label: 'Sodium (mg)', key: 'sodium', placeholder: '0' },
                ].map(field => (
                  <View key={field.key} style={styles.nutritionField}>
                    <Text style={styles.nutritionFieldLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.nutritionFieldInput}
                      value={(newFood as any)[field.key]}
                      onChangeText={v => setNewFood(f => ({ ...f, [field.key]: v }))}
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.nigerianToggle}
                onPress={() => setNewFood(f => ({ ...f, isNigerian: !f.isNigerian }))}
              >
                <Ionicons
                  name={newFood.isNigerian ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={newFood.isNigerian ? COLORS.gold : COLORS.textMuted}
                />
                <Text style={styles.nigerianToggleText}>🇳🇬 Nigerian food</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddFood} style={{ flex: 1 }}>
                  <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.saveBtn}>
                    <Text style={styles.saveText}>Add Food</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted },
  addFoodBtn: { borderRadius: 50, overflow: 'hidden' },
  addFoodGrad: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14 },
  addFoodText: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.darkCard, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },

  catScroll: { marginBottom: 4 },
  catContent: { paddingHorizontal: 16, gap: 8 },
  catTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: 50, backgroundColor: COLORS.darkCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  catTabActive: { backgroundColor: COLORS.goldDark + '30', borderColor: COLORS.goldDark },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  catLabelActive: { color: COLORS.gold },

  resultCount: { fontSize: 12, color: COLORS.textMuted, paddingHorizontal: 20, paddingBottom: 8 },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  foodCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  foodCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  foodInfo: { flex: 1, marginRight: 8 },
  foodNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  foodName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  nigerianBadge: {
    backgroundColor: '#006B3F20', paddingVertical: 2, paddingHorizontal: 7,
    borderRadius: 50, borderWidth: 1, borderColor: '#006B3F40',
  },
  nigerianBadgeText: { fontSize: 10, fontWeight: '700', color: '#00B86B' },
  localName: { fontSize: 12, color: COLORS.gold, marginBottom: 6, fontStyle: 'italic' },
  nutritionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  calText: { fontSize: 14, fontWeight: '700', color: COLORS.gold },
  nutritionSep: { color: COLORS.textMuted, fontSize: 12 },
  macroText: { fontSize: 12, color: COLORS.textSecondary },
  giText: { fontSize: 11, color: COLORS.success, marginTop: 3, fontWeight: '600' },

  foodRight: { alignItems: 'flex-end' },
  safeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.success + '20', paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 50,
  },
  safeText: { fontSize: 10, color: COLORS.success, fontWeight: '700' },
  avoidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.error + '20', paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 50,
  },
  avoidText: { fontSize: 10, color: COLORS.error, fontWeight: '700' },

  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  foodDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  benefitsList: { marginBottom: 12 },
  benefitRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  benefitDot: { color: COLORS.gold, fontSize: 14 },
  benefitText: { fontSize: 13, color: COLORS.textSecondary, flex: 1, lineHeight: 19 },

  fullNutrition: {
    backgroundColor: COLORS.dark, borderRadius: 10, padding: 12, marginBottom: 10,
  },
  fullNutritionTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginBottom: 10, letterSpacing: 1 },
  fullNutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fullNutItem: { width: '30%', alignItems: 'center', marginBottom: 4 },
  fullNutVal: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  fullNutLabel: { fontSize: 10, color: COLORS.textMuted },

  avoidWarning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.error + '10', borderRadius: 8, padding: 10,
  },
  avoidWarningText: { fontSize: 12, color: COLORS.error, flex: 1, lineHeight: 17 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.darkCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  modalField: { marginBottom: 14 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  modalInput: {
    backgroundColor: COLORS.dark, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.textPrimary,
  },
  catPickerRow: { flexDirection: 'row', gap: 8 },
  catPickerItem: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 50,
    backgroundColor: COLORS.dark, borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  catPickerActive: { backgroundColor: COLORS.goldDark + '30', borderColor: COLORS.goldDark },
  catPickerIcon: { fontSize: 14 },
  catPickerLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  catPickerLabelActive: { color: COLORS.gold },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  nutritionField: { width: '47%' },
  nutritionFieldLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  nutritionFieldInput: {
    backgroundColor: COLORS.dark, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, padding: 10, fontSize: 14, color: COLORS.textPrimary,
  },
  nigerianToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 16, paddingVertical: 8,
  },
  nigerianToggleText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 32 },
  cancelBtn: {
    flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelText: { fontSize: 15, color: COLORS.textMuted, fontWeight: '700' },
  saveBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
});
