import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';

interface PinLockScreenProps {
  mode?: 'setup' | 'verify';
  onSuccess?: () => void;
  onSkip?: () => void;
  route?: { params?: { mode?: 'setup' | 'verify' } };
  navigation?: any;
}

export default function PinLockScreen({ mode: modeProp, onSuccess, onSkip, route, navigation }: PinLockScreenProps) {
  const mode = modeProp ?? route?.params?.mode ?? 'setup';
  const { setPin, verifyPin } = useUser();
  const [enteredPin, setEnteredPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const MAX_ATTEMPTS = 5;
  const isLocked = attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    if (isLocked) {
      const timer = setTimeout(() => setAttempts(0), 30000);
      return () => clearTimeout(timer);
    }
  }, [isLocked]);

  const shake = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (digit: string) => {
    if (isLocked) return;
    setError('');
    const current = step === 'confirm' ? confirmPin : enteredPin;
    if (current.length >= 4) return;
    const newPin = current + digit;

    if (step === 'confirm') {
      setConfirmPin(newPin);
      if (newPin.length === 4) {
        if (newPin === enteredPin) {
          setPin(newPin).then(() => {
            if (onSuccess) onSuccess();
            else if (navigation) navigation.goBack();
          });
        } else {
          shake();
          setError('PINs don\'t match. Try again.');
          setTimeout(() => { setConfirmPin(''); setStep('enter'); setEnteredPin(''); }, 800);
        }
      }
    } else {
      setEnteredPin(newPin);
      if (newPin.length === 4) {
        if (mode === 'verify') {
          if (verifyPin(newPin)) {
            if (onSuccess) onSuccess();
            else if (navigation) navigation.goBack();
          } else {
            shake();
            setAttempts((a: number) => a + 1);
            setError(attempts + 1 >= MAX_ATTEMPTS ? 'Too many attempts. Wait 30 seconds.' : 'Wrong PIN. Try again.');
            setTimeout(() => setEnteredPin(''), 300);
          }
        } else {
          setStep('confirm');
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'confirm') {
      setConfirmPin((p: string) => p.slice(0, -1));
    } else {
      setEnteredPin((p: string) => p.slice(0, -1));
    }
  };

  const currentPin = step === 'confirm' ? confirmPin : enteredPin;
  const title = mode === 'setup'
    ? step === 'confirm' ? 'Confirm your PIN' : 'Create a PIN'
    : 'Enter your PIN';
  const subtitle = mode === 'setup'
    ? step === 'confirm' ? 'Enter the same 4-digit PIN again' : 'Set a 4-digit PIN to protect your health data'
    : 'Enter your 4-digit PIN to unlock';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0a0e', '#0D0D0D']} style={styles.header}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </LinearGradient>

      {/* PIN dots */}
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[styles.dot, currentPin.length > i && styles.dotFilled]}
          />
        ))}
      </Animated.View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Numpad */}
      <View style={styles.numpad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(key => (
          <TouchableOpacity
            key={key || 'empty'}
            style={[styles.numKey, key === '' && styles.numKeyEmpty]}
            onPress={() => {
              if (key === 'del') handleDelete();
              else if (key !== '') handlePress(key);
            }}
            disabled={key === '' || isLocked}
            activeOpacity={0.6}
          >
            {key === 'del' ? (
              <Ionicons name="backspace-outline" size={24} color={COLORS.textSecondary} />
            ) : (
              <Text style={styles.numKeyText}>{key}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'setup' && onSkip && (
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark, alignItems: 'center' },
  header: { width: '100%', paddingTop: 80, paddingBottom: 32, alignItems: 'center' },
  lockIcon: { fontSize: 40, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  dotsRow: {
    flexDirection: 'row', gap: 20, marginTop: 40, marginBottom: 16,
  },
  dot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2,
    borderColor: COLORS.gold, backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: COLORS.gold },
  error: { fontSize: 13, color: COLORS.error, fontWeight: '600', marginBottom: 8 },
  numpad: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    maxWidth: 300, marginTop: 24, gap: 12,
  },
  numKey: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.darkCard, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  numKeyEmpty: { backgroundColor: 'transparent', borderWidth: 0 },
  numKeyText: { fontSize: 28, fontWeight: '600', color: COLORS.textPrimary },
  skipBtn: { marginTop: 24, padding: 12 },
  skipText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
});
