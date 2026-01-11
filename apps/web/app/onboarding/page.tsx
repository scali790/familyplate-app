'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

// Available options
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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    familySize: 2,
    cuisines: [] as string[],
    flavors: [] as string[],
    dietaryRestrictions: [] as string[],
    chickenFrequency: 2,
    redMeatFrequency: 2,
    fishFrequency: 2,
    vegetarianFrequency: 2,
  });

  const savePreferences = trpc.preferences.savePreferences.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    },
  });

  const handleNext = () => {
    if (step === 1 && formData.familySize < 1) {
      alert('Please select a family size');
      return;
    }
    if (step === 2 && formData.cuisines.length === 0) {
      alert('Please select at least one cuisine');
      return;
    }
    if (step === 3 && formData.flavors.length === 0) {
      alert('Please select at least one flavor');
      return;
    }
    if (step < 5) {
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
    try {
      await savePreferences.mutateAsync(formData);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const toggleSelection = (field: 'cuisines' | 'flavors' | 'dietaryRestrictions', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
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
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-full h-2 mx-1 rounded-full ${
                    s <= step ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted text-center">
              Step {step} of 5
            </p>
          </div>

          {/* Step 1: Family Size */}
          {step === 1 && (
            <div className="space-y-6">
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

          {/* Step 2: Cuisines */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">What cuisines do you enjoy?</h2>
                <p className="text-muted">Select all that apply</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                    <div className="text-sm font-semibold text-foreground">{cuisine.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Flavors */}
          {step === 3 && (
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

          {/* Step 4: Dietary Restrictions */}
          {step === 4 && (
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

          {/* Step 5: Protein Frequencies */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">How often do you want each protein?</h2>
                <p className="text-muted">Per week (0-7 times)</p>
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
                      max="7"
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
              {step === 5 ? (savePreferences.isPending ? 'Saving...' : 'Complete Setup') : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
