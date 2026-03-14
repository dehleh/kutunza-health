import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  FlatList, Animated, StatusBar, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

const LOGO_DARK = require('../../assets/logo-dark.jpg');

const SLIDES = [
  {
    id: '1',
    useLogo: true,
    title: 'Nurturing Kings\nBack to Health',
    subtitle: 'Premium Nigerian health nutrition — tailored to your body, your conditions, your culture',
    accent: COLORS.gold,
    pill: 'KUTUNZACARE',
  },
  {
    id: '2',
    useLogo: false,
    emoji: '🍲',
    title: 'Nigerian Food\nIs Medicine',
    subtitle: 'Ugwu, bitter leaf, zobo, unripe plantain — discover the healing power of your traditional foods',
    accent: COLORS.healthy,
    pill: 'FOOD AS THERAPY',
  },
  {
    id: '3',
    useLogo: false,
    emoji: '🩸',
    title: 'Manage Diabetes,\nHigh BP & More',
    subtitle: 'Personalised meal plans for your specific health condition using foods you already love',
    accent: COLORS.diabetes,
    pill: 'YOUR CONDITION · YOUR PLAN',
  },
  {
    id: '4',
    useLogo: false,
    emoji: '👨‍🍳',
    title: 'Chef-Cooked\nHealthy Meals',
    subtitle: 'Order fresh health meals delivered to your door across Lagos — from ₦4,000 per meal',
    accent: COLORS.gold,
    pill: 'DELIVERED FRESH · LAGOS',
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('HealthProfile');
    }
  };

  const handleSkip = () => navigation.navigate('HealthProfile');

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <Animated.View
      style={[styles.slide, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {item.useLogo ? (
        <View style={styles.logoWrapper}>
          <View style={styles.logoGlow} />
          <Image source={LOGO_DARK} style={styles.logoImage} resizeMode="contain" />
        </View>
      ) : (
        <View style={[styles.emojiOrb, { shadowColor: item.accent, borderColor: item.accent + '50' }]}>
          <LinearGradient colors={['#1e1e1e', '#141414']} style={[StyleSheet.absoluteFill, { borderRadius: 70 }]} />
          <Text style={styles.emoji}>{(item as any).emoji}</Text>
        </View>
      )}

      <View style={[styles.pill, { borderColor: item.accent + '55' }]}>
        <View style={[styles.pillDot, { backgroundColor: item.accent }]} />
        <Text style={[styles.pillText, { color: item.accent }]}>{item.pill}</Text>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={['#0D0D0D', '#120a07', '#0D0D0D']} style={StyleSheet.absoluteFill} />

      {/* Gold top accent — mirrors the brand */}
      <View style={styles.topLine} />
      <View style={styles.topLineFaint} />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={renderSlide}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex
                ? { backgroundColor: SLIDES[currentIndex].accent, width: 28 }
                : { backgroundColor: COLORS.textMuted, width: 6 },
            ]}
          />
        ))}
      </View>

      {/* CTA row */}
      <View style={styles.cta}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}
          accessibilityLabel="Skip" accessibilityRole="button">
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}
          accessibilityLabel={currentIndex === SLIDES.length - 1 ? 'Get started' : 'Next'}
          accessibilityRole="button">
          <LinearGradient
            colors={[COLORS.goldDark, COLORS.gold, COLORS.goldLight]}
            style={styles.nextBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextText}>
              {currentIndex === SLIDES.length - 1 ? 'Get Started 👑' : 'Next →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.trademark}>KUTUNZA GOURMET · LAGOS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark, alignItems: 'center' },

  topLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 2, backgroundColor: COLORS.gold, opacity: 0.65, zIndex: 10,
  },
  topLineFaint: {
    position: 'absolute', top: 4, left: 48, right: 48,
    height: 1, backgroundColor: COLORS.gold, opacity: 0.15, zIndex: 10,
  },

  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 48,
    paddingBottom: 16,
  },

  // ── Real logo (slide 1) ──────────────────────────────────────────────────────
  logoWrapper: {
    width: 240,
    height: 170,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 260,
    height: 180,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    opacity: 0.05,
  },
  logoImage: {
    width: 240,
    height: 160,
    borderRadius: 8,
  },

  // ── Emoji orb (slides 2-4) ───────────────────────────────────────────────────
  emojiOrb: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 30, elevation: 12,
  },
  emoji: { fontSize: 60 },

  // ── Pill label ───────────────────────────────────────────────────────────────
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: 50,
    paddingVertical: 6, paddingHorizontal: 14, marginBottom: 20,
  },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5 },

  // ── Copy ─────────────────────────────────────────────────────────────────────
  title: {
    fontSize: 33, fontWeight: '800', color: COLORS.textPrimary,
    textAlign: 'center', lineHeight: 42, marginBottom: 18, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 26, maxWidth: 310,
  },

  // ── Navigation ───────────────────────────────────────────────────────────────
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  dot: { height: 5, borderRadius: 2.5 },

  cta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 32, paddingBottom: 40,
  },
  skipBtn: { paddingVertical: 16, paddingHorizontal: 20 },
  skipText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  nextBtn: {
    paddingVertical: 16, paddingHorizontal: 44, borderRadius: 50,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  nextText: { color: COLORS.dark, fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },

  trademark: {
    fontSize: 9, color: COLORS.textMuted, letterSpacing: 2,
    fontWeight: '600', marginBottom: 16, opacity: 0.45,
  },
});
