import { MealPlan } from '../types';

export const MEAL_PLANS: MealPlan[] = [
  {
    id: 'mp001',
    name: 'Diabetes Control Plan',
    condition: 'diabetes',
    description: 'Low glycemic index Nigerian meals to stabilize blood sugar throughout the day',
    duration: 7,
    targetCalories: 1800,
    benefits: [
      'Stabilizes blood sugar levels',
      'Prevents energy crashes',
      'Uses traditional Nigerian superfoods',
      'High fiber for glucose control',
    ],
    days: [
      {
        day: 1,
        breakfast: 'r006', // Agbalumo & Tiger Nut Bowl
        morningSnack: undefined,
        lunch: 'r001', // Unripe Plantain Porridge
        afternoonSnack: undefined,
        dinner: 'r009', // High-Protein Moi Moi
        totalCalories: 815,
      },
      {
        day: 2,
        breakfast: 'r006',
        lunch: 'r002', // Beans & Brown Rice
        afternoonSnack: undefined,
        dinner: 'r004', // Grilled Titus & Efo Riro
        totalCalories: 900,
      },
      {
        day: 3,
        breakfast: 'r006',
        lunch: 'r005', // Oat Swallow & Okra
        dinner: 'r009',
        totalCalories: 805,
      },
      {
        day: 4,
        breakfast: 'r006',
        lunch: 'r001',
        dinner: 'r003', // Garden Egg Salad
        totalCalories: 685,
      },
      {
        day: 5,
        breakfast: 'r006',
        lunch: 'r002',
        dinner: 'r010', // Pepper Soup
        totalCalories: 770,
      },
      {
        day: 6,
        breakfast: 'r006',
        lunch: 'r004',
        dinner: 'r005',
        totalCalories: 815,
      },
      {
        day: 7,
        breakfast: 'r006',
        lunch: 'r009',
        dinner: 'r008', // Bitter Leaf Soup
        totalCalories: 795,
      },
    ],
  },
  {
    id: 'mp002',
    name: 'Blood Pressure Control Plan',
    condition: 'highBP',
    description: 'Low-sodium, DASH-adapted Nigerian meal plan for blood pressure management',
    duration: 7,
    targetCalories: 2000,
    benefits: [
      'Clinically reduces systolic BP by 8-14 mmHg',
      'Rich in potassium and magnesium',
      'Anti-inflammatory Nigerian spices',
      'Zobo drink included daily',
    ],
    days: [
      { day: 1, breakfast: 'r006', lunch: 'r004', dinner: 'r003', totalCalories: 695 },
      { day: 2, breakfast: 'r006', lunch: 'r010', dinner: 'r009', totalCalories: 695 },
      { day: 3, breakfast: 'r006', lunch: 'r005', dinner: 'r004', totalCalories: 795 },
      { day: 4, breakfast: 'r006', lunch: 'r003', dinner: 'r008', totalCalories: 665 },
      { day: 5, breakfast: 'r006', lunch: 'r002', dinner: 'r010', totalCalories: 770 },
      { day: 6, breakfast: 'r006', lunch: 'r009', dinner: 'r004', totalCalories: 815 },
      { day: 7, breakfast: 'r006', lunch: 'r001', dinner: 'r003', totalCalories: 685 },
    ],
  },
  {
    id: 'mp003',
    name: 'Weight Loss Plan',
    condition: 'weightLoss',
    description: 'Calorie-controlled Nigerian meals averaging 1,400 kcal/day for sustainable fat loss',
    duration: 7,
    targetCalories: 1400,
    benefits: [
      'High satiety from Nigerian fiber-rich foods',
      'Preserves muscle while losing fat',
      'No hunger — volumetric eating',
      'Traditional foods you enjoy',
    ],
    days: [
      { day: 1, breakfast: 'r006', lunch: 'r005', dinner: 'r010', totalCalories: 685 },
      { day: 2, breakfast: 'r006', lunch: 'r003', dinner: 'r009', totalCalories: 645 },
      { day: 3, breakfast: 'r006', lunch: 'r001', dinner: 'r010', totalCalories: 735 },
      { day: 4, breakfast: 'r006', lunch: 'r008', dinner: 'r003', totalCalories: 665 },
      { day: 5, breakfast: 'r006', lunch: 'r005', dinner: 'r004', totalCalories: 795 },
      { day: 6, breakfast: 'r006', lunch: 'r002', dinner: 'r010', totalCalories: 770 },
      { day: 7, breakfast: 'r006', lunch: 'r009', dinner: 'r003', totalCalories: 645 },
    ],
  },
  {
    id: 'mp004',
    name: 'Weight Gain Plan',
    condition: 'weightGain',
    description: 'High-calorie, high-protein Nigerian meals for healthy weight and muscle gain',
    duration: 7,
    targetCalories: 3000,
    benefits: [
      'Calorie surplus from quality whole foods',
      'High protein for muscle development',
      'Traditional calorie-dense Nigerian meals',
      'Timed eating for optimal muscle building',
    ],
    days: [
      { day: 1, breakfast: 'r006', lunch: 'r007', dinner: 'r004', totalCalories: 1210 },
      { day: 2, breakfast: 'r006', lunch: 'r007', dinner: 'r009', totalCalories: 1150 },
      { day: 3, breakfast: 'r006', lunch: 'r007', dinner: 'r008', totalCalories: 1170 },
      { day: 4, breakfast: 'r006', lunch: 'r007', dinner: 'r004', totalCalories: 1210 },
      { day: 5, breakfast: 'r006', lunch: 'r007', dinner: 'r009', totalCalories: 1150 },
      { day: 6, breakfast: 'r006', lunch: 'r007', dinner: 'r008', totalCalories: 1170 },
      { day: 7, breakfast: 'r006', lunch: 'r007', dinner: 'r004', totalCalories: 1210 },
    ],
  },
  {
    id: 'mp005',
    name: 'Lifestyle Reset Plan',
    condition: 'lifestyle',
    description: 'Balanced clean-eating Nigerian plan for total wellness and energy optimization',
    duration: 7,
    targetCalories: 2200,
    benefits: [
      'Balanced macro ratios',
      'Improved energy levels',
      'Better sleep quality',
      'Mental clarity and focus',
    ],
    days: [
      { day: 1, breakfast: 'r006', lunch: 'r004', dinner: 'r008', totalCalories: 845 },
      { day: 2, breakfast: 'r006', lunch: 'r002', dinner: 'r010', totalCalories: 770 },
      { day: 3, breakfast: 'r006', lunch: 'r009', dinner: 'r004', totalCalories: 815 },
      { day: 4, breakfast: 'r006', lunch: 'r001', dinner: 'r008', totalCalories: 835 },
      { day: 5, breakfast: 'r006', lunch: 'r004', dinner: 'r003', totalCalories: 695 },
      { day: 6, breakfast: 'r006', lunch: 'r007', dinner: 'r010', totalCalories: 1050 },
      { day: 7, breakfast: 'r006', lunch: 'r002', dinner: 'r009', totalCalories: 850 },
    ],
  },
  {
    id: 'mp006',
    name: 'Obesity Management Plan',
    condition: 'obesity',
    description: 'Medically-guided low-calorie Nigerian plan for safe, sustainable weight loss',
    duration: 7,
    targetCalories: 1200,
    benefits: [
      'Clinically safe 1,200 kcal minimum',
      'Preserves metabolic rate',
      'High volume, low calorie foods',
      'Anti-inflammatory focus',
    ],
    days: [
      { day: 1, breakfast: 'r006', lunch: 'r003', dinner: 'r010', totalCalories: 575 },
      { day: 2, breakfast: 'r006', lunch: 'r005', dinner: 'r003', totalCalories: 635 },
      { day: 3, breakfast: 'r006', lunch: 'r008', dinner: 'r010', totalCalories: 635 },
      { day: 4, breakfast: 'r006', lunch: 'r001', dinner: 'r003', totalCalories: 685 },
      { day: 5, breakfast: 'r006', lunch: 'r009', dinner: 'r010', totalCalories: 695 },
      { day: 6, breakfast: 'r006', lunch: 'r005', dinner: 'r003', totalCalories: 635 },
      { day: 7, breakfast: 'r006', lunch: 'r008', dinner: 'r010', totalCalories: 635 },
    ],
  },
  {
    id: 'mp007',
    name: 'Healthy Living Plan',
    condition: 'healthy',
    description: 'Optimal nutrition with the best of Nigerian cuisine for long-term health',
    duration: 7,
    targetCalories: 2000,
    benefits: [
      'Disease prevention focus',
      'Longevity-supporting nutrients',
      'Cultural food preservation',
      'Balanced and enjoyable',
    ],
    days: [
      { day: 1, breakfast: 'r006', lunch: 'r004', dinner: 'r002', totalCalories: 905 },
      { day: 2, breakfast: 'r006', lunch: 'r009', dinner: 'r008', totalCalories: 795 },
      { day: 3, breakfast: 'r006', lunch: 'r001', dinner: 'r004', totalCalories: 870 },
      { day: 4, breakfast: 'r006', lunch: 'r002', dinner: 'r010', totalCalories: 770 },
      { day: 5, breakfast: 'r006', lunch: 'r007', dinner: 'r003', totalCalories: 1030 },
      { day: 6, breakfast: 'r006', lunch: 'r004', dinner: 'r009', totalCalories: 865 },
      { day: 7, breakfast: 'r006', lunch: 'r008', dinner: 'r001', totalCalories: 835 },
    ],
  },
];

export const getMealPlanForCondition = (condition: string): MealPlan | undefined => {
  return MEAL_PLANS.find(mp => mp.condition === condition);
};
