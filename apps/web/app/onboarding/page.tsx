'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { EventName } from '@/lib/events';
import { getData } from 'country-list';
import { detectUserCountry, getCountryFlag } from '@/lib/geolocation';

// Available options
const MEAL_TYPES = [
  { value: 'breakfast' as const, label: 'Breakfast', emoji: '🍳', description: '7 meals/week' },
  { value: 'lunch' as const, label: 'Lunch', emoji: '🥗', description: '7 meals/week' },
  { value: 'dinner' as const, label: 'Dinner', emoji: '🍽️', description: '7 meals/week' },
];

// Top 25 cuisines based on TasteAtlas 2025/26 + Regional favorites
const ALL_CUISINES = [
  { value: 'italian', label: 'Italian', emoji: '🇮🇹', rank: 1 },
  { value: 'greek', label: 'Greek', emoji: '🇬🇷', rank: 2 },
  { value: 'spanish', label: 'Spanish', emoji: '🇪🇸', rank: 5 },
  { value: 'portuguese', label: 'Portuguese', emoji: '🇵🇹', rank: 4 },
  { value: 'japanese', label: 'Japanese', emoji: '🇯🇵', rank: 6 },
  { value: 'turkish', label: 'Turkish', emoji: '🇹🇷', rank: 7 },
  { value: 'chinese', label: 'Chinese', emoji: '🇨🇳', rank: 8 },
  { value: 'french', label: 'French', emoji: '🇫🇷', rank: 9 },
  { value: 'mexican', label: 'Mexican', emoji: '🇲🇽', rank: 11 },
  { value: 'indian', label: 'Indian', emoji: '🇮🇳', rank: 13 },
  { value: 'vietnamese', label: 'Vietnamese', emoji: '🇻🇳', rank: 15 },
  { value: 'brazilian', label: 'Brazilian', emoji: '🇧🇷', rank: 16 },
  { value: 'korean', label: 'Korean', emoji: '🇰🇷', rank: 18 },
  { value: 'lebanese', label: 'Lebanese', emoji: '🇱🇧', rank: 19 },
  { value: 'thai', label: 'Thai', emoji: '🇹🇭', rank: 20 },
  { value: 'indonesian', label: 'Indonesian', emoji: '🇮🇩', rank: 10 },
  { value: 'filipino', label: 'Filipino', emoji: '🇵🇭', rank: 21 },
  { value: 'argentinian', label: 'Argentinian', emoji: '🇦🇷', rank: 22 },
  { value: 'malaysian', label: 'Malaysian', emoji: '🇲🇾', rank: 23 },
  { value: 'moroccan', label: 'Moroccan', emoji: '🇲🇦', rank: 24 },
  { value: 'peruvian', label: 'Peruvian', emoji: '🇵🇪', rank: 3 },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🌊', rank: 0 },
  { value: 'middle-eastern', label: 'Middle Eastern', emoji: '🌙', rank: 0 },
  { value: 'american', label: 'American', emoji: '🇺🇸', rank: 0 },
  { value: 'german', label: 'German', emoji: '🇩🇪', rank: 0 },
  { value: 'swiss', label: 'Swiss', emoji: '🇨🇭', rank: 0 },
];

// Country to regional cuisines mapping
const REGIONAL_CUISINES: Record<string, string[]> = {
  // Europe
  'it': ['italian', 'mediterranean'],
  'gr': ['greek', 'mediterranean'],
  'es': ['spanish', 'mediterranean'],
  'pt': ['portuguese', 'mediterranean'],
  'fr': ['french', 'mediterranean'],
  'de': ['german'],
  'ch': ['swiss', 'german', 'french', 'italian'],
  'tr': ['turkish', 'middle-eastern'],
  // Asia
  'jp': ['japanese'],
  'cn': ['chinese'],
  'kr': ['korean'],
  'th': ['thai'],
  'vn': ['vietnamese'],
  'in': ['indian'],
  'id': ['indonesian'],
  'ph': ['filipino'],
  'my': ['malaysian'],
  'lb': ['lebanese', 'middle-eastern'],
  // Americas
  'mx': ['mexican'],
  'us': ['american'],
  'br': ['brazilian'],
  'ar': ['argentinian'],
  'pe': ['peruvian'],
  // Africa
  'ma': ['moroccan'],
};

