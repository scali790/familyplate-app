import { describe, it, expect } from 'vitest';
import { getIconsForTags, getPrimaryIcon, FOOD_ICONS } from '../src/utils/iconMapping';

describe('Icon Mapping Utilities', () => {
  describe('getIconsForTags', () => {
    it('should return correct icons for valid tags', () => {
      const tags = ['chicken', 'spicy'];
      const icons = getIconsForTags(tags);
      expect(icons).toEqual(['🍗', '🌶️']);
    });

    it('should handle case-insensitive tags', () => {
      const tags = ['CHICKEN', 'Spicy', 'HEALTHY'];
      const icons = getIconsForTags(tags);
      expect(icons).toEqual(['🍗', '🌶️', '🥗']);
    });

    it('should remove duplicate icons', () => {
      const tags = ['fish', 'seafood', 'salmon']; // All map to 🐟
      const icons = getIconsForTags(tags);
      expect(icons).toEqual(['🐟']);
    });

    it('should return empty array for empty tags', () => {
      const icons = getIconsForTags([]);
      expect(icons).toEqual([]);
    });

    it('should ignore unknown tags', () => {
      const tags = ['chicken', 'unknown-tag', 'spicy'];
      const icons = getIconsForTags(tags);
      expect(icons).toEqual(['🍗', '🌶️']);
    });

    it('should handle tags with extra whitespace', () => {
      const tags = ['  chicken  ', 'spicy'];
      const icons = getIconsForTags(tags);
      expect(icons).toEqual(['🍗', '🌶️']);
    });
  });

  describe('getPrimaryIcon', () => {
    it('should return first matching icon', () => {
      const tags = ['chicken', 'spicy', 'healthy'];
      const icon = getPrimaryIcon(tags);
      expect(icon).toBe('🍗');
    });

    it('should return empty string for empty tags', () => {
      const icon = getPrimaryIcon([]);
      expect(icon).toBe('');
    });

    it('should return empty string for unknown tags', () => {
      const icon = getPrimaryIcon(['unknown', 'invalid']);
      expect(icon).toBe('');
    });
  });

  describe('FOOD_ICONS mapping', () => {
    it('should have correct protein type icons', () => {
      expect(FOOD_ICONS.meat).toBe('🥩');
      expect(FOOD_ICONS.chicken).toBe('🍗');
      expect(FOOD_ICONS.fish).toBe('🐟');
    });

    it('should have correct dietary style icons', () => {
      expect(FOOD_ICONS.vegetarian).toBe('🌱');
      expect(FOOD_ICONS.vegan).toBe('🥬');
    });

    it('should have correct characteristic icons', () => {
      expect(FOOD_ICONS.spicy).toBe('🌶️');
      expect(FOOD_ICONS.healthy).toBe('🥗');
      expect(FOOD_ICONS['kid-friendly']).toBe('👶');
    });

    it('should have correct meal type icons', () => {
      expect(FOOD_ICONS.pasta).toBe('🍝');
      expect(FOOD_ICONS.soup).toBe('🥣');
      expect(FOOD_ICONS.salad).toBe('🥗');
    });
  });
});
