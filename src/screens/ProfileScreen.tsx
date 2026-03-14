import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { getConditionById, CONDITIONS } from '../data/conditions';

const LOGO_DARK = require('../../assets/logo-dark.jpg');

export default function ProfileScreen({ navigation }: any) {
  const { profile, getBMI, getBMICategory, getCalorieTarget, isPinSet, setPin, removePin, exportAllData } = useUser();
  const [exporting, setExporting] = useState(false);

  if (!profile) return null;

  const bmi = getBMI();
  const bmiCategory = getBMICategory();
  const calorieTarget = getCalorieTarget();

  const handleReset = () => {
    Alert.alert(
      'Reset Profile',
      'This will delete all your data and restart the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      await Share.share({
        title: 'KutunzaCare Health Data',
        message: data,
      });
    } catch {
      Alert.alert('Export Failed', 'Could not export your data.');
    } finally {
      setExporting(false);
    }
  };

  const handlePinToggle = () => {
    if (isPinSet) {
      Alert.alert('Remove PIN', 'Your app will no longer require a PIN to open.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removePin() },
      ]);
    } else {
      navigation.navigate('PinLock', { mode: 'setup' });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#1a0a0e', '#0D0D0D']} style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={LOGO_DARK} style={styles.logoImg} resizeMode="contain" />
        </View>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileMeta}>
          {profile.age} years · {profile.gender} · {profile.activityLevel.replace('_', ' ')}
        </Text>
        <View style={styles.brandTag}>
          <Text style={styles.brandTagText}>✨ KutunzaCare Member</Text>
        </View>
      </LinearGradient>

      {/* Body Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{profile.weight}kg</Text>
          <Text style={styles.statLabel}>Weight</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{profile.height}cm</Text>
          <Text style={styles.statLabel}>Height</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: bmiCategory === 'Healthy Weight' ? COLORS.success : COLORS.warning }]}>
            {bmi}
          </Text>
          <Text style={styles.statLabel}>BMI</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{calorieTarget}</Text>
          <Text style={styles.statLabel}>Daily kcal</Text>
        </View>
      </View>

      {/* Conditions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Goals</Text>
        {profile.conditions.map(condId => {
          const cond = getConditionById(condId);
          if (!cond) return null;
          return (
            <TouchableOpacity
              key={condId}
              style={styles.condCard}
              onPress={() => navigation.navigate('ConditionDetail', { conditionId: condId })}
            >
              <View style={[styles.condIcon, { backgroundColor: cond.color + '20' }]}>
                <Text style={styles.condIconText}>{cond.icon}</Text>
              </View>
              <View style={styles.condInfo}>
                <Text style={styles.condName}>{cond.label}</Text>
                <Text style={styles.condDesc} numberOfLines={1}>{cond.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.editCondBtn}
          onPress={() => navigation.navigate('HealthProfile')}
        >
          <Ionicons name="pencil" size={16} color={COLORS.gold} />
          <Text style={styles.editCondText}>Edit Health Profile</Text>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About KutunzaCare</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            KutunzaCare is Kutunza Gourmet's health nutrition arm, dedicated to helping Nigerians 
            manage chronic conditions and optimize health through traditional Nigerian foods.
          </Text>
          <Text style={styles.aboutWebsite}>🌐 www.kutunzafoods.com</Text>
          <Text style={styles.aboutPhone}>📞 08138081620</Text>
        </View>
      </View>

      {/* Security & Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security & Data</Text>

        <TouchableOpacity style={styles.settingRow} onPress={handlePinToggle}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.gold + '20' }]}>
              <Ionicons name={isPinSet ? 'lock-closed' : 'lock-open'} size={18} color={COLORS.gold} />
            </View>
            <View>
              <Text style={styles.settingName}>PIN Lock</Text>
              <Text style={styles.settingDesc}>{isPinSet ? 'Enabled — tap to remove' : 'Protect app with 4-digit PIN'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} onPress={handleExport} disabled={exporting}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="download-outline" size={18} color={COLORS.success} />
            </View>
            <View>
              <Text style={styles.settingName}>Export Health Data</Text>
              <Text style={styles.settingDesc}>{exporting ? 'Preparing...' : 'Share all data as JSON'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Danger zone */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={styles.resetText}>Reset App Data</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: { paddingTop: 56, paddingBottom: 28, alignItems: 'center' },
  logoContainer: { marginBottom: 14, alignItems: 'center' },
  logoImg: { width: 180, height: 100 },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.gold }, // kept for compat
  profileName: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  profileMeta: { fontSize: 13, color: COLORS.textSecondary, textTransform: 'capitalize', marginBottom: 10 },
  brandTag: {
    backgroundColor: COLORS.gold + '20', paddingVertical: 4, paddingHorizontal: 14,
    borderRadius: 50, borderWidth: 1, borderColor: COLORS.goldDark,
  },
  brandTagText: { fontSize: 12, color: COLORS.gold, fontWeight: '700' },

  statsRow: { flexDirection: 'row', margin: 16, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: COLORS.darkCard, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statVal: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },

  condCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
  },
  condIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  condIconText: { fontSize: 20 },
  condInfo: { flex: 1 },
  condName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  condDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  editCondBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.goldDark, marginTop: 4,
  },
  editCondText: { fontSize: 14, color: COLORS.gold, fontWeight: '700' },

  aboutCard: {
    backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  aboutText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 21, marginBottom: 12 },
  aboutWebsite: { fontSize: 13, color: COLORS.gold, fontWeight: '600', marginBottom: 4 },
  aboutPhone: { fontSize: 13, color: COLORS.gold, fontWeight: '600' },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  settingName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  settingDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.error + '40',
  },
  resetText: { fontSize: 14, color: COLORS.error, fontWeight: '700' },
});
