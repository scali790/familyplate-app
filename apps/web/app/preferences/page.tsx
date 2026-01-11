'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { getData } from 'country-list';
import { detectUserCountry, getCountryFlag } from '@/lib/geolocation';

// Available options
const MEAL_TYPES = [
  { value: 'breakfast' as const, label: 'Breakfast', emoji: '🍳' },
  { value: 'lunch' as const, label: 'Lunch', emoji: '🥗' },
  { value: 'dinner' as const, label: 'Dinner', emoji: '🍽️' },
];

const CUISINES = [
  { value: 'italian', label: 'Italian', emoji: '🇮🇹' },
  { value: 'mexican', label: 'Mexican', emoji: '🇲🇽' },
  { value: 'chinese', label: 'Chinese', emoji: '🇨🇳' },
  { value: 'indian', label: 'Indian', emoji: '🇮🇳' },
  { value: 'japanese', label: 'Japanese', emoji: '🇯🇵' },
  { value: 'thai', label: 'Thai', emoji: '🇹🇭' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🌊' },
  { value: 'american', label: 'American', emoji: '🇺🇸' },
  { value: 'french', label: 'French', emoji: '🇫🇷' },
  { value: 'greek', label: 'Greek', emoji: '🇬🇷' },
  { value: 'middle-eastern', label: 'Middle Eastern', emoji: '🌙' },
  { value: 'korean', label: 'Korean', emoji: '🇰🇷' },
];

const FLAVORS = [
  { value: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { value: 'sweet', label: 'Sweet', emoji: '🍯' },
  { value: 'savory', label: 'Savory', emoji: '🧂' },
  { value: 'tangy', label: 'Tangy', emoji: '🍋' },
  { value: 'mild', label: 'Mild', emoji: '🥛' },
  { value: 'rich', label: 'Rich', emoji: '🧈' },
];

const DIETARY_RESTRICTIONS = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🌱' },
  { value: 'vegan', label: 'Vegan', emoji: '🥬' },
  { value: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
  { value: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
  { value: 'nut-free', label: 'Nut-Free', emoji: '🥜' },
  { value: 'halal', label: 'Halal', emoji: '☪️' },
  { value: 'kosher', label: 'Kosher', emoji: '✡️' },
  { value: 'no-pork', label: 'No Pork', emoji: '🚫🐷' },
  { value: 'no-beef', label: 'No Beef', emoji: '🚫🐄' },
  { value: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
];

const COOKING_TIMES = [
  { value: 'quick' as const, label: 'Quick (<30 min)', emoji: '⚡' },
  { value: 'medium' as const, label: 'Medium (30-60 min)', emoji: '⏱️' },
  { value: 'elaborate' as const, label: 'Elaborate (60+ min)', emoji: '👨‍🍳' },
];

const SPICE_LEVELS = [
  { value: 'mild' as const, label: 'Mild', emoji: '🥛' },
  { value: 'medium' as const, label: 'Medium', emoji: '🌶️' },
  { value: 'hot' as const, label: 'Hot', emoji: '🔥' },
  { value: 'extra-hot' as const, label: 'Extra Hot', emoji: '🔥🔥' },
];

const COMMON_DISLIKES = [
  { value: 'mushrooms', label: 'Mushrooms', emoji: '🍄' },
  { value: 'olives', label: 'Olives', emoji: '🫒' },
  { value: 'cilantro', label: 'Cilantro', emoji: '🌿' },
  { value: 'onions', label: 'Onions', emoji: '🧅' },
  { value: 'garlic', label: 'Garlic', emoji: '🧄' },
  { value: 'tomatoes', label: 'Tomatoes', emoji: '🍅' },
  { value: 'peppers', label: 'Peppers', emoji: '🫑' },
  { value: 'eggplant', label: 'Eggplant', emoji: '🍆' },
  { value: 'seafood', label: 'Seafood', emoji: '🦐' },
  { value: 'cheese', label: 'Cheese', emoji: '🧀' },
  { value: 'eggs', label: 'Eggs', emoji: '🥚' },
  { value: 'nuts', label: 'Nuts', emoji: '🥜' },
  { value: 'spicy-food', label: 'Spicy Food', emoji: '🌶️' },
  { value: 'bitter-vegetables', label: 'Bitter Vegetables', emoji: '🥬' },
];

// Get all countries from country-list package
const ALL_COUNTRIES = getData().map((country) => ({
  value: country.code.toLowerCase(),
  label: country.name,
  flag: getCountryFlag(country.code),
}));

export default function PreferencesPage() {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCountryTooltip, setShowCountryTooltip] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  // Auto-detect user's country on mount
  useEffect(() => {
    detectUserCountry()
      .then((result) => {
        if (result.countryCode) {
          setDetectedCountry(result.countryCode);
          console.log('[preferences] Detected country:', result.countryCode, result.countryName);
        }
      })
      .catch((error) => {
        console.error('[preferences] Country detection failed:', error);
      })
      .finally(() => {
        setIsDetecting(false);
      });
  }, []);
  const [formData, setFormData] = useState({
    country: '',
    familyName: '',
    familySize: 2,
    mealTypes: [] as ('breakfast' | 'lunch' | 'dinner')[],
    cuisines: [] as string[],
    flavors: [] as string[],
    dietaryRestrictions: [] as string[],
    chickenFrequency: 2,
    redMeatFrequency: 2,
    fishFrequency: 2,
    vegetarianFrequency: 2,
    cookingTime: 'medium' as 'quick' | 'medium' | 'elaborate',
    spiceLevel: 'medium' as 'mild' | 'medium' | 'hot' | 'extra-hot',
    kidFriendly: false,
    commonDislikes: [] as string[],
    customDislikes: '',
  });

  // Fetch existing preferences
  const { data: preferences, isLoading } = trpc.preferences.getPreferences.useQuery();

  // Load preferences when data arrives
  useEffect(() => {
    if (preferences) {      setFormData({
        country: preferences.country || '',
        familyName: preferences.familyName || '',
        familySize: preferences.familySize ?? 2,     mealTypes: Array.isArray(preferences.mealTypes) ? preferences.mealTypes : [],
        cuisines: Array.isArray(preferences.cuisines) ? preferences.cuisines : [],
        flavors: Array.isArray(preferences.flavors) ? preferences.flavors : [],
        dietaryRestrictions: Array.isArray(preferences.dietaryRestrictions) ? preferences.dietaryRestrictions : [],
        chickenFrequency: preferences.chickenFrequency ?? 2,
        redMeatFrequency: preferences.redMeatFrequency ?? 2,
        fishFrequency: preferences.fishFrequency ?? 2,
        vegetarianFrequency: preferences.vegetarianFrequency ?? 2,
        cookingTime: (preferences.cookingTime || 'medium') as 'quick' | 'medium' | 'elaborate',
        spiceLevel: (preferences.spiceLevel || 'medium') as 'mild' | 'medium' | 'hot' | 'extra-hot',
        kidFriendly: preferences.kidFriendly || false,
        commonDislikes: Array.isArray(preferences.commonDislikes) ? preferences.commonDislikes : [],
        customDislikes: preferences.customDislikes || '',
      });
    }
  }, [preferences]);

  const savePreferences = trpc.preferences.savePreferences.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    },
  });

  const totalMeals = formData.mealTypes.length * 7;

  const handleSave = async () => {
    if (formData.familySize < 1) {
      alert('Please select a family size');
      return;
    }
    if (formData.mealTypes.length === 0) {
      alert('Please select at least one meal type');
      return;
    }
    if (formData.cuisines.length === 0) {
      alert('Please select at least one cuisine');
      return;
    }
    if (formData.flavors.length === 0) {
      alert('Please select at least one flavor');
      return;
    }

    try {
      await savePreferences.mutateAsync(formData);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const toggleSelection = (field: 'mealTypes' | 'cuisines' | 'flavors' | 'dietaryRestrictions' | 'commonDislikes', value: string) => {
    setFormData((prev) => {
      if (field === 'mealTypes') {
        const mealType = value as 'breakfast' | 'lunch' | 'dinner';
        return {
          ...prev,
          mealTypes: prev.mealTypes.includes(mealType)
            ? prev.mealTypes.filter((v) => v !== mealType)
            : [...prev.mealTypes, mealType],
        };
      }
      return {
        ...prev,
        [field]: prev[field].includes(value)
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value],
      };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-muted">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-foreground hover:text-primary">
                ← Back
              </Link>
              <h1 className="text-xl font-bold text-foreground">🍽️ Food Preferences</h1>
            </div>
            <Button onClick={handleSave} disabled={savePreferences.isPending}>
              {savePreferences.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Family Basics */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">👨‍👩‍👧‍👦 Family Basics</h2>
              
              {/* Country Selector */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-foreground">🌍 Country</label>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowCountryTooltip(true)}
                      onMouseLeave={() => setShowCountryTooltip(false)}
                      className="w-4 h-4 rounded-full border-2 border-muted text-muted text-xs flex items-center justify-center hover:border-foreground hover:text-foreground transition-colors"
                      style={{ fontSize: '10px' }}
                    >
                      i
                    </button>
                    {showCountryTooltip && (
                      <div className="absolute left-0 top-6 z-10 w-64 p-3 bg-surface border border-border rounded-lg shadow-lg text-sm text-foreground">
                        <p className="font-semibold mb-2">We use your location to:</p>
                        <ul className="space-y-1 text-muted">
                          <li>• Suggest seasonal recipes</li>
                          <li>• Show local ingredients</li>
                          <li>• Connect with local shops</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none"
                  disabled={isDetecting}
                >
                  <option value="">{isDetecting ? 'Detecting your location...' : 'Select your country...'}</option>
                  
                  {/* Detected country on top */}
                  {detectedCountry && (
                    <>
                      <option value={detectedCountry}>
                        {getCountryFlag(detectedCountry)} {ALL_COUNTRIES.find(c => c.value === detectedCountry)?.label} (Detected)
                      </option>
                      <option disabled>──────────────────────</option>
                    </>
                  )}
                  
                  {/* All countries alphabetically */}
                  {ALL_COUNTRIES
                    .filter(c => c.value !== detectedCountry)
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.flag} {country.label}
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Family Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Family Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.familyName}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  placeholder="e.g., The Smiths"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              {/* Family Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Family Size: {formData.familySize}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.familySize}
                  onChange={(e) => setFormData({ ...formData, familySize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Meal Types */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Meal Types
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {MEAL_TYPES.map((meal) => (
                    <button
                      key={meal.value}
                      onClick={() => toggleSelection('mealTypes', meal.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.mealTypes.includes(meal.value)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{meal.emoji}</div>
                      <div className="text-sm font-medium text-foreground">{meal.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cuisine Preferences */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">🌍 Cuisine Preferences</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {CUISINES.map((cuisine) => (
                  <button
                    key={cuisine.value}
                    onClick={() => toggleSelection('cuisines', cuisine.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.cuisines.includes(cuisine.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{cuisine.emoji}</div>
                    <div className="text-xs font-medium text-foreground">{cuisine.label}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Flavor Preferences */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">🌶️ Flavor Preferences</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {FLAVORS.map((flavor) => (
                  <button
                    key={flavor.value}
                    onClick={() => toggleSelection('flavors', flavor.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.flavors.includes(flavor.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{flavor.emoji}</div>
                    <div className="text-xs font-medium text-foreground">{flavor.label}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dietary Restrictions */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">🥗 Dietary Restrictions</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {DIETARY_RESTRICTIONS.map((diet) => (
                  <button
                    key={diet.value}
                    onClick={() => toggleSelection('dietaryRestrictions', diet.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.dietaryRestrictions.includes(diet.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{diet.emoji}</div>
                    <div className="text-xs font-medium text-foreground">{diet.label}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Kid-Friendly Priority */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">👶 Kid-Friendly Meals</h2>
              <p className="text-sm text-muted mb-4">
                Enable this to prioritize recipes that are appealing and suitable for children.
              </p>
              <label className="flex items-center gap-4 p-6 rounded-lg border-2 border-border hover:border-primary cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={formData.kidFriendly}
                  onChange={(e) => setFormData({ ...formData, kidFriendly: e.target.checked })}
                  className="w-6 h-6"
                />
                <div>
                  <span className="text-lg font-semibold text-foreground block">
                    Prioritize Kid-Friendly Meals
                  </span>
                  <span className="text-sm text-muted">
                    Recipes will be selected with children's preferences in mind
                  </span>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Protein Frequency */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">🍗 Protein Frequency</h2>
              <p className="text-sm text-muted mb-6">Total: {totalMeals} meals/week</p>
              
              <div className="space-y-6">
                {[
                  { key: 'chickenFrequency', label: 'Chicken', emoji: '🍗' },
                  { key: 'redMeatFrequency', label: 'Red Meat', emoji: '🥩' },
                  { key: 'fishFrequency', label: 'Fish', emoji: '🐟' },
                  { key: 'vegetarianFrequency', label: 'Vegetarian', emoji: '🌱' },
                ].map(({ key, label, emoji }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">
                        {emoji} {label}
                      </label>
                      <span className="text-sm font-bold text-primary">
                        {formData[key as keyof typeof formData]} meals
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={totalMeals}
                      value={formData[key as keyof typeof formData] as number}
                      onChange={(e) => setFormData({ ...formData, [key]: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardContent className="pt-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-left"
              >
                <h2 className="text-2xl font-bold text-foreground">⚙️ Advanced Settings</h2>
                <span className="text-2xl text-muted">{showAdvanced ? '▼' : '▶'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-6 space-y-6">
                  {/* Cooking Time */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Cooking Time Preference
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {COOKING_TIMES.map((time) => (
                        <button
                          key={time.value}
                          onClick={() => setFormData({ ...formData, cookingTime: time.value })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.cookingTime === time.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-2">{time.emoji}</div>
                          <div className="text-xs font-medium text-foreground">{time.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spice Level */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Spice Level
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {SPICE_LEVELS.map((spice) => (
                        <button
                          key={spice.value}
                          onClick={() => setFormData({ ...formData, spiceLevel: spice.value })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.spiceLevel === spice.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-2">{spice.emoji}</div>
                          <div className="text-xs font-medium text-foreground">{spice.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Common Dislikes */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      🚫 Ingredients to Avoid
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {COMMON_DISLIKES.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => toggleSelection('commonDislikes', item.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.commonDislikes.includes(item.value)
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-border hover:border-red-500/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{item.emoji}</div>
                          <div className="text-xs font-medium text-foreground">{item.label}</div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Dislikes */}
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Other ingredients (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.customDislikes}
                      onChange={(e) => setFormData({ ...formData, customDislikes: e.target.value })}
                      placeholder="e.g., blue cheese, anchovies"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                    <p className="text-xs text-muted mt-1">
                      All selected ingredients will be avoided in meal generation
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button (Bottom) */}
          <div className="flex gap-4">
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={savePreferences.isPending} className="flex-1">
              {savePreferences.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
