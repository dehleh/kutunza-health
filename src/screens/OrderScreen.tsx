import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useUser, Order } from '../context/UserContext';
import { getConditionById } from '../data/conditions';

// ─── PROMO CODES ───────────────────────────────────────────────────────────
const PROMO_CODES: Record<string, { discount: number; label: string; type: 'percent' | 'flat' }> = {
  'KUTU10':    { discount: 10,   label: '10% off your order',    type: 'percent' },
  'NEWUSER':   { discount: 1500, label: '₦1,500 off first order', type: 'flat' },
  'HEALTHY25': { discount: 25,   label: '25% off today only',    type: 'percent' },
  'LAGOS500':  { discount: 500,  label: '₦500 off delivery',     type: 'flat' },
};

// ─── MENU DATA ─────────────────────────────────────────────────────────────
interface MenuItem {
  id: string; name: string; description: string; price: number;
  category: 'meal' | 'soup' | 'snack' | 'drink' | 'plan';
  emoji: string; conditions: string[]; tag?: string; popular?: boolean; calories: number;
}
interface CartItem { item: MenuItem; quantity: number; }

const MENU_ITEMS: MenuItem[] = [
  { id: 'm001', name: 'Diabetic Control Plate', emoji: '🩸',
    description: 'Unripe plantain porridge with grilled tilapia, steamed ugu & zobo drink',
    price: 4500, category: 'meal', conditions: ['diabetes', 'highBP', 'healthy'],
    tag: 'Best Seller', popular: true, calories: 485 },
  { id: 'm002', name: 'Heart-Healthy Combo', emoji: '❤️',
    description: 'Grilled Titus fish with Efo Riro (low oil), oat swallow & unsweetened zobo',
    price: 5500, category: 'meal', conditions: ['highBP', 'diabetes', 'healthy'],
    tag: 'Heart Health', popular: true, calories: 520 },
  { id: 'm003', name: 'Weight Loss Bowl', emoji: '📉',
    description: 'Pepper soup chicken, garden egg salad, bitter leaf detox broth & water',
    price: 4000, category: 'meal', conditions: ['weightLoss', 'obesity', 'healthy'], calories: 395 },
  { id: 'm004', name: 'Protein Builder Plate', emoji: '📈',
    description: 'Egusi soup with wheat swallow, grilled chicken, beans & tiger nut milk',
    price: 6000, category: 'meal', conditions: ['weightGain', 'healthy'], tag: 'High Protein', calories: 680 },
  { id: 'm005', name: 'Lifestyle Reset Meal', emoji: '🌿',
    description: 'Brown rice with vegetables & fish, green salad, fresh fruit & herbal tea',
    price: 5000, category: 'meal', conditions: ['lifestyle', 'healthy'], calories: 560 },
  { id: 'm006', name: 'Moi Moi Special (3 wraps)', emoji: '🫓',
    description: 'Steamed bean pudding with fish & egg — high protein, low fat, perfect snack',
    price: 2500, category: 'snack', conditions: ['diabetes', 'healthy', 'weightLoss'],
    popular: true, calories: 290 },
  { id: 's001', name: 'Efo Riro (Low Oil)', emoji: '🥬',
    description: 'Fresh leafy green vegetable soup with minimal palm oil — medicinal grade',
    price: 3000, category: 'soup', conditions: ['diabetes', 'highBP', 'weightLoss'],
    tag: 'Anti-hypertensive', calories: 185 },
  { id: 's002', name: 'Bitter Leaf Detox Soup', emoji: '🍵',
    description: 'Traditional ofe onugbu — liver cleansing & blood sugar support',
    price: 3200, category: 'soup', conditions: ['diabetes', 'lifestyle', 'healthy'], calories: 210 },
  { id: 's003', name: 'Light Pepper Soup', emoji: '🌶️',
    description: 'Clear spiced broth with chicken — anti-inflammatory & only 165 kcal',
    price: 3500, category: 'soup', conditions: ['weightLoss', 'obesity', 'highBP'], calories: 165 },
  { id: 's004', name: 'Okra Soup (Minimal Oil)', emoji: '🌾',
    description: 'Mucilaginous okra soup for blood sugar — diabetic-optimized recipe',
    price: 2800, category: 'soup', conditions: ['diabetes', 'highBP', 'healthy'], calories: 180 },
  { id: 'd001', name: 'Zobo Premium (1L)', emoji: '🍷',
    description: 'Unsweetened hibiscus drink — clinically lowers BP by 7-13 mmHg',
    price: 1200, category: 'drink', conditions: ['highBP', 'diabetes', 'healthy'],
    tag: 'BP Control', popular: true, calories: 48 },
  { id: 'd002', name: 'Tiger Nut Milk (500ml)', emoji: '🥛',
    description: 'Creamy kunu aya — prebiotic, gut-friendly, natural energy',
    price: 1500, category: 'drink', conditions: ['healthy', 'weightGain', 'lifestyle'], calories: 120 },
  { id: 'p001', name: 'Diabetes 7-Day Meal Plan', emoji: '📦',
    description: 'All 21 meals for a week — breakfast, lunch, dinner. Delivered fresh daily.',
    price: 65000, category: 'plan', conditions: ['diabetes'], tag: 'Best Value', calories: 0 },
  { id: 'p002', name: 'Blood Pressure 7-Day Plan', emoji: '📦',
    description: 'Week of BP-optimized Nigerian meals. Fresh delivery every morning.',
    price: 70000, category: 'plan', conditions: ['highBP'], tag: 'Best Value', calories: 0 },
  { id: 'p003', name: 'Weight Loss 14-Day Plan', emoji: '📦',
    description: '2-week structured weight loss program with daily delivery to your door.',
    price: 120000, category: 'plan', conditions: ['weightLoss', 'obesity'],
    tag: 'Most Popular', calories: 0 },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🍽️' },
  { id: 'meal', label: 'Meals', icon: '🍲' },
  { id: 'soup', label: 'Soups', icon: '🥣' },
  { id: 'snack', label: 'Snacks', icon: '🫓' },
  { id: 'drink', label: 'Drinks', icon: '🥤' },
  { id: 'plan', label: 'Week Plans', icon: '📦' },
];

