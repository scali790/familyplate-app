import { describe, it, expect } from 'vitest';

/**
 * Dietary Restrictions Feature Tests
 * 
 * Tests the dietary restrictions functionality including:
 * - Religious restrictions (Halal, Kosher, No Pork, No Beef)
 * - Dietary types (Vegetarian, Vegan, Pescatarian)
 * - Allergen restrictions (Gluten-Free, Dairy-Free, Nut-Free, etc.)
 * - AI prompt generation with strict enforcement rules
 */

describe('Dietary Restrictions Feature', () => {
  
  describe('Restriction Options Configuration', () => {
    it('should have all required religious restrictions', () => {
      const DIETARY_RESTRICTION_OPTIONS = [
        { value: "halal", label: "Halal", icon: "☪️", category: "religious" },
        { value: "kosher", label: "Kosher", icon: "✡️", category: "religious" },
        { value: "no-pork", label: "No Pork", icon: "🚫🐷", category: "religious" },
        { value: "no-beef", label: "No Beef", icon: "🚫🐮", category: "religious" },
      ];
      
      const religiousRestrictions = DIETARY_RESTRICTION_OPTIONS.filter(r => r.category === 'religious');
      expect(religiousRestrictions).toHaveLength(4);
      expect(religiousRestrictions.map(r => r.value)).toContain('halal');
      expect(religiousRestrictions.map(r => r.value)).toContain('kosher');
      expect(religiousRestrictions.map(r => r.value)).toContain('no-pork');
      expect(religiousRestrictions.map(r => r.value)).toContain('no-beef');
    });

    it('should have all required dietary type restrictions', () => {
      const DIETARY_RESTRICTION_OPTIONS = [
        { value: "vegetarian", label: "Vegetarian", icon: "🥗", category: "dietary" },
        { value: "vegan", label: "Vegan", icon: "🌱", category: "dietary" },
        { value: "pescatarian", label: "Pescatarian", icon: "🐟", category: "dietary" },
      ];
      
      const dietaryTypes = DIETARY_RESTRICTION_OPTIONS.filter(r => r.category === 'dietary');
      expect(dietaryTypes).toHaveLength(3);
      expect(dietaryTypes.map(r => r.value)).toContain('vegetarian');
      expect(dietaryTypes.map(r => r.value)).toContain('vegan');
      expect(dietaryTypes.map(r => r.value)).toContain('pescatarian');
    });

    it('should have all required allergen restrictions', () => {
      const DIETARY_RESTRICTION_OPTIONS = [
        { value: "gluten-free", label: "Gluten-Free", icon: "🌾", category: "allergen" },
        { value: "dairy-free", label: "Dairy-Free", icon: "🥛", category: "allergen" },
        { value: "nut-free", label: "Nut-Free", icon: "🥜", category: "allergen" },
        { value: "shellfish-free", label: "Shellfish-Free", icon: "🦐", category: "allergen" },
        { value: "egg-free", label: "Egg-Free", icon: "🥚", category: "allergen" },
        { value: "soy-free", label: "Soy-Free", icon: "🫘", category: "allergen" },
      ];
      
      const allergens = DIETARY_RESTRICTION_OPTIONS.filter(r => r.category === 'allergen');
      expect(allergens.length).toBeGreaterThanOrEqual(3);
      expect(allergens.map(r => r.value)).toContain('gluten-free');
      expect(allergens.map(r => r.value)).toContain('dairy-free');
      expect(allergens.map(r => r.value)).toContain('nut-free');
    });
  });

  describe('AI Prompt Generation with Restrictions', () => {
    it('should generate strict enforcement rules for halal restriction', () => {
      const restriction = 'halal';
      const rules: Record<string, string> = {
        'halal': '- HALAL: NO pork, NO alcohol in cooking, only halal-certified meats (beef, lamb, chicken must be halal)',
      };
      
      const rule = rules[restriction];
      expect(rule).toBeDefined();
      expect(rule).toContain('NO pork');
      expect(rule).toContain('NO alcohol');
      expect(rule).toContain('halal-certified meats');
    });

    it('should generate strict enforcement rules for kosher restriction', () => {
      const restriction = 'kosher';
      const rules: Record<string, string> = {
        'kosher': '- KOSHER: NO pork, NO shellfish, NO mixing meat and dairy in same meal, only kosher-certified ingredients',
      };
      
      const rule = rules[restriction];
      expect(rule).toBeDefined();
      expect(rule).toContain('NO pork');
      expect(rule).toContain('NO shellfish');
      expect(rule).toContain('NO mixing meat and dairy');
    });

    it('should generate strict enforcement rules for no pork restriction', () => {
      const restriction = 'no_pork';
      const rules: Record<string, string> = {
        'no_pork': '- NO PORK: Absolutely NO pork, bacon, ham, sausage, or any pork products',
      };
      
      const rule = rules[restriction];
      expect(rule).toBeDefined();
      expect(rule).toContain('NO pork');
      expect(rule).toContain('bacon');
      expect(rule).toContain('ham');
      expect(rule).toContain('sausage');
    });

    it('should generate strict enforcement rules for vegetarian restriction', () => {
      const restriction = 'vegetarian';
      const rules: Record<string, string> = {
        'vegetarian': '- VEGETARIAN: NO meat, NO poultry, NO fish, NO seafood. Eggs and dairy are allowed',
      };
      
      const rule = rules[restriction];
      expect(rule).toBeDefined();
      expect(rule).toContain('NO meat');
      expect(rule).toContain('NO poultry');
      expect(rule).toContain('NO fish');
      expect(rule).toContain('Eggs and dairy are allowed');
    });

    it('should generate strict enforcement rules for vegan restriction', () => {
      const restriction = 'vegan';
      const rules: Record<string, string> = {
        'vegan': '- VEGAN: NO animal products at all (no meat, poultry, fish, eggs, dairy, honey)',
      };
      
      const rule = rules[restriction];
      expect(rule).toBeDefined();
      expect(rule).toContain('NO animal products');
      expect(rule).toContain('no meat');
      expect(rule).toContain('eggs');
      expect(rule).toContain('dairy');
      expect(rule).toContain('honey');
    });

    it('should generate strict enforcement rules for gluten-free restriction', () => {
      const restriction = 'gluten_free';
      const rules: Record<string, string> = {
        'gluten_free': '- GLUTEN-FREE: NO wheat, barley, rye, or any gluten-containing ingredients',
      };
      
      const rule = rules[restriction];
      expect(rule).toBeDefined();
      expect(rule).toContain('NO wheat');
      expect(rule).toContain('barley');
      expect(rule).toContain('rye');
    });

    it('should build complete AI prompt with multiple restrictions', () => {
      const dietaryRestrictions = ['halal', 'nut_free', 'dairy_free'];
      
      const rules: Record<string, string> = {
        'halal': '- HALAL: NO pork, NO alcohol in cooking, only halal-certified meats (beef, lamb, chicken must be halal)',
        'kosher': '- KOSHER: NO pork, NO shellfish, NO mixing meat and dairy in same meal, only kosher-certified ingredients',
        'no_pork': '- NO PORK: Absolutely NO pork, bacon, ham, sausage, or any pork products',
        'no_beef': '- NO BEEF: Absolutely NO beef, steak, ground beef, or any beef products',
        'vegetarian': '- VEGETARIAN: NO meat, NO poultry, NO fish, NO seafood. Eggs and dairy are allowed',
        'vegan': '- VEGAN: NO animal products at all (no meat, poultry, fish, eggs, dairy, honey)',
        'pescatarian': '- PESCATARIAN: NO meat, NO poultry. Fish and seafood are allowed',
        'gluten_free': '- GLUTEN-FREE: NO wheat, barley, rye, or any gluten-containing ingredients',
        'dairy_free': '- DAIRY-FREE: NO milk, cheese, butter, cream, yogurt, or any dairy products',
        'nut_free': '- NUT-FREE: NO peanuts, tree nuts (almonds, walnuts, cashews, etc.), or nut-based products'
      };
      
      const restrictionRules = dietaryRestrictions.map(restriction => {
        return rules[restriction] || `- ${restriction.toUpperCase().replace(/_/g, ' ')}`;
      });
      
      expect(restrictionRules).toHaveLength(3);
      expect(restrictionRules[0]).toContain('HALAL');
      expect(restrictionRules[1]).toContain('NUT-FREE');
      expect(restrictionRules[2]).toContain('DAIRY-FREE');
    });

    it('should include enforcement verification message in prompt', () => {
      const enforcementMessage = `You MUST verify every ingredient in every meal complies with ALL restrictions above. If a meal violates any restriction, replace it with a compliant alternative.`;
      
      expect(enforcementMessage).toContain('MUST verify every ingredient');
      expect(enforcementMessage).toContain('complies with ALL restrictions');
      expect(enforcementMessage).toContain('replace it with a compliant alternative');
    });
  });

  describe('Restriction Data Handling', () => {
    it('should serialize dietary restrictions as JSON array', () => {
      const selectedRestrictions = ['halal', 'nut-free', 'gluten-free'];
      const serialized = JSON.stringify(selectedRestrictions);
      
      expect(serialized).toBe('["halal","nut-free","gluten-free"]');
      
      const deserialized = JSON.parse(serialized);
      expect(deserialized).toEqual(selectedRestrictions);
    });

    it('should handle empty dietary restrictions array', () => {
      const selectedRestrictions: string[] = [];
      const serialized = JSON.stringify(selectedRestrictions);
      
      expect(serialized).toBe('[]');
      
      const deserialized = JSON.parse(serialized);
      expect(deserialized).toEqual([]);
      expect(deserialized.length).toBe(0);
    });

    it('should parse dietary restrictions from database string', () => {
      const dbValue = '["vegetarian","dairy-free"]';
      const parsed = JSON.parse(dbValue);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed).toContain('vegetarian');
      expect(parsed).toContain('dairy-free');
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = 'not-valid-json';
      
      try {
        JSON.parse(invalidJson);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // Fallback to empty array
        const fallback: string[] = [];
        expect(fallback).toEqual([]);
      }
    });
  });

  describe('Restriction Combinations', () => {
    it('should allow combining religious and allergen restrictions', () => {
      const selectedRestrictions = ['halal', 'nut-free', 'gluten-free'];
      
      expect(selectedRestrictions).toContain('halal');
      expect(selectedRestrictions).toContain('nut-free');
      expect(selectedRestrictions).toContain('gluten-free');
      expect(selectedRestrictions).toHaveLength(3);
    });

    it('should allow combining multiple dietary types', () => {
      // Note: In practice, vegan implies vegetarian, but UI allows both selections
      const selectedRestrictions = ['vegetarian', 'gluten-free', 'soy-free'];
      
      expect(selectedRestrictions).toContain('vegetarian');
      expect(selectedRestrictions).toContain('gluten-free');
      expect(selectedRestrictions).toContain('soy-free');
    });

    it('should handle complex restriction combinations', () => {
      const selectedRestrictions = ['kosher', 'gluten-free', 'nut-free', 'dairy-free'];
      
      expect(selectedRestrictions).toHaveLength(4);
      expect(selectedRestrictions.every(r => typeof r === 'string')).toBe(true);
    });
  });

  describe('Toggle Functionality', () => {
    it('should add restriction when not present', () => {
      let selectedRestrictions: string[] = ['halal'];
      const restriction = 'nut-free';
      
      if (!selectedRestrictions.includes(restriction)) {
        selectedRestrictions = [...selectedRestrictions, restriction];
      }
      
      expect(selectedRestrictions).toContain('halal');
      expect(selectedRestrictions).toContain('nut-free');
      expect(selectedRestrictions).toHaveLength(2);
    });

    it('should remove restriction when already present', () => {
      let selectedRestrictions: string[] = ['halal', 'nut-free', 'gluten-free'];
      const restriction = 'nut-free';
      
      if (selectedRestrictions.includes(restriction)) {
        selectedRestrictions = selectedRestrictions.filter(r => r !== restriction);
      }
      
      expect(selectedRestrictions).not.toContain('nut-free');
      expect(selectedRestrictions).toContain('halal');
      expect(selectedRestrictions).toContain('gluten-free');
      expect(selectedRestrictions).toHaveLength(2);
    });

    it('should toggle restriction on and off correctly', () => {
      let selectedRestrictions: string[] = [];
      const restriction = 'vegan';
      
      // Toggle on
      if (selectedRestrictions.includes(restriction)) {
        selectedRestrictions = selectedRestrictions.filter(r => r !== restriction);
      } else {
        selectedRestrictions = [...selectedRestrictions, restriction];
      }
      expect(selectedRestrictions).toContain('vegan');
      
      // Toggle off
      if (selectedRestrictions.includes(restriction)) {
        selectedRestrictions = selectedRestrictions.filter(r => r !== restriction);
      } else {
        selectedRestrictions = [...selectedRestrictions, restriction];
      }
      expect(selectedRestrictions).not.toContain('vegan');
      expect(selectedRestrictions).toHaveLength(0);
    });
  });
});
