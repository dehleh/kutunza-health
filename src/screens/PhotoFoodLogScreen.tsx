import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { getConditionById } from '../data/conditions';
import { DailyLog } from '../types';
import { analyseImage, parseAIJson, getErrorMessage } from '../services/aiService';
import { isApiReady, API_NOT_CONFIGURED_MSG } from '../config/api';
import { useNetworkStatus } from '../utils/network';
import { isFoodAnalysis, sanitiseFoodAnalysis, FoodItem, FoodAnalysis } from '../utils/validation';

const RATING_CONFIG = {
  excellent: { color: COLORS.success, label: '✅ Excellent', bg: COLORS.success + '20' },
  good:      { color: '#7ED321',     label: '👍 Good',      bg: '#7ED32120' },
  moderate:  { color: COLORS.warning, label: '⚠️ Moderate', bg: COLORS.warning + '20' },
  avoid:     { color: COLORS.error,   label: '🚫 Limit This', bg: COLORS.error + '20' },
};

function RatingBadge({ rating }: { rating: keyof typeof RATING_CONFIG }) {
  const cfg = RATING_CONFIG[rating];
  return (
    <View style={[rStyles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}>
      <Text style={[rStyles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function HealthScoreRing({ score }: { score: number }) {
  const color = score >= 8 ? COLORS.success : score >= 5 ? COLORS.warning : COLORS.error;
  return (
    <View style={[rStyles.scoreRing, { borderColor: color }]}>
      <Text style={[rStyles.scoreNumber, { color }]}>{score}</Text>
      <Text style={rStyles.scoreLabel}>/ 10</Text>
    </View>
  );
}

const rStyles = StyleSheet.create({
  badge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 50, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  scoreRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  scoreLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
});

export default function PhotoFoodLogScreen({ navigation }: any) {
  const { profile, todayLog, saveDailyLog, useAICall, getAICallsRemaining } = useUser();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const buildPrompt = () => {
    if (!profile) return '';
    const conditions = profile.conditions.map(c => getConditionById(c)?.label || c).join(', ');
    return `You are a Nigerian nutritionist and food analyst for KutunzaCare. Analyze this meal photo carefully.

USER CONDITIONS: ${conditions}
USER: ${profile.age}yo ${profile.gender}, ${profile.weight}kg, BMI: ${(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)}

Identify every food item visible. Estimate Nigerian serving sizes if applicable. Return ONLY valid JSON (no markdown, no text before/after):

{
  "foods": [
    {
      "name": "Jollof Rice",
      "localName": "Oryza sativa (jollof preparation)",
      "estimatedGrams": 250,
      "calories": 350,
      "protein": 7,
      "carbs": 68,
      "fat": 7,
      "fiber": 2,
      "glycemicIndex": 72,
      "rating": "moderate",
      "ratingReason": "High GI white rice — limit to 1 rubber (150g) and pair with protein to slow absorption"
    }
  ],
  "totalCalories": 350,
  "totalProtein": 7,
  "totalCarbs": 68,
  "totalFat": 7,
  "overallRating": "moderate",
  "mealType": "lunch",
  "summary": "2-sentence personalised summary referencing their specific conditions",
  "recommendations": [
    "Specific actionable tip 1 using Nigerian food knowledge",
    "Specific actionable tip 2"
  ],
  "warningFoods": ["Any item especially problematic for their conditions"],
  "healthScore": 5
}

Rating scale for their conditions:
- excellent (8-10): Optimal — ideal macros, GI, sodium for all conditions
- good (6-7): Suitable with minor points to watch  
- moderate (4-5): Acceptable occasionally, portion control needed
- avoid (1-3): Not recommended — conflicts with one or more conditions

healthScore: overall 1-10 score for this specific user's conditions.

If image is not food: return healthScore:0, empty foods array, explain in summary.
Nigerian foods to recognize: jollof rice, eba/garri, pounded yam, moi moi, akara, suya, pepper soup, efo riro, egusi, ofe onugbu, zobo, kunu, fried plantain/boli, unripe plantain, garden egg, beans/ewa, ofada rice, banga soup, oha soup, edikaikong, afang, nkwobi, point and kill, etc.`;
  };

  const analyzeImage = async (uri: string) => {
    // Guard: API configured?
    if (!isApiReady()) {
      Alert.alert('Setup Required', API_NOT_CONFIGURED_MSG);
      return;
    }

    // Guard: AI daily quota
    if (!useAICall()) {
      Alert.alert(
        'Daily Limit Reached',
        'You\'ve used all 25 AI calls for today. Your quota resets at midnight.',
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    fadeAnim.setValue(0);

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const raw = await analyseImage({
        imageBase64: base64,
        prompt: buildPrompt(),
      });

      const parsed = parseAIJson<FoodAnalysis>(raw, isFoodAnalysis);

      if (!parsed) {
        Alert.alert(
          'Analysis Unclear',
          'Kutu AI could not confidently identify the foods in this photo. Try a clearer, well-lit image of your meal.',
        );
        return;
      }

      const safe = sanitiseFoodAnalysis(parsed);
      setAnalysis(safe);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (err) {
      Alert.alert('Analysis Failed', getErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    setIsSaved(false);
    setAnalysis(null);

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [4, 3], quality: 0.75,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        analyzeImage(result.assets[0].uri);
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Gallery access is required.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [4, 3], quality: 0.75,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        analyzeImage(result.assets[0].uri);
      }
    }
  };

  const saveToLog = async () => {
    if (!analysis || !profile) return;
    const today = new Date().toISOString().split('T')[0];
    const existing = todayLog;

    // Persist the photo locally
    let savedPhotoUri: string | undefined;
    if (imageUri) {
      try {
        const photoDir = `${FileSystem.documentDirectory}food_photos/`;
        const dirInfo = await FileSystem.getInfoAsync(photoDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(photoDir, { intermediates: true });
        }
        const filename = `meal_${Date.now()}.jpg`;
        const destUri = `${photoDir}${filename}`;
        await FileSystem.copyAsync({ from: imageUri, to: destUri });
        savedPhotoUri = destUri;
      } catch (e) {
        console.warn('Could not save photo:', e);
      }
    }

    const newMeals: DailyLog['meals'] = [
      ...(existing?.meals || []),
      ...analysis.foods.map(f => ({
        name: f.name,
        mealType: analysis.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        quantity: f.estimatedGrams,
        unit: 'g',
        calories: f.calories,
        time: new Date().toISOString(),
        photoUri: savedPhotoUri,
      })),
    ];

    const log: DailyLog = {
      id: existing?.id || Date.now().toString(),
      date: today,
      userId: profile.id,
      meals: newMeals,
      water: existing?.water || 0,
      weight: existing?.weight,
      mood: (existing?.mood || 3) as 1 | 2 | 3 | 4 | 5,
      notes: existing?.notes,
      totalCalories: (existing?.totalCalories || 0) + analysis.totalCalories,
      totalProtein: (existing?.totalProtein || 0) + analysis.totalProtein,
      totalCarbs: (existing?.totalCarbs || 0) + analysis.totalCarbs,
      totalFat: (existing?.totalFat || 0) + analysis.totalFat,
    };

    try {
      await saveDailyLog(log);
      setIsSaved(true);
    } catch (e) {
      Alert.alert('Error', 'Could not save to your log. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a0a0e', '#0D0D0D']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}
          accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Photo Food Log</Text>
          <Text style={styles.headerSub}>AI analyses your meal instantly</Text>
        </View>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>⚡ AI Powered</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image area */}
        <View style={styles.imageArea}>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.foodImage} resizeMode="cover" />
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.gold} />
                  <Text style={styles.analyzingText}>Analyzing your meal...</Text>
                  <Text style={styles.analyzingSubText}>Identifying Nigerian foods & nutrition</Text>
                </View>
              )}
              {!isAnalyzing && (
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => { setImageUri(null); setAnalysis(null); }}
                >
                  <View style={styles.retakeBtnInner}>
                    <Ionicons name="refresh" size={14} color={COLORS.textPrimary} />
                    <Text style={styles.retakeBtnText}>New Photo</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>📸</Text>
              <Text style={styles.placeholderTitle}>Snap your meal</Text>
              <Text style={styles.placeholderSub}>
                Kutu AI will identify every food and calculate full nutrition facts — personalized to your conditions
              </Text>
            </View>
          )}
        </View>

        {/* Camera buttons */}
        {!isAnalyzing && (
          <View style={styles.cameraButtons}>
            <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage('camera')}
              accessibilityLabel="Take a photo of your meal" accessibilityRole="button">
              <LinearGradient colors={[COLORS.burgundyDark, COLORS.burgundy]} style={styles.cameraBtnGrad}>
                <Ionicons name="camera" size={18} color={COLORS.gold} />
                <Text style={styles.cameraBtnText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImage('gallery')}>
              <View style={styles.galleryBtnInner}>
                <Ionicons name="images" size={18} color={COLORS.textSecondary} />
                <Text style={styles.galleryBtnText}>Gallery</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Analysis results */}
        {analysis && (
          <Animated.View style={[styles.analysisSection, { opacity: fadeAnim }]}>

            {/* Overall score */}
            <View style={styles.overallCard}>
              <View>
                <Text style={styles.overallLabel}>MEAL ANALYSIS</Text>
                <RatingBadge rating={analysis.overallRating} />
                <Text style={styles.mealTypeLabel}>
                  {analysis.mealType.charAt(0).toUpperCase() + analysis.mealType.slice(1)} · {analysis.foods.length} food{analysis.foods.length > 1 ? 's' : ''} detected
                </Text>
              </View>
              <View style={styles.overallRight}>
                <HealthScoreRing score={analysis.healthScore} />
                <Text style={styles.healthScoreLabel}>Health Score</Text>
              </View>
            </View>

            {/* Macros */}
            <View style={styles.macrosCard}>
              {[
                { label: 'Calories', val: analysis.totalCalories, unit: 'kcal', color: COLORS.gold },
                { label: 'Protein', val: analysis.totalProtein, unit: 'g', color: COLORS.info },
                { label: 'Carbs', val: analysis.totalCarbs, unit: 'g', color: COLORS.warning },
                { label: 'Fat', val: analysis.totalFat, unit: 'g', color: COLORS.diabetes },
              ].map(m => (
                <View key={m.label} style={styles.macroItem}>
                  <Text style={[styles.macroVal, { color: m.color }]}>{m.val}{m.unit}</Text>
                  <Text style={styles.macroLabel}>{m.label}</Text>
                </View>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{analysis.summary}</Text>
            </View>

            {/* Foods detected */}
            <Text style={styles.sectionTitle}>Foods Detected</Text>
            {analysis.foods.map((food, i) => (
              <View key={i} style={styles.foodItem}>
                <View style={styles.foodItemHeader}>
                  <View style={styles.foodItemLeft}>
                    <Text style={styles.foodItemName}>{food.name}</Text>
                    {food.localName && <Text style={styles.foodItemLocal}>{food.localName}</Text>}
                    <Text style={styles.foodItemGrams}>~{food.estimatedGrams}g estimated</Text>
                  </View>
                  <View style={styles.foodItemRight}>
                    <RatingBadge rating={food.rating} />
                    <Text style={styles.foodItemCal}>{food.calories} kcal</Text>
                  </View>
                </View>
                <Text style={styles.foodItemReason}>{food.ratingReason}</Text>
                <View style={styles.foodNutritionRow}>
                  <Text style={styles.foodNutText}>P: {food.protein}g</Text>
                  <Text style={styles.foodNutText}>C: {food.carbs}g</Text>
                  <Text style={styles.foodNutText}>F: {food.fat}g</Text>
                  {food.glycemicIndex && (
                    <Text style={[styles.foodNutText, { color: food.glycemicIndex < 55 ? COLORS.success : food.glycemicIndex < 70 ? COLORS.warning : COLORS.error }]}>
                      GI: {food.glycemicIndex}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            {/* Warnings */}
            {analysis.warningFoods.length > 0 && (
              <View style={styles.warningsCard}>
                <View style={styles.warningsHeader}>
                  <Ionicons name="warning" size={16} color={COLORS.warning} />
                  <Text style={styles.warningsTitle}>Watch Out For</Text>
                </View>
                {analysis.warningFoods.map((w, i) => (
                  <Text key={i} style={styles.warningItem}>⚠️ {w}</Text>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <View style={styles.recoCard}>
                <Text style={styles.recoTitle}>💡 Kutu's Personalised Tips</Text>
                {analysis.recommendations.map((r, i) => (
                  <View key={i} style={styles.recoItem}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.recoText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Save button */}
            {!isSaved ? (
              <TouchableOpacity onPress={saveToLog} style={styles.saveButton}>
                <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.saveButtonGrad}>
                  <Ionicons name="add-circle" size={20} color={COLORS.dark} />
                  <Text style={styles.saveButtonText}>Add to Today's Log</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.savedBanner}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.savedText}>Added to today's food log ✓</Text>
              </View>
            )}

            {/* Order CTA */}
            <TouchableOpacity style={styles.orderCta} onPress={() => navigation.navigate('Main', { screen: 'Order' })}>
              <LinearGradient colors={[COLORS.burgundyDark, COLORS.burgundy]} style={styles.orderCtaGrad}>
                <View>
                  <Text style={styles.orderCtaTitle}>Want healthier versions of these meals?</Text>
                  <Text style={styles.orderCtaSub}>KutunzaCare cooks & delivers to your door →</Text>
                </View>
                <Text style={styles.orderCtaEmoji}>👨‍🍳</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textMuted },
  aiBadge: {
    marginLeft: 'auto' as any,
    backgroundColor: COLORS.gold + '20', paddingVertical: 3, paddingHorizontal: 10,
    borderRadius: 50, borderWidth: 1, borderColor: COLORS.goldDark,
  },
  aiBadgeText: { fontSize: 11, color: COLORS.gold, fontWeight: '800' },
  scroll: { flex: 1 },
  imageArea: { margin: 16 },
  imageContainer: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  foodImage: { width: '100%', height: 240, borderRadius: 16 },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,13,0.88)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  analyzingText: { fontSize: 16, fontWeight: '800', color: COLORS.gold },
  analyzingSubText: { fontSize: 13, color: COLORS.textMuted },
  retakeBtn: { position: 'absolute', top: 10, right: 10 },
  retakeBtnInner: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  retakeBtnText: { fontSize: 11, color: COLORS.textPrimary, fontWeight: '600' },
  imagePlaceholder: {
    height: 220, borderRadius: 16,
    backgroundColor: COLORS.darkCard, borderWidth: 2, borderColor: COLORS.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24,
  },
  placeholderEmoji: { fontSize: 52 },
  placeholderTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary },
  placeholderSub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  cameraButtons: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 },
  cameraBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  cameraBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  cameraBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.gold },
  galleryBtn: { flex: 0.5 },
  galleryBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, backgroundColor: COLORS.darkCard, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, height: '100%',
  },
  galleryBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  analysisSection: { paddingHorizontal: 16, gap: 12 },
  overallCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.darkCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  overallLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  mealTypeLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  overallRight: { alignItems: 'center', gap: 4 },
  healthScoreLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  macrosCard: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  macroItem: { alignItems: 'center', gap: 2 },
  macroVal: { fontSize: 18, fontWeight: '800' },
  macroLabel: { fontSize: 11, color: COLORS.textMuted },
  summaryCard: {
    backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  summaryText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 21 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 4 },
  foodItem: {
    backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  foodItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  foodItemLeft: { flex: 1, marginRight: 8 },
  foodItemName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  foodItemLocal: { fontSize: 12, color: COLORS.gold, fontStyle: 'italic', marginTop: 1 },
  foodItemGrams: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  foodItemRight: { alignItems: 'flex-end', gap: 4 },
  foodItemCal: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  foodItemReason: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 8 },
  foodNutritionRow: { flexDirection: 'row', gap: 12 },
  foodNutText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  warningsCard: {
    backgroundColor: COLORS.warning + '10', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.warning + '30',
  },
  warningsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  warningsTitle: { fontSize: 14, fontWeight: '800', color: COLORS.warning },
  warningItem: { fontSize: 13, color: COLORS.warning, marginBottom: 4, lineHeight: 19 },
  recoCard: {
    backgroundColor: COLORS.success + '10', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.success + '30',
  },
  recoTitle: { fontSize: 14, fontWeight: '800', color: COLORS.success, marginBottom: 10 },
  recoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  recoText: { fontSize: 13, color: COLORS.textSecondary, flex: 1, lineHeight: 19 },
  saveButton: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  saveButtonGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  saveButtonText: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  savedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.success + '15', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.success + '30',
  },
  savedText: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  orderCta: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  orderCtaGrad: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  orderCtaTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  orderCtaSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  orderCtaEmoji: { fontSize: 32 },
});
