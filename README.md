# KutunzaCare Health App 🌿

> **"Nurturing Kings Back to Health"**  
> By Kutunza Gourmet | www.kutunzafoods.com | 📞 08138081620

React Native (Expo) health app for Nigerians managing chronic conditions through traditional Nigerian foods, personalized AI nutrition advice, and on-demand meal delivery.

---

## 📱 All Features

### Phase 1 — Core Health App
- 7 Health Modules (Diabetes, High BP, Obesity, Weight Loss, Weight Gain, Lifestyle, Healthy)
- Health Profile Setup — 4-step wizard
- Personalized Dashboard — calorie ring, macro tracker, daily meal plan
- 7-Day Meal Plans per condition
- Recipe Database — 10 Nigerian recipes with steps, nutrition, chef tips
- Nigerian Food Database — 25+ foods with local names, GI, condition safety ratings
- Progress Tracking — weight, BP, blood sugar, water, mood with 7-day charts
- Condition Detail Guides — medical guidelines, safe/avoid foods

### Phase 2 — AI + Photo + Orders

#### 🤖 Kutu AI Nutritionist (Tab 3)
- Full chat interface powered by Claude
- Personalized system prompt loads user's conditions, BMI, calorie target, allergies
- Deep Nigerian food expertise — eja titus, ugu, eba GI, zobo BP benefits, etc.
- 8 quick-start prompts pre-loaded
- Detects meal plan responses → shows "Order these meals cooked →" upsell
- Camera button navigates directly to Photo Food Log

#### 📸 Photo Food Log
- Take photo with camera OR pick from gallery
- AI vision identifies every Nigerian food in the image
- Returns: food names (with local names), estimated grams, full nutrition per food
- Health score ring (1-10) personalized to user's conditions
- Per-food rating: Excellent / Good / Moderate / Limit
- Warning foods + personalized Kutu tips
- "Add to Today's Log" saves to daily nutrition tracking
- "Order healthier versions" CTA → Order screen

#### 🛒 KutunzaFoods Order Screen (Tab 5)
- Full e-commerce: menu → cart → checkout → WhatsApp order
- 13 menu items across meals, soups, drinks, weekly plans (₦1,200–₦120,000)
- Smart recommendations — shows items matching user's health conditions
- Loyalty program — 4 tiers: Member → Silver → Gold → Royal
- Promo codes: KUTU10, NEWUSER, HEALTHY25, LAGOS500
- Sticky cart bar, quantity controls, promo code field
- WhatsApp checkout → formatted order sent to 08138081620
- Order history with status tracking + re-order button

---

## 🚀 Setup

```bash
cd KutunzaHealth
npm install
npx expo start
# Scan QR with Expo Go
```

### Permissions Required (auto-prompted)
- Camera and Photo Library (Photo Food Log)

---

## 💰 Business Funnel

User onboards → sets condition → AI chat → photos meals → poor score → orders healthy version → WhatsApp checkout ✅

| Revenue | Price |
|---------|-------|
| Individual meals | ₦4,000–₦6,000 |
| Weekly meal plans | ₦65,000–₦120,000 |
| Corporate/bulk | Custom via 08138081620 |

---

## 📞 Kutunza Gourmet

📱 08138081620 | 09038957696 · 🌐 www.kutunzafoods.com · 🇳🇬 Lagos
