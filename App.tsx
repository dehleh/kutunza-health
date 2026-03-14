import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import HealthProfileScreen from './src/screens/HealthProfileScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MealPlansScreen from './src/screens/MealPlansScreen';
import MealDetailScreen from './src/screens/MealDetailScreen';
import FoodDatabaseScreen from './src/screens/FoodDatabaseScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ConditionDetailScreen from './src/screens/ConditionDetailScreen';
import AIScreen from './src/screens/AIScreen';
import PhotoFoodLogScreen from './src/screens/PhotoFoodLogScreen';
import OrderScreen from './src/screens/OrderScreen';
import PinLockScreen from './src/screens/PinLockScreen';

import { COLORS } from './src/constants/colors';
import { UserProvider, useUser } from './src/context/UserContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function OrderTabIcon({ focused, color, size }: { focused: boolean; color: string; size: number }) {
  return (
    <View style={{ position: 'relative' }}>
      <LinearGradient
        colors={focused ? [COLORS.burgundy, COLORS.burgundyDark] : ['transparent', 'transparent']}
        style={{
          width: 36, height: 36, borderRadius: 18,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: focused ? 0 : 1,
          borderColor: COLORS.border,
        }}
      >
        <Ionicons name={focused ? 'bag' : 'bag-outline'} size={20} color={focused ? COLORS.gold : color} />
      </LinearGradient>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.darkCard,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'MealPlans') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'AI') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          else if (route.name === 'Progress') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          else if (route.name === 'Order') return <OrderTabIcon focused={focused} color={color} size={size} />;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="MealPlans" component={MealPlansScreen} options={{ tabBarLabel: 'Meals' }} />
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{
          tabBarLabel: 'Kutu AI',
          tabBarActiveTintColor: COLORS.gold,
        }}
      />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progress' }} />
      <Tab.Screen
        name="Order"
        component={OrderScreen}
        options={{
          tabBarLabel: 'Order',
          tabBarActiveTintColor: COLORS.gold,
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isLoading: isUserLoading, isPinSet } = useUser();
  const [appLoading, setAppLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const profile = await AsyncStorage.getItem('@kutunza_user_profile');
      setHasProfile(profile !== null);
    } catch (e) {
      setHasProfile(false);
    } finally {
      setAppLoading(false);
    }
  };

  if (appLoading || isUserLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.dark }}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  // Show PIN lock if PIN is set and not yet unlocked
  if (isPinSet && !isUnlocked && hasProfile) {
    return <PinLockScreen mode="verify" onSuccess={() => setIsUnlocked(true)} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasProfile ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="HealthProfile" component={HealthProfileScreen} />
          </>
        ) : null}
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="MealDetail" component={MealDetailScreen} />
        <Stack.Screen name="ConditionDetail" component={ConditionDetailScreen} />
        {hasProfile && (
          <Stack.Screen name="HealthProfile" component={HealthProfileScreen} />
        )}
        <Stack.Screen name="FoodDatabase" component={FoodDatabaseScreen} />
        <Stack.Screen name="PhotoFoodLog" component={PhotoFoodLogScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="PinLock" component={PinLockScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

const styles = StyleSheet.create({});
