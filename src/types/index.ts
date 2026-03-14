export type HealthCondition =
  | 'diabetes'
  | 'highBP'
  | 'obesity'
  | 'weightLoss'
  | 'weightGain'
  | 'lifestyle'
  | 'healthy';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // kg
  height: number; // cm
  conditions: HealthCondition[];
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  targetWeight?: number;
  allergies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
  sodium: number; // mg
  sugar: number; // g
  glycemicIndex?: number;
}

export interface Food {
  id: string;
  name: string;
  localName?: string; // Nigerian/Yoruba/Igbo/Hausa name
  category: FoodCategory;
  nutrition: NutritionInfo; // per 100g
  safeFor: HealthCondition[];
  avoidFor: HealthCondition[];
  description: string;
  benefits: string[];
  image?: string;
  isNigerian: boolean;
}

export type FoodCategory =
  | 'grains'
  | 'protein'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'oils'
  | 'soups'
  | 'swallows'
  | 'snacks'
  | 'beverages'
  | 'spices';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image?: string;
  prepTime: number; // mins
  cookTime: number; // mins
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  conditions: HealthCondition[]; // good for these conditions
  ingredients: RecipeIngredient[];
  steps: string[];
  nutrition: NutritionInfo; // per serving
  tags: string[];
  isNigerian: boolean;
  tip?: string;
}

export interface RecipeIngredient {
  foodId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface MealPlan {
  id: string;
  name: string;
  condition: HealthCondition;
  description: string;
  duration: number; // days
  days: MealPlanDay[];
  targetCalories: number;
  benefits: string[];
}

export interface MealPlanDay {
  day: number;
  breakfast: string; // Recipe ID
  morningSnack?: string;
  lunch: string;
  afternoonSnack?: string;
  dinner: string;
  totalCalories: number;
}

export interface DailyLog {
  id: string;
  date: string; // ISO
  userId: string;
  meals: LoggedMeal[];
  water: number; // ml
  weight?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  bloodSugar?: number; // mg/dL
  mood: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface LoggedMeal {
  recipeId?: string;
  foodId?: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  unit: string;
  calories: number;
  time: string;
  photoUri?: string; // local file URI of the meal photo
}

export interface WeeklyProgress {
  weekStart: string;
  avgCalories: number;
  avgWater: number;
  weightChange: number;
  logsCount: number;
  topFoods: string[];
}

export interface CustomFood {
  id: string;
  name: string;
  localName?: string;
  category: FoodCategory;
  nutrition: NutritionInfo;
  safeFor: HealthCondition[];
  avoidFor: HealthCondition[];
  description: string;
  benefits: string[];
  isNigerian: boolean;
  isCustom: true;
  createdAt: string;
}

export interface AIQuota {
  date: string; // ISO date YYYY-MM-DD
  callsUsed: number;
  maxCalls: number;
}
