/**
 * Ingredient Parser & Normalizer
 * 
 * Parses ingredient strings, normalizes names and units,
 * and aggregates quantities for shopping list consolidation.
 */

export interface ParsedIngredient {
  raw: string;
  name: string;
  normalizedName: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
}

export interface AggregatedIngredient {
  name: string;
  normalizedName: string;
  totalQuantity: number;
  unit: string;
  usedInMeals: string[];
  category: string;
}

// Common units and their normalization
const UNIT_NORMALIZATIONS: Record<string, string> = {
  // Weight
  'g': 'g',
  'gram': 'g',
  'grams': 'g',
  'kg': 'kg',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'oz': 'oz',
  'ounce': 'oz',
  'ounces': 'oz',
  'lb': 'lb',
  'lbs': 'lb',
  'pound': 'lb',
  'pounds': 'lb',
  
  // Volume
  'ml': 'ml',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'l': 'l',
  'liter': 'l',
  'liters': 'l',
  'cup': 'cup',
  'cups': 'cup',
  'tbsp': 'tbsp',
  'tablespoon': 'tbsp',
  'tablespoons': 'tbsp',
  'tsp': 'tsp',
  'teaspoon': 'tsp',
  'teaspoons': 'tsp',
  
  // Count
  'pc': 'pcs',
  'pcs': 'pcs',
  'piece': 'pcs',
  'pieces': 'pcs',
  'item': 'pcs',
  'items': 'pcs',
  'whole': 'pcs',
  
  // Misc
  'pinch': 'pinch',
  'dash': 'dash',
  'handful': 'handful',
  'bunch': 'bunch',
  'clove': 'clove',
  'cloves': 'clove',
};

// Unit conversion factors (to base unit)
const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  // Weight conversions to grams
  'kg': { base: 'g', factor: 1000 },
  'oz': { base: 'g', factor: 28.35 },
  'lb': { base: 'g', factor: 453.59 },
  
  // Volume conversions to ml
  'l': { base: 'ml', factor: 1000 },
  'cup': { base: 'ml', factor: 240 },
  'tbsp': { base: 'ml', factor: 15 },
  'tsp': { base: 'ml', factor: 5 },
};

/**
 * Parse an ingredient string into structured data
 */
export function parseIngredient(raw: string): ParsedIngredient {
  const trimmed = raw.trim();
  
  // Regex to match: [quantity] [unit] [name] [(notes)]
  // Examples:
  // "2 cups flour"
  // "500g chicken breast"
  // "1 large onion (diced)"
  // "Salt to taste"
  const regex = /^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*([a-zA-Z]+)?\s+(.+?)(?:\s*\((.+)\))?$/;
  const match = trimmed.match(regex);
  
  if (match) {
    const [, quantityStr, unitStr, nameStr, notesStr] = match;
    
    // Parse quantity (handle fractions like "1/2")
    let quantity: number;
    if (quantityStr.includes('/')) {
      const [num, denom] = quantityStr.split('/').map(Number);
      quantity = num / denom;
    } else {
      quantity = parseFloat(quantityStr.replace(',', '.'));
    }
    
    const unit = unitStr ? normalizeUnit(unitStr) : null;
    const name = nameStr.trim();
    const normalizedName = normalizeName(name);
    const notes = notesStr?.trim() || null;
    
    return {
      raw,
      name,
      normalizedName,
      quantity,
      unit,
      notes,
    };
  }
  
  // Fallback: no quantity/unit detected
  // Try to extract notes in parentheses
  const notesMatch = trimmed.match(/^(.+?)\s*\((.+)\)$/);
  if (notesMatch) {
    const [, nameStr, notesStr] = notesMatch;
    return {
      raw,
      name: nameStr.trim(),
      normalizedName: normalizeName(nameStr.trim()),
      quantity: null,
      unit: null,
      notes: notesStr.trim(),
    };
  }
  
  // Complete fallback: just the name
  return {
    raw,
    name: trimmed,
    normalizedName: normalizeName(trimmed),
    quantity: null,
    unit: null,
    notes: null,
  };
}

/**
 * Normalize unit strings
 */
function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  return UNIT_NORMALIZATIONS[lower] || lower;
}

/**
 * Normalize ingredient names for aggregation
 * - Lowercase
 * - Remove articles (a, an, the)
 * - Singularize (basic)
 */
function normalizeName(name: string): string {
  let normalized = name.toLowerCase().trim();
  
  // Remove leading articles
  normalized = normalized.replace(/^(a|an|the)\s+/i, '');
  
  // Basic singularization (remove trailing 's' or 'es')
  // This is simplistic but works for most cases
  if (normalized.endsWith('ies')) {
    normalized = normalized.slice(0, -3) + 'y';
  } else if (normalized.endsWith('ves')) {
    normalized = normalized.slice(0, -3) + 'f';
  } else if (normalized.endsWith('es') && !normalized.endsWith('oes')) {
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Convert units to a common base for aggregation
 */
function convertToBaseUnit(quantity: number, unit: string): { quantity: number; unit: string } {
  const conversion = UNIT_CONVERSIONS[unit];
  if (conversion) {
    return {
      quantity: quantity * conversion.factor,
      unit: conversion.base,
    };
  }
  return { quantity, unit };
}

/**
 * Aggregate parsed ingredients by normalized name
 */
export function aggregateIngredients(
  ingredients: Array<{ parsed: ParsedIngredient; mealName: string }>
): Map<string, AggregatedIngredient> {
  const aggregated = new Map<string, AggregatedIngredient>();
  
  for (const { parsed, mealName } of ingredients) {
    const key = parsed.normalizedName;
    
    if (!aggregated.has(key)) {
      aggregated.set(key, {
        name: parsed.name,
        normalizedName: parsed.normalizedName,
        totalQuantity: 0,
        unit: parsed.unit || 'pcs',
        usedInMeals: [],
        category: 'Other', // Will be assigned later
      });
    }
    
    const item = aggregated.get(key)!;
    
    // Add meal to usage list
    if (!item.usedInMeals.includes(mealName)) {
      item.usedInMeals.push(mealName);
    }
    
    // Aggregate quantities
    if (parsed.quantity !== null && parsed.unit !== null) {
      // Convert to base unit if possible
      const { quantity, unit } = convertToBaseUnit(parsed.quantity, parsed.unit);
      
      // If units match, add quantities
      if (item.unit === unit) {
        item.totalQuantity += quantity;
      } else if (item.totalQuantity === 0) {
        // First quantity for this ingredient
        item.totalQuantity = quantity;
        item.unit = unit;
      } else {
        // Units don't match and we already have a quantity
        // Keep the existing unit and add as-is (not ideal but safe)
        item.totalQuantity += parsed.quantity;
      }
    } else {
      // No quantity specified, increment count
      item.totalQuantity += 1;
      if (!item.unit) {
        item.unit = 'pcs';
      }
    }
  }
  
  return aggregated;
}

/**
 * Format quantity for display
 */
export function formatQuantity(quantity: number, unit: string): string {
  // Round to 2 decimal places
  const rounded = Math.round(quantity * 100) / 100;
  
  // Remove trailing decimal zeros only (e.g., 800.00 → 800, 800.50 → 800.5)
  // But preserve integer zeros (e.g., 800 stays 800, not 8)
  const formatted = rounded.toString().replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  
  return `${formatted} ${unit}`;
}
