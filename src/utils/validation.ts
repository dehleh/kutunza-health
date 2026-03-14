/**
 * Validation utilities for KutunzaCare
 */

// ─── HEALTH PROFILE VALIDATION ────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAge(raw: string): ValidationResult {
  const age = parseInt(raw, 10);
  if (!raw || isNaN(age)) return { valid: false, error: 'Please enter your age.' };
  if (age < 10 || age > 110) return { valid: false, error: 'Please enter a valid age (10–110).' };
  return { valid: true };
}

export function validateWeight(raw: string): ValidationResult {
  const w = parseFloat(raw);
  if (!raw || isNaN(w)) return { valid: false, error: 'Please enter your weight.' };
  if (w < 20 || w > 300) return { valid: false, error: 'Please enter a valid weight (20–300 kg).' };
  return { valid: true };
}

export function validateHeight(raw: string): ValidationResult {
  const h = parseFloat(raw);
  if (!raw || isNaN(h)) return { valid: false, error: 'Please enter your height.' };
  if (h < 50 || h > 250) return { valid: false, error: 'Please enter a valid height (50–250 cm).' };
  return { valid: true };
}

export function validateTargetWeight(raw: string, currentWeight: string): ValidationResult {
  if (!raw) return { valid: true }; // optional
  const tw = parseFloat(raw);
  if (isNaN(tw)) return { valid: false, error: 'Target weight must be a number.' };
  if (tw < 20 || tw > 300) return { valid: false, error: 'Target weight must be between 20–300 kg.' };
  return { valid: true };
}

// ─── AI RESPONSE VALIDATION ───────────────────────────────────────────────────

export interface FoodItem {
  name: string;
  localName?: string;
  estimatedGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  glycemicIndex?: number;
  rating: 'excellent' | 'good' | 'moderate' | 'avoid';
  ratingReason: string;
}

export interface FoodAnalysis {
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  overallRating: 'excellent' | 'good' | 'moderate' | 'avoid';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  summary: string;
  recommendations: string[];
  warningFoods: string[];
  healthScore: number;
}

const VALID_RATINGS = ['excellent', 'good', 'moderate', 'avoid'] as const;
const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export function isFoodAnalysis(obj: unknown): obj is FoodAnalysis {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;

  // Required top-level fields
  if (!Array.isArray(o.foods)) return false;
  if (typeof o.totalCalories !== 'number') return false;
  if (typeof o.totalProtein !== 'number') return false;
  if (typeof o.totalCarbs !== 'number') return false;
  if (typeof o.totalFat !== 'number') return false;
  if (!VALID_RATINGS.includes(o.overallRating as any)) return false;
  if (!VALID_MEAL_TYPES.includes(o.mealType as any)) return false;
  if (typeof o.summary !== 'string') return false;
  if (!Array.isArray(o.recommendations)) return false;
  if (!Array.isArray(o.warningFoods)) return false;
  if (typeof o.healthScore !== 'number' || o.healthScore < 0 || o.healthScore > 10) return false;

  // Validate each food item
  for (const food of o.foods as unknown[]) {
    if (!food || typeof food !== 'object') return false;
    const f = food as Record<string, unknown>;
    if (typeof f.name !== 'string' || !f.name) return false;
    if (typeof f.estimatedGrams !== 'number') return false;
    if (typeof f.calories !== 'number') return false;
    if (typeof f.protein !== 'number') return false;
    if (typeof f.carbs !== 'number') return false;
    if (typeof f.fat !== 'number') return false;
    if (!VALID_RATINGS.includes(f.rating as any)) return false;
    if (typeof f.ratingReason !== 'string') return false;
  }

  return true;
}

/**
 * Sanitise a FoodAnalysis to safe defaults (numbers clamped, strings trimmed).
 */
export function sanitiseFoodAnalysis(analysis: FoodAnalysis): FoodAnalysis {
  return {
    ...analysis,
    totalCalories: clamp(analysis.totalCalories, 0, 5000),
    totalProtein: clamp(analysis.totalProtein, 0, 500),
    totalCarbs: clamp(analysis.totalCarbs, 0, 1000),
    totalFat: clamp(analysis.totalFat, 0, 500),
    healthScore: clamp(analysis.healthScore, 0, 10),
    summary: (analysis.summary ?? '').slice(0, 500),
    recommendations: (analysis.recommendations ?? []).slice(0, 5).map(r => String(r).slice(0, 200)),
    warningFoods: (analysis.warningFoods ?? []).slice(0, 5).map(w => String(w).slice(0, 100)),
    foods: (analysis.foods ?? []).map(f => ({
      ...f,
      name: String(f.name).slice(0, 100),
      estimatedGrams: clamp(f.estimatedGrams, 0, 2000),
      calories: clamp(f.calories, 0, 3000),
      protein: clamp(f.protein, 0, 300),
      carbs: clamp(f.carbs, 0, 600),
      fat: clamp(f.fat, 0, 300),
    })),
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val || 0));
}
