/**
 * Ingredient Category Mapping
 * 
 * Maps ingredients to supermarket categories for organized shopping lists.
 */

export type IngredientCategory = 
  | 'Produce'
  | 'Meat & Fish'
  | 'Dairy & Eggs'
  | 'Pantry'
  | 'Spices'
  | 'Frozen'
  | 'Other';

export interface CategoryConfig {
  emoji: string;
  name: IngredientCategory;
  sortOrder: number;
}

export const CATEGORIES: CategoryConfig[] = [
  { emoji: '🥬', name: 'Produce', sortOrder: 1 },
  { emoji: '🥩', name: 'Meat & Fish', sortOrder: 2 },
  { emoji: '🧀', name: 'Dairy & Eggs', sortOrder: 3 },
  { emoji: '🧂', name: 'Pantry', sortOrder: 4 },
  { emoji: '🌶', name: 'Spices', sortOrder: 5 },
  { emoji: '🧊', name: 'Frozen', sortOrder: 6 },
  { emoji: '🧴', name: 'Other', sortOrder: 7 },
];

// Keyword-based category mapping
// Keys should be lowercase, normalized ingredient names or keywords
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  'Produce': [
    // Vegetables
    'tomato', 'onion', 'garlic', 'potato', 'carrot', 'celery', 'bell pepper',
    'pepper', 'chili', 'cucumber', 'lettuce', 'spinach', 'kale', 'cabbage',
    'broccoli', 'cauliflower', 'zucchini', 'eggplant', 'mushroom', 'corn',
    'pea', 'bean', 'lentil', 'chickpea', 'avocado', 'squash', 'pumpkin',
    'beetroot', 'radish', 'turnip', 'leek', 'shallot', 'scallion', 'ginger',
    'herb', 'parsley', 'cilantro', 'basil', 'mint', 'thyme', 'rosemary',
    'dill', 'oregano', 'sage', 'chive', 'arugula', 'chard', 'bok choy',
    
    // Fruits
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry',
    'blueberry', 'raspberry', 'blackberry', 'mango', 'pineapple', 'watermelon',
    'melon', 'peach', 'pear', 'plum', 'cherry', 'apricot', 'kiwi', 'papaya',
    'pomegranate', 'fig', 'date', 'coconut',
  ],
  
  'Meat & Fish': [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'veal', 'bacon',
    'sausage', 'ham', 'steak', 'ground beef', 'ground meat', 'mince',
    'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'trout', 'halibut', 'sardine',
    'anchovy', 'mackerel', 'shrimp', 'prawn', 'crab', 'lobster', 'scallop',
    'mussel', 'clam', 'oyster', 'squid', 'octopus', 'seafood',
  ],
  
  'Dairy & Eggs': [
    'milk', 'cream', 'butter', 'cheese', 'cheddar', 'mozzarella', 'parmesan',
    'feta', 'goat cheese', 'ricotta', 'cottage cheese', 'cream cheese',
    'yogurt', 'sour cream', 'egg', 'whey', 'buttermilk', 'ghee',
  ],
  
  'Pantry': [
    // Grains & Pasta
    'flour', 'rice', 'pasta', 'noodle', 'bread', 'tortilla', 'pita',
    'couscous', 'quinoa', 'bulgur', 'oat', 'cereal', 'cracker', 'chip',
    
    // Canned & Jarred
    'tomato paste', 'tomato sauce', 'broth', 'stock', 'soup', 'bean',
    'olive', 'pickle', 'jam', 'jelly', 'honey', 'syrup', 'molasses',
    
    // Oils & Condiments
    'oil', 'olive oil', 'vegetable oil', 'sesame oil', 'coconut oil',
    'vinegar', 'soy sauce', 'fish sauce', 'worcestershire', 'mustard',
    'ketchup', 'mayonnaise', 'mayo', 'hot sauce', 'salsa', 'pesto',
    
    // Baking
    'sugar', 'brown sugar', 'baking powder', 'baking soda', 'yeast',
    'vanilla', 'cocoa', 'chocolate', 'nut', 'almond', 'walnut', 'pecan',
    'cashew', 'peanut', 'hazelnut', 'pistachio', 'seed', 'sesame',
    'sunflower', 'pumpkin seed', 'chia', 'flax',
    
    // Misc
    'coffee', 'tea', 'water', 'juice', 'wine', 'beer', 'alcohol',
  ],
  
  'Spices': [
    'salt', 'pepper', 'black pepper', 'white pepper', 'cayenne', 'paprika',
    'cumin', 'coriander', 'turmeric', 'curry', 'garam masala', 'chili powder',
    'garlic powder', 'onion powder', 'ginger powder', 'cinnamon', 'nutmeg',
    'cardamom', 'clove', 'allspice', 'bay leaf', 'fennel', 'caraway',
    'mustard seed', 'sesame seed', 'poppy seed', 'saffron', 'sumac', 'za\'atar',
    'italian seasoning', 'herbs de provence', 'cajun', 'taco seasoning',
  ],
  
  'Frozen': [
    'frozen', 'ice cream', 'sorbet', 'frozen vegetable', 'frozen fruit',
    'frozen pea', 'frozen corn', 'frozen berry', 'frozen pizza', 'frozen meal',
  ],
  
  'Other': [
    // Catch-all for unmatched items
  ],
};

/**
 * Assign a category to an ingredient based on its normalized name
 */
export function assignCategory(normalizedName: string): IngredientCategory {
  const lower = normalizedName.toLowerCase();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        return category as IngredientCategory;
      }
    }
  }
  
  // Default to Other
  return 'Other';
}

/**
 * Get category configuration by name
 */
export function getCategoryConfig(category: IngredientCategory): CategoryConfig {
  return CATEGORIES.find(c => c.name === category) || CATEGORIES[CATEGORIES.length - 1];
}

/**
 * Sort categories by their defined order
 */
export function sortByCategory<T extends { category: IngredientCategory }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const aConfig = getCategoryConfig(a.category);
    const bConfig = getCategoryConfig(b.category);
    return aConfig.sortOrder - bConfig.sortOrder;
  });
}
