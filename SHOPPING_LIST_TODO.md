# Shopping List - Future Enhancements (Option B)

## Current Implementation (Option A) ✅
- Basic shopping list modal
- Loads all ingredients from meals
- Grouped by meal
- Copy to clipboard functionality

## Future Enhancements (Option B) 🚀

### 1. Smart Ingredient Grouping
**Goal:** Group ingredients by category for easier shopping

**Categories:**
- 🥬 Vegetables & Fruits
- 🥩 Meat & Poultry
- 🐟 Fish & Seafood
- 🥛 Dairy & Eggs
- 🌾 Grains & Pasta
- 🥫 Canned & Packaged
- 🧂 Spices & Condiments
- 🍞 Bakery
- 🧊 Frozen

**Implementation:**
- Create ingredient categorization logic (keyword matching or AI)
- Group ingredients by category in modal
- Sort alphabetically within categories

### 2. Duplicate Detection & Merging
**Goal:** Combine duplicate ingredients with quantities

**Example:**
```
Before:
- 2 tomatoes (Chicken Pesto Sandwich)
- 3 tomatoes (Caprese Salad)

After:
- 5 tomatoes (Chicken Pesto Sandwich, Caprese Salad)
```

**Challenges:**
- Parse quantities from ingredient strings
- Handle different units (cups, grams, pieces)
- Fuzzy matching for similar ingredients

### 3. Export Options
**Goal:** Multiple export formats for convenience

**Formats:**
- 📋 Plain text (current)
- 📄 PDF with formatting
- 📧 Email
- 💬 WhatsApp share
- 📱 iOS Reminders / Google Keep integration

### 4. Shopping List Customization
**Goal:** Let user modify list before shopping

**Features:**
- ✅ Check off items as you shop
- ❌ Remove items you already have
- ➕ Add custom items
- 📝 Add notes to items
- 💾 Save list for later

### 5. Store Organization
**Goal:** Organize by supermarket layout

**Features:**
- Custom store layout (Produce → Dairy → Meat → etc.)
- Reorder categories based on user's preferred store
- Save multiple store layouts

### 6. Price Estimation
**Goal:** Estimate total shopping cost

**Features:**
- Price database for common ingredients
- User can input local prices
- Show estimated total cost
- Track spending over time

### 7. Pantry Management
**Goal:** Track what you already have

**Features:**
- Pantry inventory
- Auto-remove items from shopping list if in pantry
- Expiration date tracking
- Low stock alerts

## Priority Ranking

**Phase 1 (Quick Wins):**
1. Smart Ingredient Grouping (high value, medium effort)
2. PDF Export (high value, low effort)

**Phase 2 (Medium Term):**
3. Duplicate Detection & Merging (high value, high effort)
4. Shopping List Customization (medium value, medium effort)

**Phase 3 (Long Term):**
5. Store Organization (medium value, high effort)
6. Price Estimation (low value, high effort)
7. Pantry Management (high value, very high effort - separate feature)

## Technical Notes

### Ingredient Parsing
- Use regex to extract quantities: `(\d+(?:\.\d+)?)\s*(\w+)?\s*(.+)`
- Examples:
  - "2 cups flour" → qty: 2, unit: cups, item: flour
  - "3 tomatoes" → qty: 3, unit: null, item: tomatoes
  - "Salt to taste" → qty: null, unit: null, item: Salt to taste

### Category Mapping
```typescript
const categoryKeywords = {
  vegetables: ['tomato', 'lettuce', 'cucumber', 'onion', 'garlic', ...],
  meat: ['chicken', 'beef', 'pork', 'lamb', ...],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', ...],
  // ...
};
```

### PDF Generation
- Use `jsPDF` or `pdfmake`
- Template with logo, date, categories
- Print-friendly formatting

## User Feedback Needed
- Which features are most important?
- How do you currently shop? (one store, multiple stores?)
- Do you use any shopping list apps already?
- Would you pay for premium features?
