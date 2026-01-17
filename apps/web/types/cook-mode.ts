/**
 * Cook Mode Type Definitions
 * 
 * Based on Cook Mode MVP specifications
 * These types define the data structures for the step-by-step cooking assistant
 */

/**
 * Represents a single cooking step in the recipe
 */
export interface CookingStep {
  /** Unique identifier for the step */
  id: string;
  
  /** Step number (1-indexed) */
  stepNumber: number;
  
  /** Short, action-oriented title (e.g., "Grill the sandwich") */
  title: string;
  
  /** Detailed description with clear instructions */
  description: string;
  
  /** Optional emoji icon for visual guidance (🔪, 🔥, 🥄, ⏱️, etc.) */
  icon?: string;
  
  /** Optional duration in seconds for this step */
  duration?: number;
  
  /** Whether this step requires a timer */
  timerRequired?: boolean;
  
  /** Optional tip or hint for this step */
  tip?: string;
}

/**
 * Represents an ingredient with quantity and unit
 */
export interface Ingredient {
  /** Unique identifier */
  id: string;
  
  /** Ingredient name (e.g., "Tomatoes") */
  name: string;
  
  /** Quantity (e.g., "2", "1/2", "a pinch of") */
  quantity: string;
  
  /** Unit (e.g., "cups", "tbsp", "pieces") - optional */
  unit?: string;
  
  /** Display text (e.g., "2 Tomatoes", "1 tbsp Olive Oil") */
  displayText: string;
}

/**
 * Timer state for a cooking step
 */
export interface TimerState {
  /** Total duration in seconds */
  duration: number;
  
  /** Remaining time in seconds */
  remaining: number;
  
  /** Whether the timer is currently running */
  isRunning: boolean;
  
  /** Timestamp when timer was started (for background calculation) */
  startedAt?: number;
}

/**
 * Cook Mode view states
 */
export type CookModeView = 
  | 'intro'        // Mini intro screen
  | 'ingredients'  // Ingredients quick check
  | 'cooking'      // Step-by-step cooking
  | 'done';        // Completion screen

/**
 * Complete Cook Mode state
 */
export interface CookModeState {
  /** ID of the meal being cooked */
  mealId: string;
  
  /** Name of the meal */
  mealName: string;
  
  /** Emoji representing the meal */
  emoji: string;
  
  /** List of cooking steps */
  steps: CookingStep[];
  
  /** List of ingredients */
  ingredients: Ingredient[];
  
  /** Current step index (0-indexed) */
  currentStep: number;
  
  /** Current view */
  currentView: CookModeView;
  
  /** Set of ingredient IDs that have been checked off */
  ingredientsChecked: Set<string>;
  
  /** Current timer state (null if no timer active) */
  timerState: TimerState | null;
  
  /** Timestamp when Cook Mode was started */
  startedAt: number;
  
  /** Timestamp when Cook Mode was last updated (for resume) */
  lastUpdatedAt: number;
}

/**
 * Serializable version of CookModeState for localStorage
 * (Set is converted to array)
 */
export interface CookModeStateSerialized {
  mealId: string;
  mealName: string;
  emoji: string;
  steps: CookingStep[];
  ingredients: Ingredient[];
  currentStep: number;
  currentView: CookModeView;
  ingredientsChecked: string[]; // Array instead of Set
  timerState: TimerState | null;
  startedAt: number;
  lastUpdatedAt: number;
}

/**
 * Props for Cook Mode Modal component
 */
export interface CookModeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback to close the modal */
  onClose: () => void;
  
  /** Initial Cook Mode state */
  initialState: CookModeState;
  
  /** Callback when cooking is completed */
  onComplete?: () => void;
}

/**
 * Props for Ingredients Quick Check component
 */
export interface IngredientsQuickCheckProps {
  /** List of ingredients */
  ingredients: Ingredient[];
  
  /** Set of checked ingredient IDs */
  checkedIngredients: Set<string>;
  
  /** Callback when ingredient is toggled */
  onToggleIngredient: (ingredientId: string) => void;
  
  /** Callback when "Start Cooking" is clicked */
  onStartCooking: () => void;
}

/**
 * Props for Cooking Step component
 */
export interface CookingStepProps {
  /** The current cooking step */
  step: CookingStep;
  
  /** Current step number (1-indexed) */
  stepNumber: number;
  
  /** Total number of steps */
  totalSteps: number;
  
  /** Current timer state */
  timerState: TimerState | null;
  
  /** Callback to start timer */
  onStartTimer: (duration: number) => void;
  
