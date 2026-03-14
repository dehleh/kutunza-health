export const COLORS = {
  // Brand — exact values extracted from logo files
  burgundy: '#722F37',
  burgundyLight: '#9B4A54',
  burgundyDark: '#4A1E23',
  gold: '#A88833',        // exact logo gold (sampled from KK monogram)
  goldLight: '#C8A84B',
  goldDark: '#7A6220',

  // Dark theme backgrounds
  dark: '#0D0D0D',
  darkCard: '#161616',
  darkElevated: '#1E1E1E',
  darkBorder: '#2A2A2A',

  // Text
  textPrimary: '#F5F0E8',
  textSecondary: '#B8AFA0',
  textMuted: '#6B6259',

  // Semantic
  success: '#4CAF6A',
  warning: '#F5A623',
  error: '#E53935',
  info: '#2196F3',

  // Condition colors
  diabetes: '#FF6B6B',
  highBP: '#FF4757',
  obesity: '#FFA502',
  weightLoss: '#2ED573',
  weightGain: '#1E90FF',
  lifestyle: '#A29BFE',
  healthy: '#00B894',

  // Aliases
  border: '#2A2A2A',
  white: '#FFFFFF',
  black: '#000000',
};

export const GRADIENTS = {
  gold: [COLORS.goldDark, COLORS.gold, COLORS.goldLight],
  burgundy: [COLORS.burgundyDark, COLORS.burgundy],
  dark: ['#1a1a1a', '#0D0D0D'],
  card: ['#1E1E1E', '#161616'],
};