// Get sorted cuisines based on user's country
function getSortedCuisines(countryCode: string): typeof ALL_CUISINES {
  const regional = REGIONAL_CUISINES[countryCode.toLowerCase()] || [];
  
  // Sort: regional first, then by rank
  return [...ALL_CUISINES].sort((a, b) => {
    const aIsRegional = regional.includes(a.value);
    const bIsRegional = regional.includes(b.value);
    
    if (aIsRegional && !bIsRegional) return -1;
    if (!aIsRegional && bIsRegional) return 1;
    
    // Both regional or both non-regional: sort by rank
    return a.rank - b.rank;
  });
}

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

// Get all countries from country-list package
const ALL_COUNTRIES = getData().map((country) => ({
  value: country.code.toLowerCase(),
  label: country.name,
  flag: getCountryFlag(country.code),
}));

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    country: '',
    familySize: 2,
    mealTypes: [] as ('breakfast' | 'lunch' | 'dinner')[],
    cuisines: [] as string[],
    flavors: [] as string[],
    dietaryRestrictions: [] as string[],
    kidFriendly: false,
    chickenFrequency: 2,
    redMeatFrequency: 2,
    fishFrequency: 2,
    vegetarianFrequency: 2,
  });
  const [showCountryTooltip, setShowCountryTooltip] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [sortedCuisines, setSortedCuisines] = useState(ALL_CUISINES);
  const { data: user } = trpc.auth.me.useQuery();
  const trackEventMutation = trpc.events.track.useMutation();

  // Auto-detect user's country on mount
  useEffect(() => {
    detectUserCountry()
      .then((result) => {
        if (result.countryCode) {
          setDetectedCountry(result.countryCode);
          setFormData((prev) => ({ ...prev, country: result.countryCode! }));
          // Sort cuisines based on detected country
          setSortedCuisines(getSortedCuisines(result.countryCode));
          console.log('[onboarding] Detected country:', result.countryCode, result.countryName);
        }
      })
      .catch((error) => {
        console.error('[onboarding] Country detection failed:', error);
      })
      .finally(() => {
        setIsDetecting(false);
      });

    if (user) {
      trackEventMutation.mutate({
        eventName: EventName.ONBOARDING_STARTED,
      });
    }
  }, [user]);

  // Re-sort cuisines when country changes
  useEffect(() => {
    if (formData.country) {
      setSortedCuisines(getSortedCuisines(formData.country));
    }
  }, [formData.country]);

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
  const maxFrequency = totalMeals;

  const handleNext = () => {
    if (step === 1 && !formData.country) {
      alert('Please select your country');
      return;
    }
    if (step === 1 && formData.familySize < 1) {
      alert('Please select a family size');
      return;
    }
    if (step === 2 && formData.mealTypes.length === 0) {
      alert('Please select at least one meal type');
      return;
    }
    if (step === 3 && formData.cuisines.length === 0) {
      alert('Please select at least one cuisine');
      return;
    }
    if (step === 4 && formData.flavors.length === 0) {
      alert('Please select at least one flavor');
      return;
    }
    if (step < 7) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    trackEventMutation.mutate({
      eventName: EventName.PREFERENCES_SAVED,
      properties: {
        familySize: formData.familySize,
        mealTypes: formData.mealTypes,
        cuisines: formData.cuisines,
        flavors: formData.flavors,
        dietaryRestrictions: formData.dietaryRestrictions,
        country: formData.country,
      },
    });
    try {
      await savePreferences.mutateAsync(formData);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const toggleSelection = (field: 'mealTypes' | 'cuisines' | 'flavors' | 'dietaryRestrictions', value: string) => {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to FamilyPlate! 🍽️</h1>
            <p className="text-muted">Let's personalize your meal planning experience</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <div
                  key={s}
                  className={`w-full h-2 mx-1 rounded-full ${
                    s <= step ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted text-center">
              Step {step} of 7
            </p>
          </div>

          {/* Step 1: Country & Family Size */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Country Selector */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-semibold text-foreground">🌍 Where are you located?</h2>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowCountryTooltip(true)}
                      onMouseLeave={() => setShowCountryTooltip(false)}
                      className="w-5 h-5 rounded-full border-2 border-muted text-muted text-xs flex items-center justify-center hover:border-foreground hover:text-foreground transition-colors"
                    >
                      i
                    </button>
                    {showCountryTooltip && (
                      <div className="absolute left-0 top-8 z-10 w-64 p-3 bg-surface border border-border rounded-lg shadow-lg text-sm text-foreground">
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
                  className="w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground text-lg focus:border-primary focus:outline-none"
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

              {/* Family Size */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">How many people are you cooking for?</h2>
                <p className="text-muted">This helps us plan the right portion sizes</p>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFormData({ ...formData, familySize: size })}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      formData.familySize === size
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-xl font-semibold text-foreground">{size}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Meal Types */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Which meals do you want to plan?</h2>
                <p className="text-muted">Select all that apply</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MEAL_TYPES.map((mealType) => (
                  <button
                    key={mealType.value}
                    onClick={() => toggleSelection('mealTypes', mealType.value)}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      formData.mealTypes.includes(mealType.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-4xl mb-2">{mealType.emoji}</div>
                    <div className="text-lg font-semibold text-foreground mb-1">{mealType.label}</div>
                    <div className="text-sm text-muted">{mealType.description}</div>
                  </button>
                ))}
              </div>
              {formData.mealTypes.length > 0 && (
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-foreground font-semibold">
                    Total: {totalMeals} meals per week
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Cuisines */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">What cuisines do you enjoy?</h2>
                <p className="text-muted">Select up to 5 cuisines ({formData.cuisines.length}/5 selected)</p>
              </div>
              
              {/* Info banner when limit reached */}
              {formData.cuisines.length >= 5 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">
                        You've selected 5/5 cuisines
                      </p>
                      <p className="text-xs text-muted">
                        Unlock unlimited cuisines with Premium (coming soon)
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sortedCuisines.map((cuisine) => {
                  const isSelected = formData.cuisines.includes(cuisine.value);
                  const isDisabled = !isSelected && formData.cuisines.length >= 5;
                  
                  return (
                    <button
                      key={cuisine.value}
                      onClick={() => !isDisabled && toggleSelection('cuisines', cuisine.value)}
                      disabled={isDisabled}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : isDisabled
                          ? 'border-border bg-muted/20 opacity-50 cursor-not-allowed'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{cuisine.emoji}</div>
                      <div className="text-sm font-semibold text-foreground">{cuisine.label}</div>
                      {isDisabled && (
                        <div className="text-xs text-muted mt-1">🔒 Premium</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Flavors */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">What flavors do you prefer?</h2>
                <p className="text-muted">Select all that apply</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                    <div className="text-sm font-semibold text-foreground">{flavor.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Dietary Restrictions */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Any dietary restrictions?</h2>
                <p className="text-muted">Optional - select all that apply</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <button
                    key={restriction.value}
                    onClick={() => toggleSelection('dietaryRestrictions', restriction.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.dietaryRestrictions.includes(restriction.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{restriction.emoji}</div>
                    <div className="text-sm font-semibold text-foreground">{restriction.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Kid-Friendly */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">👶 Are you cooking for kids?</h2>
                <p className="text-muted">We'll prioritize recipes that children will love</p>
              </div>
              <div className="flex justify-center">
                <label className="flex items-center gap-6 p-8 rounded-lg border-2 border-border hover:border-primary cursor-pointer transition-all max-w-md">
                  <input
                    type="checkbox"
                    checked={formData.kidFriendly}
                    onChange={(e) => setFormData({ ...formData, kidFriendly: e.target.checked })}
                    className="w-8 h-8"
                  />
                  <div>
                    <span className="text-xl font-semibold text-foreground block mb-2">
                      Yes, prioritize kid-friendly meals
                    </span>
                    <span className="text-sm text-muted">
                      Recipes will be selected with children's preferences in mind
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 7: Protein Frequency */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">How often do you want each protein?</h2>
                <p className="text-muted">Per week (0-{maxFrequency} times based on {totalMeals} meals)</p>
              </div>
              <div className="space-y-6">
                {[
                  { key: 'chickenFrequency', label: 'Chicken', emoji: '🍗' },
                  { key: 'redMeatFrequency', label: 'Red Meat', emoji: '🥩' },
                  { key: 'fishFrequency', label: 'Fish', emoji: '🐟' },
                  { key: 'vegetarianFrequency', label: 'Vegetarian', emoji: '🌱' },
                ].map((protein) => (
                  <div key={protein.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{protein.emoji}</span>
                        <span className="font-semibold text-foreground">{protein.label}</span>
                      </div>
                      <span className="text-xl font-bold text-primary">
                        {formData[protein.key as keyof typeof formData]} times/week
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={maxFrequency}
                      value={formData[protein.key as keyof typeof formData] as number}
                      onChange={(e) =>
                        setFormData({ ...formData, [protein.key]: parseInt(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="px-6"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={savePreferences.isPending}
              className="px-6"
            >
              {step === 6 ? (savePreferences.isPending ? 'Saving...' : 'Complete Setup') : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
