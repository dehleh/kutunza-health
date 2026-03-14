import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { getConditionById } from '../data/conditions';
import { sendChatMessage, getErrorMessage, ChatMessage } from '../services/aiService';
import { isApiReady, API_NOT_CONFIGURED_MSG } from '../config/api';
import { useNetworkStatus } from '../utils/network';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  type?: 'text' | 'meal_plan' | 'food_swap' | 'analysis';
}

const QUICK_PROMPTS = [
  { icon: '🍳', text: 'What should I eat for breakfast today?' },
  { icon: '🩸', text: 'Best Nigerian foods to lower blood sugar?' },
  { icon: '❤️', text: 'How can I reduce my blood pressure with food?' },
  { icon: '📉', text: 'Give me a 3-day weight loss meal plan' },
  { icon: '🔄', text: 'Healthy swaps for garri and eba?' },
  { icon: '💊', text: 'Can I eat egusi soup with my condition?' },
  { icon: '🛒', text: 'What should I buy at the market this week?' },
  { icon: '⏰', text: 'Best time to eat for weight loss?' },
];

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingContainer}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

function MessageBubble({ message, onOrderTap }: { message: Message; onOrderTap?: () => void }) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageBubbleWrapper,
        isUser ? styles.userWrapper : styles.assistantWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <LinearGradient colors={[COLORS.burgundy, COLORS.burgundyDark]} style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>K</Text>
        </LinearGradient>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble, { maxWidth: width * 0.78 }]}>
        {message.isLoading ? (
          <TypingDots />
        ) : (
          <>
            <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
              {message.content}
            </Text>
            {/* Order upsell for meal plan messages */}
            {!isUser && message.type === 'meal_plan' && onOrderTap && (
              <TouchableOpacity style={styles.orderChip} onPress={onOrderTap}>
                <LinearGradient colors={[COLORS.burgundyDark, COLORS.burgundy]} style={styles.orderChipGrad}>
                  <Text style={styles.orderChipText}>🍽️ Order these meals cooked →</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        )}
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function AIScreen({ navigation }: any) {
  const { profile, useAICall, getAICallsRemaining } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Ẹ káàbọ̀! I'm Kutu — your personal KutunzaCare AI nutritionist 🌿\n\nI know Nigerian foods inside out and your health profile is already loaded. Ask me anything:\n\n• What to eat for your specific conditions\n• Nigerian meal plans and food swaps\n• Reading food labels & market shopping\n• When and how much to eat\n\nHow can I nurture your health today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const buildSystemPrompt = useCallback(() => {
    if (!profile) return '';
    const conditionDetails = profile.conditions.map(c => {
      const cond = getConditionById(c);
      return cond ? `${cond.label}: ${cond.dietaryGuidelines.slice(0, 3).join('; ')}` : c;
    }).join('\n');

    const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
    const bmr = profile.gender === 'male'
      ? 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
      : 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    const mult: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = Math.round(bmr * mult[profile.activityLevel]);

    return `You are Kutu, the AI nutritionist for KutunzaCare by Kutunza Gourmet (Lagos, Nigeria). You specialize in Nigerian cuisine and clinical nutrition.

USER PROFILE:
- Name: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}
- Weight: ${profile.weight}kg, Height: ${profile.height}cm, BMI: ${bmi}
- Activity: ${profile.activityLevel.replace('_', ' ')}, Daily calorie target: ~${tdee} kcal
${profile.targetWeight ? `- Target weight: ${profile.targetWeight}kg` : ''}
${profile.allergies?.length > 0 ? `- Allergies: ${profile.allergies.join(', ')}` : ''}

HEALTH CONDITIONS & DIETARY GUIDELINES:
${conditionDetails}

YOUR EXPERTISE:
- Deep mastery of Nigerian foods: ofada rice, unripe plantain, eba/garri (GI 87), moi moi, pounded yam, efo riro, egusi soup, ofe onugbu, jollof rice, suya, akara, puff puff, chin chin, zobo, kunu aya, ugwu/ugu, eja titus, ewedu, okra/ila, bitter leaf/ewuro/onugbu, garden egg/igba, agbalumo/udara, tiger nuts
- Local food names across Yoruba, Igbo, Hausa
- Nigerian meal culture, cooking methods, market shopping
- Glycemic index of Nigerian staples
- Clinical nutrition for T2 diabetes (HbA1c management), hypertension (DASH), obesity, metabolic syndrome
- Portion sizes using Nigerian serving vessels (orobo plate, small rubber, sachet)

RESPONSE STYLE:
- Warm, practical, like a knowledgeable Nigerian health aunt/uncle who also studied dietetics
- Always use Nigerian food names naturally — say "eja titus" not just "mackerel", "ugu" not "fluted pumpkin"
- Be specific: portions in Nigerian measures, meal timing, cooking method changes
- Always personalize to this specific user's conditions — never give generic advice
- Responses: 2-5 paragraphs. For meal plans: structured with emojis. For food swaps: clear before/after.
- Occasionally sprinkle Yoruba/Igbo/Hausa words naturally (ẹ jẹ daadaa, nri dị mma, etc.)
- When recommending meal plans, mention that KutunzaCare can cook and deliver these meals
- NEVER recommend anything unsafe for their specific conditions
- If they mention blood sugar readings, BP numbers, or weight changes — respond clinically and specifically

MEAL PLAN FORMAT (when requested):
Use this structure with emojis, keep it scannable:
🌅 BREAKFAST: [meal] (~[cal] kcal)
☀️ LUNCH: [meal] (~[cal] kcal)  
🌙 DINNER: [meal] (~[cal] kcal)
💧 HYDRATION: [drinks]
📊 DAILY TOTAL: ~[total] kcal`;
  }, [profile]);

  const detectMessageType = (text: string): Message['type'] => {
    const lower = text.toLowerCase();
    if (lower.includes('meal plan') || lower.includes('week plan') || lower.includes('day plan')) return 'meal_plan';
    if (lower.includes('swap') || lower.includes('instead of') || lower.includes('alternative')) return 'food_swap';
    return 'text';
  };

  const { isOnline } = useNetworkStatus();

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Guard: API configured?
    if (!isApiReady()) {
      const cfgMsg: Message = {
        id: Date.now().toString(), role: 'assistant',
        content: API_NOT_CONFIGURED_MSG, timestamp: new Date(),
      };
      setMessages(prev => [...prev, cfgMsg]);
      return;
    }

    // Guard: offline?
    if (!isOnline) {
      const offMsg: Message = {
        id: Date.now().toString(), role: 'assistant',
        content: '📵 No internet connection detected. Please check your network and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, offMsg]);
      return;
    }

    const trimmed = text.trim();

    // Guard: AI daily quota
    if (!useAICall()) {
      const quotaMsg: Message = {
        id: Date.now().toString(), role: 'assistant',
        content: '⏳ You\'ve reached your daily limit of 25 AI calls. Your quota resets at midnight. In the meantime, check the Meal Plans and Food Database tabs for guidance!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, quotaMsg]);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed, timestamp: new Date() };
    const loadingMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: new Date(), isLoading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInputText('');
    setIsLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history: ChatMessage[] = messages
        .filter(m => !m.isLoading)
        .map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: trimmed });

      const aiText = await sendChatMessage({
        system: buildSystemPrompt(),
        messages: history,
        callSite: 'ai-chat',
      });
      const msgType = detectMessageType(aiText);

      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        { id: (Date.now() + 2).toString(), role: 'assistant', content: aiText, timestamp: new Date(), type: msgType },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        {
          id: (Date.now() + 2).toString(), role: 'assistant',
          content: `⚠️ ${getErrorMessage(error)}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages, isLoading, buildSystemPrompt, isOnline]);

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Chat cleared. How can I help you today? 🌿',
      timestamp: new Date(),
    }]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <LinearGradient colors={['#1a0a0e', '#0D0D0D']} style={styles.header}>
        <View style={styles.headerAvatarWrap}>
          <LinearGradient colors={[COLORS.burgundy, COLORS.burgundyDark]} style={styles.headerAvatarGrad}>
            <Text style={styles.headerAvatarText}>K</Text>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Kutu AI Nutritionist</Text>
          <Text style={styles.headerStatus}>● Online · {getAICallsRemaining()} calls left today</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('PhotoFoodLog')} style={styles.headerActionBtn}>
          <Ionicons name="camera" size={20} color={COLORS.gold} />
        </TouchableOpacity>
        <TouchableOpacity onPress={clearChat} style={styles.headerActionBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color={COLORS.warning} />
          <Text style={styles.offlineBannerText}>No internet connection — AI features unavailable</Text>
        </View>
      )}

      {/* Profile context banner */}
      {profile && (
        <View style={styles.contextBanner}>
          <Ionicons name="person-circle" size={14} color={COLORS.gold} />
          <Text style={styles.contextText} numberOfLines={1}>
            {profile.name} · {profile.conditions.map(c => getConditionById(c)?.shortLabel).join(', ')} · {profile.weight}kg
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PhotoFoodLog')} style={styles.photoLogChip}>
            <Ionicons name="camera-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.photoLogChipText}>Photo Log</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onOrderTap={() => navigation.navigate('Order')}
          />
        ))}
      </ScrollView>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.quickPrompts} contentContainerStyle={styles.quickPromptsContent}
        >
          {QUICK_PROMPTS.map((p, i) => (
            <TouchableOpacity key={i} style={styles.quickPrompt} onPress={() => sendMessage(p.text)}>
              <Text style={styles.quickPromptIcon}>{p.icon}</Text>
              <Text style={styles.quickPromptText}>{p.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => navigation.navigate('PhotoFoodLog')}
          >
            <Ionicons name="camera-outline" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about Nigerian nutrition..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={600}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <LinearGradient
              colors={inputText.trim() && !isLoading ? [COLORS.goldDark, COLORS.gold] : [COLORS.darkBorder, COLORS.darkBorder]}
              style={styles.sendBtnGrad}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={COLORS.textMuted} />
                : <Ionicons name="send" size={17} color={inputText.trim() ? COLORS.dark : COLORS.textMuted} />
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          Kutu AI advice is informational — consult your doctor for medical decisions
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, gap: 10,
  },
  headerAvatarWrap: { position: 'relative', width: 40, height: 40 },
  headerAvatarGrad: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 18, fontWeight: '800', color: COLORS.gold },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 5.5,
    backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.dark,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  headerStatus: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  headerActionBtn: { padding: 8 },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.warning + '15', paddingVertical: 7, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.warning + '30',
  },
  offlineBannerText: { fontSize: 12, color: COLORS.warning, fontWeight: '600', flex: 1 },
  contextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.goldDark + '15', paddingVertical: 7, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.goldDark + '30',
  },
  contextText: { fontSize: 12, color: COLORS.gold, fontWeight: '600', flex: 1 },
  photoLogChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.darkCard, paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 50, borderWidth: 1, borderColor: COLORS.border,
  },
  photoLogChipText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  messagesList: { flex: 1 },
  messagesContent: { padding: 14, paddingBottom: 8, gap: 6 },
  messageBubbleWrapper: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  userWrapper: { justifyContent: 'flex-end' },
  assistantWrapper: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  aiAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  aiAvatarText: { fontSize: 13, fontWeight: '800', color: COLORS.gold },
  bubble: { borderRadius: 18, padding: 12 },
  userBubble: { backgroundColor: COLORS.burgundy, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: COLORS.darkCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  userText: { color: '#F5E6E8' },
  assistantText: { color: COLORS.textPrimary },
  timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, alignSelf: 'flex-end' },
  typingContainer: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gold },
  orderChip: { marginTop: 10, borderRadius: 10, overflow: 'hidden' },
  orderChipGrad: { paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  orderChipText: { fontSize: 12, fontWeight: '800', color: COLORS.gold },

  quickPrompts: { maxHeight: 84, borderTopWidth: 1, borderTopColor: COLORS.border },
  quickPromptsContent: { padding: 10, gap: 8 },
  quickPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.darkCard, paddingVertical: 9, paddingHorizontal: 13,
    borderRadius: 50, borderWidth: 1, borderColor: COLORS.border,
  },
  quickPromptIcon: { fontSize: 14 },
  quickPromptText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', maxWidth: 200 },

  inputContainer: {
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.darkCard, padding: 10,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  attachBtn: { padding: 6, paddingBottom: 8 },
  textInput: {
    flex: 1, backgroundColor: COLORS.dark, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.textPrimary, maxHeight: 100, lineHeight: 20,
  },
  sendBtn: {},
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGrad: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 5 },
});
