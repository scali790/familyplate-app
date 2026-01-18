export enum EventName {
  // Auth / Onboarding
  USER_CREATED = 'user_created',
  ONBOARDING_STARTED = 'onboarding_started',
  TASTE_VOTE_CAST = 'taste_vote_cast',
  PREFERENCES_SAVED = 'preferences_saved',

  // Meal Planning
  MEALPLAN_GENERATE_CLICKED = 'mealplan_generate_clicked',
  MEALPLAN_GENERATED = 'mealplan_generated',
  MEAL_SWAPPED = 'meal_swapped',
  MEAL_REGENERATED = 'meal_regenerated',

  // Cooking
  COOK_NOW_CLICKED = 'cook_now_clicked',
  COOK_CTA_USED = 'cook_cta_used',
  RECIPE_VIEWED = 'recipe_viewed',

  // Voting
  VOTE_CAST = 'vote_cast',

  // Shopping List
  SHOPPING_LIST_OPENED = 'shopping_list_opened',
  SHOPPING_LIST_GENERATED = 'shopping_list_generated',
  SHOPPING_LIST_EXPORTED = 'shopping_list_exported',

  // Errors
  ERROR_OCCURRED = 'error_occurred',
}
