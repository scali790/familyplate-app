'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useState, useEffect } from 'react';
import { parseIngredient, aggregateIngredients, formatQuantity } from '@/lib/ingredient-parser';
import { assignCategory, getCategoryConfig, sortByCategory, type IngredientCategory } from '@/lib/ingredient-categories';
import type { Meal } from '@/server/db/schema';

const STORAGE_KEY_PREFIX = 'fp_share_checked_';

interface ShoppingItem {
  id: string;
  name: string;
  normalizedName: string;
  totalQuantity: number;
  unit: string;
  category: IngredientCategory;
  usedInMeals: string[];
  checked: boolean;
}

export default function SharedShoppingListPage() {
  const params = useParams();
  const token = params.token as string;

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [consolidatedList, setConsolidatedList] = useState<ShoppingItem[]>([]);

  const { data, isLoading, error } = trpc.shoppingList.getShared.useQuery(
    { token },
    { retry: false }
  );

  // Load checked state from localStorage
  useEffect(() => {
    if (!token) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${token}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCheckedItems(new Set(Object.keys(parsed).filter(k => parsed[k])));
      }
    } catch (err) {
      console.error('Failed to load checked state:', err);
    }
  }, [token]);

  // Save checked state to localStorage
  useEffect(() => {
    if (!token) return;
    try {
      const obj: Record<string, boolean> = {};
      checkedItems.forEach(id => {
        obj[id] = true;
      });
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${token}`, JSON.stringify(obj));
    } catch (err) {
      console.error('Failed to save checked state:', err);
    }
  }, [checkedItems, token]);

  // Process meals into consolidated shopping list
  useEffect(() => {
    if (!data?.meals) return;

    const meals = data.meals as Meal[];
    
    // Parse and aggregate ingredients
    const ingredientsWithMeals = meals.flatMap(m => 
      (m.ingredients || []).map(ing => ({
        parsed: parseIngredient(ing),
        mealName: m.name,
      }))
    );

    const aggregated = aggregateIngredients(ingredientsWithMeals);

    // Convert to ShoppingItem array with categories
    const items: ShoppingItem[] = [];
    aggregated.forEach((agg, normalizedName) => {
      const category = assignCategory(normalizedName);
      items.push({
        id: normalizedName,
        name: agg.name,
        normalizedName: agg.normalizedName,
        totalQuantity: agg.totalQuantity,
        unit: agg.unit,
        category,
        usedInMeals: agg.usedInMeals,
        checked: checkedItems.has(normalizedName),
      });
    });

    // Sort by category
    setConsolidatedList(sortByCategory(items));
  }, [data?.meals, checkedItems]);

  const toggleCheck = (itemId: string) => {
    if (data?.mode !== 'check') return;
    
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const resetChecks = () => {
    setCheckedItems(new Set());
  };

  const copyList = () => {
    const lines: string[] = [];
    
    // Group by category
    const byCategory = new Map<IngredientCategory, ShoppingItem[]>();
    consolidatedList.forEach(item => {
      if (!byCategory.has(item.category)) {
        byCategory.set(item.category, []);
      }
      byCategory.get(item.category)!.push(item);
    });

    byCategory.forEach((items, category) => {
      const config = getCategoryConfig(category);
      lines.push(`${config.emoji} ${config.name}`);
      items.forEach(item => {
        const quantity = formatQuantity(item.totalQuantity, item.unit);
        lines.push(`- ${item.name} (${quantity})`);
      });
      lines.push('');
    });

    navigator.clipboard.writeText(lines.join('\n'));
    alert('Shopping list copied to clipboard!');
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Link Not Available</h1>
          <p className="text-muted mb-4">
            {error.message === 'This link has expired'
              ? 'This shopping list link has expired.'
              : error.message === 'This link has been revoked'
              ? 'This shopping list link is no longer active.'
              : 'This link is no longer available.'}
          </p>
          <p className="text-sm text-muted">
            Ask the family manager for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-muted">Loading shopping list...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || consolidatedList.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">No Items</h1>
          <p className="text-muted">This shopping list is empty.</p>
        </div>
      </div>
    );
  }

  // Group by category
  const byCategory = new Map<IngredientCategory, ShoppingItem[]>();
  consolidatedList.forEach(item => {
    if (!byCategory.has(item.category)) {
      byCategory.set(item.category, []);
    }
    byCategory.get(item.category)!.push(item);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">🛒 Shopping List</h1>
              <p className="text-sm text-muted mt-1">
                {data.familyName && `${data.familyName} · `}
                Week of {data.weekLabel}
              </p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-surface border border-border">
              {data.mode === 'check' ? '✓ Checkable' : '👁 Read-only'}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {Array.from(byCategory.entries()).map(([category, items]) => {
            const config = getCategoryConfig(category);
            return (
              <div key={category}>
                {/* Category Header */}
                <div className="sticky top-[88px] z-10 bg-background backdrop-blur-sm py-3 mb-3 border-b border-border -mx-6 px-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.emoji}</span>
                    <h3 className="font-bold text-foreground">{config.name}</h3>
                    <span className="text-sm text-muted">· {items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg bg-surface border border-border transition-all ${
                        item.checked ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Checkbox (only if mode === 'check') */}
                      {data.mode === 'check' && (
                        <button
                          onClick={() => toggleCheck(item.id)}
                          className="flex-shrink-0 mt-0.5"
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            item.checked
                              ? 'bg-primary border-primary'
                              : 'border-muted hover:border-foreground'
                          }`}>
                            {item.checked && (
                              <span className="text-primary-foreground text-xs">✓</span>
                            )}
                          </div>
                        </button>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className={`font-medium ${item.checked ? 'line-through' : ''}`}>
                            {item.name}
                          </span>
                          <span className="text-sm text-muted">
                            {formatQuantity(item.totalQuantity, item.unit)}
                          </span>
                        </div>
                        {item.usedInMeals.length > 1 && (
                          <div className="text-xs text-muted mt-1">
                            Used in {item.usedInMeals.length} meals
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={copyList}
            className="flex-1 px-4 py-3 rounded-lg bg-surface border border-border text-foreground font-medium hover:bg-surface/80 transition-all"
          >
            📋 Copy List
          </button>
          {data.mode === 'check' && checkedItems.size > 0 && (
            <button
              onClick={resetChecks}
              className="px-4 py-3 rounded-lg bg-surface border border-border text-muted font-medium hover:bg-surface/80 transition-all"
            >
              Reset Checks
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
