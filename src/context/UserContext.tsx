import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DailyLog, CustomFood, AIQuota, Food } from '../types';

export interface Order {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number; emoji: string }[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  phone: string;
  notes?: string;
}

const MAX_AI_CALLS_PER_DAY = 25;

interface UserContextType {
  profile: UserProfile | null;
  logs: DailyLog[];
  orders: Order[];
  todayLog: DailyLog | null;
  isLoading: boolean;
  loyaltyPoints: number;
  customFoods: CustomFood[];
  pin: string | null;
  isPinSet: boolean;
  aiQuota: AIQuota;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  saveDailyLog: (log: DailyLog) => Promise<void>;
  saveOrder: (order: Order) => Promise<void>;
  getTodayLog: () => DailyLog | null;
  getWeekLogs: () => DailyLog[];
  getBMI: () => number | null;
  getBMICategory: () => string;
  getCalorieTarget: () => number;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => boolean;
  removePin: () => Promise<void>;
  addCustomFood: (food: CustomFood) => Promise<void>;
  removeCustomFood: (id: string) => Promise<void>;
  useAICall: () => boolean;
  getAICallsRemaining: () => number;
  exportAllData: () => Promise<string>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: '@kutunza_user_profile',
  LOGS: '@kutunza_daily_logs',
  ORDERS: '@kutunza_orders',
  LOYALTY: '@kutunza_loyalty_points',
  PIN: '@kutunza_pin',
  CUSTOM_FOODS: '@kutunza_custom_foods',
  AI_QUOTA: '@kutunza_ai_quota',
};

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pin, setStoredPin] = useState<string | null>(null);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [aiQuota, setAiQuota] = useState<AIQuota>({ date: getTodayStr(), callsUsed: 0, maxCalls: MAX_AI_CALLS_PER_DAY });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [profileData, logsData, ordersData, loyaltyData, pinData, customFoodsData, aiQuotaData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
        AsyncStorage.getItem(STORAGE_KEYS.LOYALTY),
        AsyncStorage.getItem(STORAGE_KEYS.PIN),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_FOODS),
        AsyncStorage.getItem(STORAGE_KEYS.AI_QUOTA),
      ]);
      if (profileData) setProfile(JSON.parse(profileData));
      if (logsData) setLogs(JSON.parse(logsData));
      if (ordersData) setOrders(JSON.parse(ordersData));
      if (loyaltyData) setLoyaltyPoints(JSON.parse(loyaltyData));
      if (pinData) setStoredPin(pinData);
      if (customFoodsData) setCustomFoods(JSON.parse(customFoodsData));
      if (aiQuotaData) {
        const quota = JSON.parse(aiQuotaData) as AIQuota;
        // Reset if it's a new day
        if (quota.date !== getTodayStr()) {
          setAiQuota({ date: getTodayStr(), callsUsed: 0, maxCalls: MAX_AI_CALLS_PER_DAY });
        } else {
          setAiQuota(quota);
        }
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (newProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (e) {
      console.error('Failed to save profile:', e);
      throw new Error('Could not save your profile. Please try again.');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    await saveProfile(updated);
  };

  const saveDailyLog = async (log: DailyLog) => {
    try {
      const existingIndex = logs.findIndex(l => l.date === log.date);
      let newLogs: DailyLog[];
      if (existingIndex >= 0) {
        newLogs = [...logs]; newLogs[existingIndex] = log;
      } else {
        newLogs = [...logs, log];
      }
      // Prune logs older than 90 days to prevent storage bloat
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      const pruned = newLogs.filter(l => l.date >= cutoffStr);
      await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(pruned));
      setLogs(pruned);
    } catch (e) {
      console.error('Failed to save daily log:', e);
      throw new Error('Could not save your log. Please try again.');
    }
  };

  const saveOrder = async (order: Order) => {
    try {
      // Keep last 50 orders only
      const newOrders = [order, ...orders].slice(0, 50);
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(newOrders));
      setOrders(newOrders);
      const newPoints = loyaltyPoints + Math.floor(order.total / 100);
      await AsyncStorage.setItem(STORAGE_KEYS.LOYALTY, JSON.stringify(newPoints));
      setLoyaltyPoints(newPoints);
    } catch (e) {
      console.error('Failed to save order:', e);
      throw new Error('Could not save your order. Please try again.');
    }
  };

  const getTodayLog = () => {
    const today = new Date().toISOString().split('T')[0];
    return logs.find(l => l.date === today) || null;
  };

  const getWeekLogs = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logs.filter(l => new Date(l.date) >= weekAgo).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getBMI = () => {
    if (!profile) return null;
    const h = profile.height / 100;
    return parseFloat((profile.weight / (h * h)).toFixed(1));
  };

  const getBMICategory = () => {
    const bmi = getBMI();
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy Weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getCalorieTarget = () => {
    if (!profile) return 2000;
    let bmr = profile.gender === 'male'
      ? 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
      : 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = Math.round(bmr * mult[profile.activityLevel]);
    if (profile.conditions.includes('weightLoss') || profile.conditions.includes('obesity')) return tdee - 400;
    if (profile.conditions.includes('weightGain')) return tdee + 400;
    return tdee;
  };

  // ─── PIN MANAGEMENT ──────────────────────────────────────────────────────────
  const setPin = async (newPin: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.PIN, newPin);
    setStoredPin(newPin);
  };

  const verifyPin = (attempt: string) => {
    return pin === attempt;
  };

  const removePin = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.PIN);
    setStoredPin(null);
  };

  const isPinSet = pin !== null;

  // ─── CUSTOM FOODS ────────────────────────────────────────────────────────────
  const addCustomFood = async (food: CustomFood) => {
    const updated = [...customFoods, food];
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_FOODS, JSON.stringify(updated));
    setCustomFoods(updated);
  };

  const removeCustomFood = async (id: string) => {
    const updated = customFoods.filter(f => f.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_FOODS, JSON.stringify(updated));
    setCustomFoods(updated);
  };

  // ─── AI QUOTA ────────────────────────────────────────────────────────────────
  const useAICall = (): boolean => {
    const today = getTodayStr();
    let current = aiQuota;
    if (current.date !== today) {
      current = { date: today, callsUsed: 0, maxCalls: MAX_AI_CALLS_PER_DAY };
    }
    if (current.callsUsed >= current.maxCalls) return false;
    const updated = { ...current, callsUsed: current.callsUsed + 1 };
    setAiQuota(updated);
    AsyncStorage.setItem(STORAGE_KEYS.AI_QUOTA, JSON.stringify(updated));
    return true;
  };

  const getAICallsRemaining = (): number => {
    const today = getTodayStr();
    if (aiQuota.date !== today) return MAX_AI_CALLS_PER_DAY;
    return Math.max(0, aiQuota.maxCalls - aiQuota.callsUsed);
  };

  // ─── DATA EXPORT ─────────────────────────────────────────────────────────────
  const exportAllData = async (): Promise<string> => {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      app: 'KutunzaCare',
      profile,
      logs,
      orders,
      customFoods,
      loyaltyPoints,
    }, null, 2);
  };

  const todayLog = getTodayLog();

  return (
    <UserContext.Provider value={{
      profile, logs, orders, todayLog, isLoading, loyaltyPoints, customFoods, pin, isPinSet, aiQuota,
      saveProfile, updateProfile, saveDailyLog, saveOrder,
      getTodayLog, getWeekLogs, getBMI, getBMICategory, getCalorieTarget,
      setPin, verifyPin, removePin,
      addCustomFood, removeCustomFood,
      useAICall, getAICallsRemaining,
      exportAllData,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
