import { HealthCondition } from '../types';
import { COLORS } from '../constants/colors';

export interface ConditionInfo {
  id: HealthCondition;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  description: string;
  keyFacts: string[];
  dietaryGuidelines: string[];
  foodsToEat: string[];
  foodsToAvoid: string[];
  dailyTargets: {
    calories: [number, number];
    sodium: number; // max mg
    fiber: number; // min g
    sugar: number; // max g
  };
  warningSign: string;
}

export const CONDITIONS: ConditionInfo[] = [
  {
    id: 'diabetes',
    label: 'Diabetes Management',
    shortLabel: 'Diabetes',
    icon: '🩸',
    color: COLORS.diabetes,
    description: 'Managing Type 2 diabetes through low glycemic index Nigerian foods and portion control',
    keyFacts: [
      'Over 11 million Nigerians have diabetes',
      'Diet controls 70% of blood sugar management',
      'Traditional Nigerian foods like unripe plantain have very low GI',
    ],
    dietaryGuidelines: [
      'Choose low GI foods (below 55) at every meal',
      'Never skip meals — eat every 4-5 hours',
      'Fill half your plate with non-starchy vegetables',
      'Limit white garri, white bread, sugary drinks',
      'Drink unsweetened zobo daily — it lowers blood sugar',
    ],
    foodsToEat: ['Unripe plantain', 'Beans/Ewa', 'Okra', 'Bitter leaf', 'Brown rice (Ofada)', 'Garden egg', 'Ugwu'],
    foodsToAvoid: ['White garri', 'Agege bread', 'Sugary drinks', 'Sweet ripe plantain', 'Excess rice'],
    dailyTargets: { calories: [1600, 2000], sodium: 2300, fiber: 25, sugar: 25 },
    warningSign: 'Consult your doctor before changing diet if on insulin or metformin',
  },
  {
    id: 'highBP',
    label: 'High Blood Pressure',
    shortLabel: 'High BP',
    icon: '❤️',
    color: COLORS.highBP,
    description: 'DASH diet adapted to Nigerian cuisine for natural blood pressure reduction',
    keyFacts: [
      'Hypertension affects 38% of Nigerian adults',
      'Reducing sodium by 1g/day can lower BP by 3-5 mmHg',
      'Zobo drink clinically reduces systolic BP by 7-13 mmHg',
    ],
    dietaryGuidelines: [
      'Limit salt to 1 teaspoon daily maximum',
      'Eat potassium-rich foods: banana, pawpaw, ugu, sweet potato',
      'Drink unsweetened zobo — 1-2 cups daily',
      'Reduce palm oil, use olive or groundnut oil',
      'Avoid Maggi cubes/Knorr — use natural seasonings',
      'Eat oily fish (titus) at least twice weekly',
    ],
    foodsToEat: ['Mackerel (Titus)', 'Zobo drink', 'Ugu leaves', 'Water leaf', 'Garden egg', 'Unripe plantain', 'Beans'],
    foodsToAvoid: ['Excess salt', 'Stock cubes', 'Processed meat', 'Excess palm oil', 'Alcohol'],
    dailyTargets: { calories: [1800, 2200], sodium: 1500, fiber: 30, sugar: 30 },
    warningSign: 'If BP is above 160/100, medication + diet together — not diet alone',
  },
  {
    id: 'obesity',
    label: 'Obesity Management',
    shortLabel: 'Obesity',
    icon: '⚖️',
    color: COLORS.obesity,
    description: 'Safe, sustainable calorie restriction using satisfying Nigerian whole foods',
    keyFacts: [
      'Obesity doubles the risk of hypertension and diabetes',
      'Losing just 5-10% body weight reduces health risks significantly',
      'Nigerian high-fiber foods create satiety with fewer calories',
    ],
    dietaryGuidelines: [
      'Create 300-500 calorie daily deficit only',
      'Never go below 1,200 calories — slows metabolism',
      'Eat slowly, chew well — satiety signals take 20 minutes',
      'Replace eba/garri with oat swallow or unripe plantain fufu',
      'Eat soup first — it fills up before the solid swallow',
      'Walk 30 minutes daily — diet + movement is essential',
    ],
    foodsToEat: ['Oat swallow', 'Pepper soup', 'Garden egg', 'All leafy greens', 'Beans', 'Grilled fish'],
    foodsToAvoid: ['Eba (large portions)', 'Fried foods', 'Palm oil excess', 'Sugary drinks', 'Late-night eating'],
    dailyTargets: { calories: [1200, 1500], sodium: 2000, fiber: 35, sugar: 20 },
    warningSign: 'Rapid weight loss (>1kg/week) is dangerous — aim for slow and steady',
  },
  {
    id: 'weightLoss',
    label: 'Weight Loss',
    shortLabel: 'Weight Loss',
    icon: '📉',
    color: COLORS.weightLoss,
    description: 'Healthy calorie deficit with muscle-preserving high-protein Nigerian meals',
    keyFacts: [
      'Safe weight loss is 0.5-1 kg per week',
      'Protein preserves muscle while losing fat',
      'Nigerian pepper soup is one of the best weight loss meals',
    ],
    dietaryGuidelines: [
      'Aim for 300-500 calorie deficit daily',
      'Get 1.2-1.6g protein per kg body weight',
      'Drink 2-3 liters water daily',
      'Eat 3 meals — no skipping (causes binge eating)',
      'Use smaller plates for portion control',
      'Cook with minimal oil — steam, grill, or boil',
    ],
    foodsToEat: ['Pepper soup', 'Moi moi', 'Grilled fish', 'Oat swallow', 'All vegetables', 'Boiled egg'],
    foodsToAvoid: ['Fried foods', 'Sugary drinks', 'Large eba portions', 'Excess oil in cooking'],
    dailyTargets: { calories: [1400, 1700], sodium: 2300, fiber: 25, sugar: 25 },
    warningSign: 'Combine with 150 mins moderate exercise weekly for best results',
  },
  {
    id: 'weightGain',
    label: 'Weight Gain',
    shortLabel: 'Weight Gain',
    icon: '📈',
    color: COLORS.weightGain,
    description: 'Healthy calorie surplus with traditional Nigerian high-calorie whole foods',
    keyFacts: [
      'Safe weight gain is 0.25-0.5 kg per week',
      'Protein is essential — minimum 1.6g per kg body weight',
      'Strength training converts extra calories to muscle, not fat',
    ],
    dietaryGuidelines: [
      'Eat 300-500 calories above your daily needs',
      'Eat every 3-4 hours — 3 meals + 2 snacks',
      'High-calorie Nigerian foods: egusi, palm oil, tiger nut',
      'Increase portion sizes gradually',
      'Combine with resistance training for muscle gain',
      'Drink kunu aya (tiger nut milk) between meals',
    ],
    foodsToEat: ['Egusi soup', 'Wheat swallow', 'Tiger nut milk', 'Oily fish', 'Chicken', 'Eggs', 'Palm oil moderately'],
    foodsToAvoid: ['Low-calorie foods as main meals', 'Excessive cardio exercise', 'Skipping meals'],
    dailyTargets: { calories: [2500, 3500], sodium: 2500, fiber: 25, sugar: 50 },
    warningSign: 'Gain weight gradually to avoid fat accumulation — prioritize muscle',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle Modification',
    shortLabel: 'Lifestyle',
    icon: '🌿',
    color: COLORS.lifestyle,
    description: 'Holistic wellness through balanced nutrition, hydration, and mindful eating',
    keyFacts: [
      'What you eat affects energy, mood, sleep, and productivity',
      'Nigerian whole foods contain powerful phytonutrients',
      'Consistency matters more than perfection',
    ],
    dietaryGuidelines: [
      'Eat 5 colors of fruits and vegetables daily',
      'Prioritize whole, unprocessed Nigerian foods',
      'Intermittent fasting 12:12 is safe and effective',
      'Drink water first thing every morning',
      'Reduce processed and packaged foods',
      'Meal prep on Sundays for the week',
    ],
    foodsToEat: ['All vegetables', 'Whole grains', 'Legumes', 'Oily fish', 'Fresh fruits', 'Herbs and spices'],
    foodsToAvoid: ['Processed snacks', 'Sugary drinks', 'Excessive fried foods', 'Late-night heavy meals'],
    dailyTargets: { calories: [1800, 2400], sodium: 2000, fiber: 30, sugar: 36 },
    warningSign: 'Small consistent changes beat dramatic short-term diets',
  },
  {
    id: 'healthy',
    label: 'Healthy Feeding',
    shortLabel: 'Healthy',
    icon: '🥗',
    color: COLORS.healthy,
    description: 'Optimal nutrition using the best of Nigerian cuisine for lifelong health',
    keyFacts: [
      'Nigerian traditional diet is one of the healthiest in Africa',
      'Modern lifestyle changes are causing nutrition decline',
      'Returning to traditional foods reduces chronic disease risk',
    ],
    dietaryGuidelines: [
      'Eat local, seasonal Nigerian produce',
      'Cook from scratch most of the time',
      'Include a variety of protein sources weekly',
      'Eat leafy greens daily — ugwu, bitter leaf, waterleaf',
      'Balance your plate: ½ vegetables, ¼ protein, ¼ carbs',
      'Limit processed foods to maximum 20% of diet',
    ],
    foodsToEat: ['All whole Nigerian foods', 'Fresh vegetables', 'Legumes', 'Fish', 'Unprocessed grains'],
    foodsToAvoid: ['Ultra-processed foods', 'Artificial drinks', 'Excess refined sugar'],
    dailyTargets: { calories: [1800, 2200], sodium: 2300, fiber: 25, sugar: 36 },
    warningSign: 'Your food is your medicine — invest in quality ingredients',
  },
];

export const getConditionById = (id: string): ConditionInfo | undefined => {
  return CONDITIONS.find(c => c.id === id);
};
