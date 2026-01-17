/**
 * Parse cooking instructions from various formats into structured CookingStep objects
 * 
 * Supports:
 * - JSON Array: ["step...", "step..."] or [{ description: "...", ... }]
 * - Numbered List: "1. ...", "1) ..."
 * - Markdown/Bullets: "- ...", "• ..."
 * - Plaintext paragraphs: split by double newlines
 */

import type { CookingStep, Ingredient } from '@/types/cook-mode';

// Config flag for adding "wash hands" step
const ALWAYS_ADD_WASH_HANDS_STEP = true;

/**
 * Parse cooking instructions into structured steps
 */
export function parseCookingInstructions(
  instructions: unknown,
  locale: 'de' | 'en' = 'en'
): CookingStep[] {
  const steps: CookingStep[] = [];

  // Step 0: Wash hands (if enabled)
  if (ALWAYS_ADD_WASH_HANDS_STEP) {
    steps.push(createWashHandsStep(locale));
  }

  // Parse instructions based on type
  let parsedSteps: string[] = [];

  if (Array.isArray(instructions)) {
    // Already an array
    parsedSteps = instructions.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null && 'description' in item) {
        return String(item.description);
      }
      return String(item);
    });
  } else if (typeof instructions === 'string') {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(instructions);
      if (Array.isArray(parsed)) {
        parsedSteps = parsed.map((item) => String(item));
      } else {
        // Not an array, treat as plain text
        parsedSteps = parseTextInstructions(instructions);
      }
    } catch {
      // Not JSON, parse as text
      parsedSteps = parseTextInstructions(instructions);
    }
  }

  // Filter empty strings
  parsedSteps = parsedSteps.filter((step) => step.trim().length > 0);

  // Convert to CookingStep objects
  parsedSteps.forEach((instruction, index) => {
    const stepNumber = index + 1; // Start from 1 (Step 0 is wash hands)
    
    steps.push({
      id: String(stepNumber),
      stepNumber,
      title: `${locale === 'de' ? 'Schritt' : 'Step'} ${stepNumber}`,
      description: instruction.trim(),
      icon: getIconForStep(instruction),
      ...extractTimerInfo(instruction),
    });
  });

  // Fallback: if no steps parsed, return at least wash hands
  if (steps.length === 1 && ALWAYS_ADD_WASH_HANDS_STEP) {
    console.warn('[parseCookingInstructions] No instructions found, returning only wash hands step');
  }

  return steps;
}

/**
 * Parse text-based instructions (numbered, bulleted, or paragraphs)
 */
function parseTextInstructions(text: string): string[] {
  const steps: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match numbered list: "1. ...", "1) ...", "1 ..."
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s*(.+)$/);
    if (numberedMatch) {
      steps.push(numberedMatch[2].trim());
      continue;
    }

    // Match bulleted list: "- ...", "• ...", "* ..."
    const bulletMatch = trimmed.match(/^[-•*]\s*(.+)$/);
    if (bulletMatch) {
      steps.push(bulletMatch[1].trim());
      continue;
    }

    // Otherwise, treat as paragraph
    steps.push(trimmed);
  }

  // If no steps found, try splitting by double newlines (paragraphs)
  if (steps.length === 0) {
    const paragraphs = text.split(/\n\n+/);
    steps.push(...paragraphs.filter((p) => p.trim().length > 0));
  }

  return steps;
}

/**
 * Create "wash hands" preparation step
 */
function createWashHandsStep(locale: 'de' | 'en'): CookingStep {
  const content = {
    de: {
      title: 'Vorbereitung',
      description: 'Hände gründlich waschen und Arbeitsfläche vorbereiten.',
    },
    en: {
      title: 'Preparation',
      description: 'Wash hands thoroughly and prepare work surface.',
    },
  };

  return {
    id: '0',
    stepNumber: 0,
    title: content[locale].title,
    description: content[locale].description,
    icon: '🧼',
    duration: 60,
    timerRequired: false,
  };
}

/**
 * Extract timer information from instruction text
 * Supports: "2 minutes", "30 seconds", "2 min", "30 sec", "2m", "30s"
 */
function extractTimerInfo(instruction: string): {
  duration?: number;
  timerRequired?: boolean;
} {
  const text = instruction.toLowerCase();

  // Regex for time patterns
  const patterns = [
    /(\d+)\s*(minutes?|mins?|m)\b/i,
    /(\d+)\s*(seconds?|secs?|s)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      // Convert to seconds
      let duration: number;
      if (unit.startsWith('m')) {
        duration = value * 60; // minutes to seconds
      } else {
        duration = value; // already seconds
      }

      return {
        duration,
        timerRequired: true,
      };
    }
  }

  return {};
}

/**
 * Get icon for step based on keywords in instruction
 */
function getIconForStep(instruction: string): string {
  const text = instruction.toLowerCase();

  // Keyword-based icon mapping
  const iconMap: Array<[RegExp, string]> = [
    [/wash|clean|rinse|spülen|waschen/i, '🧼'],
    [/boil|simmer|kochen|aufkochen/i, '🍲'],
    [/heat|warm|erhitzen|erwärmen/i, '🔥'],
    [/fry|saute|sauté|braten|anbraten/i, '🔥'],
    [/chop|cut|slice|dice|hacken|schneiden/i, '🔪'],
    [/mix|stir|combine|whisk|rühren|mischen|verrühren/i, '🥄'],
    [/season|salt|pepper|würzen|salzen|pfeffern/i, '🧂'],
    [/serve|plate|anrichten|servieren/i, '🍽️'],
    [/add|pour|hinzufügen|zugeben|gießen/i, '➕'],
    [/drain|remove|abtropfen|entfernen/i, '⬇️'],
    [/wait|rest|warten|ruhen/i, '⏱️'],
    [/bake|roast|backen|rösten/i, '🔥'],
    [/grill|grillen/i, '🔥'],
  ];

  for (const [pattern, icon] of iconMap) {
    if (pattern.test(text)) {
      return icon;
    }
  }

  // Default icon
  return '🍳';
}

/**
 * Parse ingredients from various formats
 */
export function parseIngredients(ingredients: unknown): Ingredient[] {
  const parsed: Ingredient[] = [];

  if (!ingredients) return parsed;

  let ingredientList: string[] = [];

  if (Array.isArray(ingredients)) {
    ingredientList = ingredients.map((item) => String(item));
  } else if (typeof ingredients === 'string') {
    // Try JSON parse first
    try {
      const jsonParsed = JSON.parse(ingredients);
      if (Array.isArray(jsonParsed)) {
        ingredientList = jsonParsed.map((item) => String(item));
      } else {
        // Split by newlines
        ingredientList = ingredients.split('\n');
      }
    } catch {
      // Split by newlines
      ingredientList = ingredients.split('\n');
    }
  }

  // Parse each ingredient
  ingredientList.forEach((ingredient, index) => {
    const trimmed = ingredient.trim();
    if (!trimmed) return;

    // Try to parse "2 cups flour" format
    const match = trimmed.match(/^([\d\/\.\s]+)?\s*([a-z]+)?\s*(.+)$/i);

    if (match) {
      const [, quantity, unit, name] = match;
      parsed.push({
        id: String(index + 1),
        name: name?.trim() || trimmed,
        quantity: quantity?.trim() || '',
        unit: unit?.trim(),
        displayText: trimmed,
      });
    } else {
      // Fallback: use full text
      parsed.push({
        id: String(index + 1),
        name: trimmed,
        quantity: '',
        displayText: trimmed,
      });
    }
  });

  return parsed;
}