const STATUS_CONFIG = {
  pending:    { color: COLORS.warning,   label: 'Pending',    icon: 'time-outline' },
  confirmed:  { color: COLORS.info,      label: 'Confirmed',  icon: 'checkmark-circle-outline' },
  preparing:  { color: COLORS.gold,      label: 'Preparing',  icon: 'restaurant-outline' },
  delivered:  { color: COLORS.success,   label: 'Delivered',  icon: 'checkmark-done-circle' },
  cancelled:  { color: COLORS.error,     label: 'Cancelled',  icon: 'close-circle-outline' },
};

function formatNaira(n: number) { return '₦' + n.toLocaleString('en-NG'); }

// ─── LOYALTY TIER ──────────────────────────────────────────────────────────
function getLoyaltyTier(pts: number) {
  if (pts >= 5000) return { name: 'Royal Crown', icon: '👑', color: COLORS.gold, next: null };
  if (pts >= 2000) return { name: 'Gold Member', icon: '🥇', color: '#FFD700', next: 5000 };
  if (pts >= 500)  return { name: 'Silver Member', icon: '🥈', color: '#C0C0C0', next: 2000 };
  return           { name: 'Starter',      icon: '🌱', color: COLORS.healthy,  next: 500 };
}

export default function OrderScreen({ navigation }: any) {
  const { profile, orders, loyaltyPoints, saveOrder } = useUser();
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<typeof PROMO_CODES[string] | null>(null);
  const [promoError, setPromoError] = useState('');
  const [showMyPick, setShowMyPick] = useState(true);

  const primaryCondition = profile?.conditions[0];
  const condInfo = primaryCondition ? getConditionById(primaryCondition) : null;
  const loyaltyTier = getLoyaltyTier(loyaltyPoints);

  const filteredItems = MENU_ITEMS.filter(item =>
    activeCategory === 'all' ? true : item.category === activeCategory
  );
  const recommendedItems = primaryCondition
    ? MENU_ITEMS.filter(i => i.conditions.includes(primaryCondition) && i.category !== 'plan')
    : [];

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.item.id === item.id);
      if (ex) return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
  };
  const removeFromCart = (id: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.item.id === id);
      if (ex && ex.quantity > 1) return prev.map(c => c.item.id === id ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => c.item.id !== id);
    });
  };
  const getQty = (id: string) => cart.find(c => c.item.id === id)?.quantity || 0;
  const cartSubtotal = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const promoDiscount = appliedPromo
    ? appliedPromo.type === 'percent'
      ? Math.round(cartSubtotal * appliedPromo.discount / 100)
      : appliedPromo.discount
    : 0;
  const cartTotal = Math.max(0, cartSubtotal - promoDiscount);

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedPromo(PROMO_CODES[code]);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try KUTU10 or NEWUSER');
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!deliveryAddress.trim() || !phoneNumber.trim()) {
      Alert.alert('Required', 'Please enter delivery address and phone number.');
      return;
    }
    const orderSummary = cart.map(c =>
      `• ${c.item.emoji} ${c.item.name} x${c.quantity} — ${formatNaira(c.item.price * c.quantity)}`
    ).join('\n');

    const promoLine = appliedPromo ? `*Promo (${promoCode}):* -${formatNaira(promoDiscount)}\n` : '';

    const msg = encodeURIComponent(
      `🌿 *KutunzaCare Health Meal Order*\n\n` +
      `*Customer:* ${profile?.name || 'Customer'}\n` +
      `*Phone:* ${phoneNumber}\n` +
      `*Health Condition:* ${condInfo?.label || 'General Health'}\n` +
      `*Loyalty Points:* ${loyaltyPoints} pts (${loyaltyTier.name})\n` +
      `*Delivery Address:* ${deliveryAddress}\n\n` +
      `*ORDER:*\n${orderSummary}\n\n` +
      `*Subtotal:* ${formatNaira(cartSubtotal)}\n` +
      promoLine +
      `*TOTAL: ${formatNaira(cartTotal)}*\n\n` +
      (notes ? `*Notes:* ${notes}\n\n` : '') +
      `_Ordered via KutunzaCare App_`
    );

    const url = `whatsapp://send?phone=2348138081620&text=${msg}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
      // Save order to history
      const newOrder: Order = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: cart.map(c => ({ name: c.item.name, quantity: c.quantity, price: c.item.price, emoji: c.item.emoji })),
        total: cartTotal,
        status: 'pending',
        deliveryAddress,
        phone: phoneNumber,
        notes,
      };
      await saveOrder(newOrder);
      setShowCheckout(false);
      setCart([]);
      setAppliedPromo(null);
      setPromoCode('');
      Alert.alert(
        '🎉 Order Sent!',
        `Order sent to KutunzaCare via WhatsApp!\n\nTotal: ${formatNaira(cartTotal)}\nYou earned ${Math.floor(cartTotal / 100)} loyalty points!`,
      );
    } else {
      Alert.alert('WhatsApp not found', `Call us to order:\n📞 08138081620\n\nTotal: ${formatNaira(cartTotal)}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#2a0a10', '#1a0508', '#0D0D0D']} style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>KutunzaFoods</Text>
          <Text style={styles.headerSub}>Chef-prepared health meals · Lagos</Text>
        </View>
        {cartCount > 0 && (
          <TouchableOpacity onPress={() => setShowCart(true)} style={styles.cartBtn}>
            <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.cartBtnGrad}>
              <Ionicons name="cart" size={18} color={COLORS.dark} />
              <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Loyalty bar */}
      <View style={styles.loyaltyBar}>
        <Text style={styles.loyaltyTierIcon}>{loyaltyTier.icon}</Text>
        <View style={styles.loyaltyInfo}>
          <Text style={styles.loyaltyTierName}>{loyaltyTier.name}</Text>
          <Text style={styles.loyaltyPoints}>{loyaltyPoints.toLocaleString()} pts</Text>
        </View>
        {loyaltyTier.next && (
          <View style={styles.loyaltyProgress}>
            <View style={[styles.loyaltyProgressFill, {
              width: `${Math.min((loyaltyPoints / loyaltyTier.next) * 100, 100)}%` as any,
              backgroundColor: loyaltyTier.color,
            }]} />
          </View>
        )}
        <Text style={styles.loyaltyNextLabel}>
          {loyaltyTier.next ? `${(loyaltyTier.next - loyaltyPoints).toLocaleString()} pts to next tier` : '🏆 Max tier!'}
        </Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {['menu', 'orders'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'menu' ? '🍽️ Menu' : `📋 My Orders${orders.length > 0 ? ` (${orders.length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'orders' ? (
        /* ── ORDER HISTORY ── */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {orders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyOrdersEmoji}>🛍️</Text>
              <Text style={styles.emptyOrdersTitle}>No orders yet</Text>
              <Text style={styles.emptyOrdersSub}>Your order history will appear here</Text>
              <TouchableOpacity onPress={() => setActiveTab('menu')} style={styles.browseMenuBtn}>
                <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.browseMenuGrad}>
                  <Text style={styles.browseMenuText}>Browse Menu</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map(order => {
              const cfg = STATUS_CONFIG[order.status];
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardHeader}>
                    <View>
                      <Text style={styles.orderDate}>
                        {new Date(order.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.orderTotal}>{formatNaira(order.total)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color + '20', borderColor: cfg.color + '40' }]}>
                      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  <View style={styles.orderItems}>
                    {order.items.map((item, i) => (
                      <Text key={i} style={styles.orderItem}>
                        {item.emoji} {item.name} ×{item.quantity} — {formatNaira(item.price * item.quantity)}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.orderAddress}>📍 {order.deliveryAddress}</Text>
                  <TouchableOpacity style={styles.reorderBtn} onPress={() => {
                    Alert.alert('Reorder?', `Reorder ${order.items.length} item(s) for ${formatNaira(order.total)}?`, [
                      { text: 'Cancel' },
                      { text: 'Reorder', onPress: () => {
                        order.items.forEach(oi => {
                          const menuItem = MENU_ITEMS.find(m => m.name === oi.name);
                          if (menuItem) addToCart(menuItem);
                        });
                        setActiveTab('menu');
                        setShowCart(true);
                      }},
                    ]);
                  }}>
                    <Ionicons name="refresh" size={14} color={COLORS.gold} />
                    <Text style={styles.reorderText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        /* ── MENU ── */
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroBanner}>
            <LinearGradient colors={[COLORS.burgundyDark + 'cc', COLORS.burgundy + 'aa']} style={styles.heroBannerGrad}>
              <Text style={styles.heroBannerTitle}>Nurturing Kings 👑</Text>
              <Text style={styles.heroBannerSub}>Chef-cooked health meals — delivered fresh in Lagos</Text>
              <View style={styles.heroBannerMeta}>
                <Text style={styles.heroBannerBadge}>📍 Lagos Only</Text>
                <Text style={styles.heroBannerBadge}>⏱️ Same-day</Text>
                <Text style={styles.heroBannerBadge}>👨‍🍳 Chef-cooked</Text>
                <Text style={styles.heroBannerBadge}>🌿 Health-optimized</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Recommended for you */}
          {showMyPick && condInfo && recommendedItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{condInfo.icon} Curated for {condInfo.shortLabel}</Text>
                <TouchableOpacity onPress={() => setShowMyPick(false)}>
                  <Ionicons name="close" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recommendedItems.slice(0, 5).map(item => {
                  const qty = getQty(item.id);
                  return (
                    <View key={item.id} style={styles.recoCard}>
                      <Text style={styles.recoEmoji}>{item.emoji}</Text>
                      <Text style={styles.recoName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.recoPrice}>{formatNaira(item.price)}</Text>
                      {qty === 0 ? (
                        <TouchableOpacity style={styles.recoAddBtn} onPress={() => addToCart(item)}>
                          <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.recoAddGrad}>
                            <Text style={styles.recoAddText}>Add</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.qtyRow}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                            <Ionicons name="remove" size={14} color={COLORS.gold} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{qty}</Text>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                            <Ionicons name="add" size={14} color={COLORS.gold} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Category filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.id} style={[styles.catTab, activeCategory === cat.id && styles.catTabActive]} onPress={() => setActiveCategory(cat.id)}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Menu items */}
          <View style={styles.menuSection}>
            {filteredItems.map(item => {
              const qty = getQty(item.id);
              return (
                <View key={item.id} style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuItemEmojiContainer}>
                      <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                      {item.popular && <View style={styles.popularDot} />}
                    </View>
                    <View style={styles.menuItemInfo}>
                      <View style={styles.menuItemNameRow}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        {item.tag && (
                          <View style={styles.menuTag}><Text style={styles.menuTagText}>{item.tag}</Text></View>
                        )}
                      </View>
                      <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                      <View style={styles.menuItemMeta}>
                        <Text style={styles.menuItemPrice}>{formatNaira(item.price)}</Text>
                        {item.calories > 0 && <Text style={styles.menuItemCal}>· {item.calories} kcal</Text>}
                      </View>
                    </View>
                  </View>
                  <View>
                    {qty === 0 ? (
                      <TouchableOpacity onPress={() => addToCart(item)}>
                        <LinearGradient colors={[COLORS.burgundyDark, COLORS.burgundy]} style={styles.addBtn}>
                          <Ionicons name="add" size={20} color={COLORS.gold} />
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyController}>
                        <TouchableOpacity style={styles.qtyControlBtn} onPress={() => removeFromCart(item.id)}>
                          <Ionicons name="remove" size={16} color={COLORS.gold} />
                        </TouchableOpacity>
                        <Text style={styles.qtyControlText}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyControlBtn} onPress={() => addToCart(item)}>
                          <Ionicons name="add" size={16} color={COLORS.gold} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Custom order */}
          <TouchableOpacity style={styles.customOrderCard} onPress={() => Linking.openURL('tel:08138081620')}>
            <LinearGradient colors={[COLORS.darkCard, COLORS.darkElevated]} style={styles.customOrderGrad}>
              <Text style={styles.customOrderEmoji}>👨‍🍳</Text>
              <View>
                <Text style={styles.customOrderTitle}>Custom / Corporate Order?</Text>
                <Text style={styles.customOrderSub}>Bulk orders, events, special diets</Text>
                <Text style={styles.customOrderPhone}>📞 08138081620</Text>
              </View>
              <Ionicons name="call" size={22} color={COLORS.gold} style={{ marginLeft: 'auto' as any }} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Sticky cart */}
      {cartCount > 0 && activeTab === 'menu' && (
        <View style={styles.stickyCart}>
          <TouchableOpacity onPress={() => setShowCart(true)} style={styles.stickyCartBtn}>
            <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.stickyCartGrad}>
              <View style={styles.stickyCartLeft}>
                <View style={styles.stickyCartBadge}><Text style={styles.stickyCartBadgeText}>{cartCount}</Text></View>
                <Text style={styles.stickyCartText}>View Order</Text>
              </View>
              <Text style={styles.stickyCartTotal}>{formatNaira(cartSubtotal)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Order</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {cart.map(ci => (
                <View key={ci.item.id} style={styles.cartItem}>
                  <Text style={styles.cartItemEmoji}>{ci.item.emoji}</Text>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{ci.item.name}</Text>
                    <Text style={styles.cartItemPrice}>{formatNaira(ci.item.price)} × {ci.quantity}</Text>
                  </View>
                  <View style={styles.qtyController}>
                    <TouchableOpacity style={styles.qtyControlBtn} onPress={() => removeFromCart(ci.item.id)}>
                      <Ionicons name="remove" size={14} color={COLORS.gold} />
                    </TouchableOpacity>
                    <Text style={styles.qtyControlText}>{ci.quantity}</Text>
                    <TouchableOpacity style={styles.qtyControlBtn} onPress={() => addToCart(ci.item)}>
                      <Ionicons name="add" size={14} color={COLORS.gold} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemTotal}>{formatNaira(ci.item.price * ci.quantity)}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.cartFooter}>
              <View style={styles.cartTotalRow}>
                <Text style={styles.cartTotalLabel}>Subtotal</Text>
                <Text style={styles.cartTotalValue}>{formatNaira(cartSubtotal)}</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowCart(false); setShowCheckout(true); }} style={styles.checkoutBtn}>
                <LinearGradient colors={[COLORS.goldDark, COLORS.gold]} style={styles.checkoutBtnGrad}>
                  <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={showCheckout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 40 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Checkout</Text>
              <TouchableOpacity onPress={() => setShowCheckout(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Order summary */}
              <View style={styles.checkoutSummary}>
                <Text style={styles.checkoutSummaryText}>{cart.length} item{cart.length > 1 ? 's' : ''}</Text>
              </View>

              {/* Fields */}
              {[
                { label: 'Delivery Address *', placeholder: '5 Admiralty Way, Lekki Phase 1, Lagos', value: deliveryAddress, set: setDeliveryAddress, keyboard: 'default' },
                { label: 'Phone Number *', placeholder: '08012345678', value: phoneNumber, set: setPhoneNumber, keyboard: 'phone-pad' },
              ].map(f => (
                <View key={f.label} style={styles.checkoutField}>
                  <Text style={styles.checkoutLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.checkoutInput} value={f.value} onChangeText={f.set}
                    placeholder={f.placeholder} placeholderTextColor={COLORS.textMuted}
                    keyboardType={f.keyboard as any}
                  />
                </View>
              ))}

              {/* Promo code */}
              <View style={styles.checkoutField}>
                <Text style={styles.checkoutLabel}>Promo Code</Text>
                <View style={styles.promoRow}>
                  <TextInput
                    style={[styles.checkoutInput, { flex: 1, marginRight: 8 }]}
                    value={promoCode} onChangeText={t => { setPromoCode(t); setPromoError(''); }}
                    placeholder="Enter code (e.g. KUTU10)"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity style={styles.applyBtn} onPress={applyPromo}>
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
                {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
                {appliedPromo ? (
                  <View style={styles.promoSuccess}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.promoSuccessText}>{appliedPromo.label} applied!</Text>
                  </View>
                ) : null}
              </View>

              {/* Notes */}
              <View style={styles.checkoutField}>
                <Text style={styles.checkoutLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.checkoutInput, { height: 60 }]} value={notes} onChangeText={setNotes}
                  placeholder="Allergies, special instructions..."
                  placeholderTextColor={COLORS.textMuted} multiline
                />
              </View>

              {/* Price breakdown */}
              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Subtotal</Text>
                  <Text style={styles.priceValue}>{formatNaira(cartSubtotal)}</Text>
                </View>
                {appliedPromo && (
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: COLORS.success }]}>Promo ({promoCode})</Text>
                    <Text style={[styles.priceValue, { color: COLORS.success }]}>-{formatNaira(promoDiscount)}</Text>
                  </View>
                )}
                <View style={[styles.priceRow, styles.priceTotalRow]}>
                  <Text style={styles.priceTotalLabel}>TOTAL</Text>
                  <Text style={styles.priceTotalValue}>{formatNaira(cartTotal)}</Text>
                </View>
                <Text style={styles.loyaltyEarn}>
                  🏆 You'll earn {Math.floor(cartTotal / 100)} loyalty points with this order
                </Text>
              </View>

              {/* Delivery info */}
              <View style={styles.deliveryInfo}>
                <Ionicons name="information-circle" size={16} color={COLORS.info} />
                <Text style={styles.deliveryInfoText}>
                  Orders confirmed within 30 mins via WhatsApp. Lagos delivery only. Same-day for orders before 2PM.
                </Text>
              </View>

              <TouchableOpacity onPress={handleWhatsAppOrder} style={styles.whatsappBtn}>
                <View style={styles.whatsappBtnInner}>
                  <Text style={styles.whatsappIcon}>💬</Text>
                  <View>
                    <Text style={styles.whatsappBtnTitle}>Order via WhatsApp</Text>
                    <Text style={styles.whatsappBtnSub}>{formatNaira(cartTotal)} total</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Linking.openURL('tel:08138081620')} style={styles.callBtn}>
                <Ionicons name="call" size={16} color={COLORS.textSecondary} />
                <Text style={styles.callBtnText}>Or call: 08138081620</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, gap: 10,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 11, color: COLORS.textMuted },
  cartBtn: { borderRadius: 50, overflow: 'hidden' },
  cartBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, gap: 4 },
  cartBadge: { backgroundColor: COLORS.dark, borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.gold },

  loyaltyBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.darkCard, paddingVertical: 8, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  loyaltyTierIcon: { fontSize: 18 },
  loyaltyInfo: {},
  loyaltyTierName: { fontSize: 11, fontWeight: '800', color: COLORS.textPrimary },
  loyaltyPoints: { fontSize: 10, color: COLORS.gold },
  loyaltyProgress: {
    flex: 1, height: 4, backgroundColor: COLORS.darkBorder, borderRadius: 2, overflow: 'hidden',
  },
  loyaltyProgressFill: { height: 4, borderRadius: 2 },
  loyaltyNextLabel: { fontSize: 10, color: COLORS.textMuted, maxWidth: 90, textAlign: 'right' },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: COLORS.gold },
  tabLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  tabLabelActive: { color: COLORS.gold },

  // Order history
  emptyOrders: { alignItems: 'center', padding: 40 },
  emptyOrdersEmoji: { fontSize: 52, marginBottom: 12 },
  emptyOrdersTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  emptyOrdersSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
  browseMenuBtn: { borderRadius: 50, overflow: 'hidden' },
  browseMenuGrad: { paddingVertical: 12, paddingHorizontal: 28 },
  browseMenuText: { fontSize: 14, fontWeight: '800', color: COLORS.dark },

  orderCard: {
    backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderDate: { fontSize: 12, color: COLORS.textMuted },
  orderTotal: { fontSize: 18, fontWeight: '800', color: COLORS.gold, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 50, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '800' },
  orderItems: { gap: 3, marginBottom: 8 },
  orderItem: { fontSize: 13, color: COLORS.textSecondary },
  orderAddress: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10 },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 50, borderWidth: 1, borderColor: COLORS.goldDark },
  reorderText: { fontSize: 12, color: COLORS.gold, fontWeight: '700' },

  heroBanner: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, overflow: 'hidden', marginTop: 12 },
  heroBannerGrad: { padding: 18 },
  heroBannerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  heroBannerSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 10 },
  heroBannerMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  heroBannerBadge: { fontSize: 11, color: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.15)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', fontWeight: '600' },

  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  recoCard: { width: 140, backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 12, marginRight: 10, marginLeft: 0, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  recoEmoji: { fontSize: 28 },
  recoName: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 17 },
  recoPrice: { fontSize: 14, fontWeight: '800', color: COLORS.gold },
  recoAddBtn: { borderRadius: 50, overflow: 'hidden' },
  recoAddGrad: { paddingVertical: 6, alignItems: 'center' },
  recoAddText: { fontSize: 12, fontWeight: '800', color: COLORS.dark },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.dark, borderRadius: 50, padding: 4 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.darkCard, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, minWidth: 16, textAlign: 'center' },

  catScroll: { marginBottom: 8 },
  catContent: { paddingHorizontal: 16, gap: 8 },
  catTab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 50, backgroundColor: COLORS.darkCard, borderWidth: 1, borderColor: COLORS.border },
  catTabActive: { backgroundColor: COLORS.burgundy + '40', borderColor: COLORS.burgundy },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  catLabelActive: { color: COLORS.textPrimary },

  menuSection: { paddingHorizontal: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.darkCard, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  menuItemEmojiContainer: { position: 'relative' },
  menuItemEmoji: { fontSize: 36 },
  popularDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.gold, borderWidth: 2, borderColor: COLORS.darkCard },
  menuItemInfo: { flex: 1 },
  menuItemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 },
  menuItemName: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  menuTag: { backgroundColor: COLORS.gold + '20', paddingVertical: 2, paddingHorizontal: 7, borderRadius: 50, borderWidth: 1, borderColor: COLORS.goldDark },
  menuTagText: { fontSize: 9, color: COLORS.gold, fontWeight: '800' },
  menuItemDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17, marginBottom: 6 },
  menuItemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuItemPrice: { fontSize: 15, fontWeight: '800', color: COLORS.gold },
  menuItemCal: { fontSize: 11, color: COLORS.textMuted },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  qtyController: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.dark, borderRadius: 50, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  qtyControlBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.darkCard, alignItems: 'center', justifyContent: 'center' },
  qtyControlText: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, minWidth: 16, textAlign: 'center' },

  customOrderCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 14, overflow: 'hidden' },
  customOrderGrad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14 },
  customOrderEmoji: { fontSize: 32 },
  customOrderTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  customOrderSub: { fontSize: 12, color: COLORS.textMuted },
  customOrderPhone: { fontSize: 13, color: COLORS.gold, fontWeight: '700', marginTop: 4 },

  stickyCart: { position: 'absolute', bottom: 24, left: 16, right: 16, shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
  stickyCartBtn: { borderRadius: 16, overflow: 'hidden' },
  stickyCartGrad: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  stickyCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stickyCartBadge: { backgroundColor: COLORS.dark, borderRadius: 50, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  stickyCartBadgeText: { fontSize: 12, fontWeight: '800', color: COLORS.gold },
  stickyCartText: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  stickyCartTotal: { fontSize: 16, fontWeight: '800', color: COLORS.dark },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.darkCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  cartItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cartItemEmoji: { fontSize: 24, width: 32 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  cartItemPrice: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  cartItemTotal: { fontSize: 13, fontWeight: '800', color: COLORS.gold, minWidth: 70, textAlign: 'right' },
  cartFooter: { paddingTop: 16 },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cartTotalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  cartTotalValue: { fontSize: 24, fontWeight: '800', color: COLORS.gold },
  checkoutBtn: { borderRadius: 14, overflow: 'hidden' },
  checkoutBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  checkoutBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.dark },

  checkoutSummary: { backgroundColor: COLORS.dark, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  checkoutSummaryText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  checkoutField: { marginBottom: 14 },
  checkoutLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  checkoutInput: { backgroundColor: COLORS.dark, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.textPrimary },
  promoRow: { flexDirection: 'row', alignItems: 'center' },
  applyBtn: { backgroundColor: COLORS.goldDark + '40', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: COLORS.goldDark },
  applyBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.gold },
  promoError: { fontSize: 12, color: COLORS.error, marginTop: 6 },
  promoSuccess: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  promoSuccessText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },

  priceBreakdown: { backgroundColor: COLORS.dark, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceLabel: { fontSize: 13, color: COLORS.textMuted },
  priceValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  priceTotalRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 },
  priceTotalLabel: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  priceTotalValue: { fontSize: 18, fontWeight: '800', color: COLORS.gold },
  loyaltyEarn: { fontSize: 11, color: COLORS.gold, textAlign: 'center', marginTop: 8, fontWeight: '600' },

  deliveryInfo: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: COLORS.info + '10', borderRadius: 10, padding: 12, marginBottom: 16 },
  deliveryInfoText: { fontSize: 12, color: COLORS.info, flex: 1, lineHeight: 18 },
  whatsappBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 10, backgroundColor: '#25D366' },
  whatsappBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  whatsappIcon: { fontSize: 24 },
  whatsappBtnTitle: { fontSize: 15, fontWeight: '800', color: 'white' },
  whatsappBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  callBtnText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
});