  /** Callback to pause timer */
  onPauseTimer: () => void;
  
  /** Callback to reset timer */
  onResetTimer: () => void;
  
  /** Callback when "Previous" is clicked */
  onPrevious: () => void;
  
  /** Callback when "Next" is clicked */
  onNext: () => void;
  
  /** Callback when "Done" is clicked */
  onDone: () => void;
  
  /** Whether this is the first step */
  isFirstStep: boolean;
  
  /** Whether this is the last step */
  isLastStep: boolean;
}

/**
 * Props for Progress Indicator component
 */
export interface ProgressIndicatorProps {
  /** Current step (1-indexed) */
  currentStep: number;
  
  /** Total number of steps */
  totalSteps: number;
  
  /** Optional: Show percentage */
  showPercentage?: boolean;
}

/**
 * Props for Timer component
 */
export interface TimerProps {
  /** Timer state */
  timerState: TimerState;
  
  /** Callback to start timer */
  onStart: () => void;
  
  /** Callback to pause timer */
  onPause: () => void;
  
  /** Callback to reset timer */
  onReset: () => void;
  
  /** Callback when timer completes */
  onComplete?: () => void;
}

/**
 * Props for Done Screen component
 */
export interface DoneScreenProps {
  /** Name of the completed meal */
  mealName: string;
  
  /** Emoji of the meal */
  emoji: string;
  
  /** Callback to return to Day View */
  onReturnToDayView: () => void;
}

/**
 * Props for Mini Intro component
 */
export interface MiniIntroProps {
  /** Meal name */
  mealName: string;
  
  /** Meal emoji */
  emoji: string;
  
  /** Number of steps */
  totalSteps: number;
  
  /** Callback to continue to ingredients check */
  onContinue: () => void;
}

/**
 * Request to generate cooking steps from OpenAI
 */
export interface GenerateCookingStepsRequest {
  /** Meal ID */
  mealId: string;
  
  /** Meal name */
  mealName: string;
  
  /** Meal description (optional) */
  description?: string;
  
  /** Prep time (optional, for context) */
  prepTime?: string;
  
  /** Cook time (optional, for context) */
  cookTime?: string;
  
  /** Dietary tags (optional, for context) */
  tags?: string[];
}

/**
 * Response from OpenAI with generated cooking steps
 */
export interface GenerateCookingStepsResponse {
  /** Generated cooking steps */
  steps: CookingStep[];
  
  /** Generated ingredients list */
  ingredients: Ingredient[];
}

/**
 * Local storage key for Cook Mode state
 */
export const COOK_MODE_STORAGE_KEY = 'familyplate_cook_mode_state';

/**
 * Helper function to serialize Cook Mode state for localStorage
 */
export function serializeCookModeState(state: CookModeState): CookModeStateSerialized {
  return {
    ...state,
    ingredientsChecked: Array.from(state.ingredientsChecked),
  };
}

/**
 * Helper function to deserialize Cook Mode state from localStorage
 */
export function deserializeCookModeState(serialized: CookModeStateSerialized): CookModeState {
  return {
    ...serialized,
    ingredientsChecked: new Set(serialized.ingredientsChecked),
  };
}

/**
 * Helper function to calculate progress percentage
 */
export function calculateProgress(currentStep: number, totalSteps: number): number {
  if (totalSteps === 0) return 0;
  return Math.round((currentStep / totalSteps) * 100);
}

/**
 * Helper function to format timer display (MM:SS)
 */
export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Helper function to check if Cook Mode state exists in localStorage
 */
export function hasSavedCookModeState(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(COOK_MODE_STORAGE_KEY) !== null;
}

/**
 * Helper function to load Cook Mode state from localStorage
 */
export function loadCookModeState(): CookModeState | null {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem(COOK_MODE_STORAGE_KEY);
  if (!saved) return null;
  
  try {
    const serialized = JSON.parse(saved) as CookModeStateSerialized;
    return deserializeCookModeState(serialized);
  } catch (error) {
    console.error('Failed to load Cook Mode state:', error);
    return null;
  }
}

/**
 * Helper function to save Cook Mode state to localStorage
 */
export function saveCookModeState(state: CookModeState): void {
  if (typeof window === 'undefined') return;
  
  try {
    const serialized = serializeCookModeState(state);
    localStorage.setItem(COOK_MODE_STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save Cook Mode state:', error);
  }
}

/**
 * Helper function to clear Cook Mode state from localStorage
 */
export function clearCookModeState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COOK_MODE_STORAGE_KEY);
}
