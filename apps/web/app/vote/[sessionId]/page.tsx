"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";

type Meal = {
  recipeId: string;
  name: string;
  description: string;
  emoji?: string;
  tags?: string[];
  prepTime?: string;
  cookTime?: string;
  difficulty?: string;
  mealType?: string;
  day?: string;
};

type Reaction = "up" | "neutral" | "down";

export default function PublicVotePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [voterName, setVoterName] = useState("");
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [votes, setVotes] = useState<Record<string, Reaction>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load session data
  const { data: session, isLoading, error } = trpc.voteSessions.getPublic.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  // Load existing votes for this voter
  const { data: existingVotes } = trpc.publicVotes.getForVoter.useQuery(
    { sessionId, voterName },
    { enabled: hasEnteredName && !!voterName }
  );

  // Vote mutation
  const voteMutation = trpc.publicVotes.upsert.useMutation();

  // Load voter name from localStorage on mount
  useEffect(() => {
    const storageKey = `fp_vote_${sessionId}_name`;
    const savedName = localStorage.getItem(storageKey);
    if (savedName) {
      setVoterName(savedName);
      setHasEnteredName(true);
    }
  }, [sessionId]);

  // Load existing votes when available
  useEffect(() => {
    if (existingVotes?.votes) {
      setVotes(existingVotes.votes);
    }
  }, [existingVotes]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim().length < 2) return;

    const trimmedName = nameInput.trim();
    setVoterName(trimmedName);
    setHasEnteredName(true);

    // Save to localStorage
    const storageKey = `fp_vote_${sessionId}_name`;
    localStorage.setItem(storageKey, trimmedName);
  };

  const handleVote = async (mealId: string, reaction: Reaction) => {
    if (!voterName || isSubmitting) return;

    // Optimistic update
    setVotes((prev) => ({ ...prev, [mealId]: reaction }));

    setIsSubmitting(true);
    try {
      await voteMutation.mutateAsync({
        sessionId,
        voterName,
        mealId,
        reaction,
      });
    } catch (error) {
      console.error("Vote failed:", error);
      // Revert on error
      setVotes((prev) => {
        const newVotes = { ...prev };
        delete newVotes[mealId];
        return newVotes;
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍽️</div>
          <p className="text-muted-foreground">Loading voting session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg border p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Session Not Found</h1>
          <p className="text-muted-foreground">
            This voting session doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  // Session closed/expired state
  if (!session.isOpen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg border p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Voting Closed</h1>
          <p className="text-muted-foreground mb-4">
            {session.isExpired
              ? "This voting session has expired."
              : "The meal plan manager has closed this voting session."}
          </p>
          <p className="text-sm text-muted-foreground">
            Expired: {new Date(session.expiresAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  // Max voters reached (and not an existing voter)
  if (session.currentVoterCount >= session.maxVoters && !hasEnteredName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg border p-8 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h1 className="text-2xl font-bold mb-2">Voting Completed</h1>
          <p className="text-muted-foreground">
            Maximum number of voters ({session.maxVoters}) has been reached.
          </p>
        </div>
      </div>
    );
  }

  // Name Gate Screen
  if (!hasEnteredName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg border p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🍽️</div>
            <h1 className="text-3xl font-bold mb-2">Who are you?</h1>
            <p className="text-muted-foreground">
              Enter your name to start voting on this week's meals
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name (e.g., Mom 👩, Dad 👨, Sarah 👧)"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                minLength={2}
                maxLength={32}
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                Min 2 characters. Emojis allowed! 😊
              </p>
            </div>

            <button
              type="submit"
              disabled={nameInput.trim().length < 2}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Continue 🍽️
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Week of {session.weekStartDate}</p>
            <p className="mt-1">
              {session.currentVoterCount} / {session.maxVoters} voters
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Voting Screen
  const meals = session.meals as Meal[];
  const votedCount = Object.keys(votes).length;
  const totalMeals = meals.length;
  const progressPercent = totalMeals > 0 ? (votedCount / totalMeals) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Vote on Meals</h1>
              <p className="text-sm text-muted-foreground">
                Hi, {voterName}! 👋
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {votedCount}/{totalMeals}
              </p>
              <p className="text-xs text-muted-foreground">meals voted</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meal Cards */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {meals.map((meal) => {
          const currentVote = votes[meal.recipeId];

          return (
            <div
              key={meal.recipeId}
              className="bg-card rounded-lg border p-4 shadow-sm"
            >
              {/* Meal Info */}
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  {meal.emoji && (
                    <div className="text-4xl flex-shrink-0">{meal.emoji}</div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{meal.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {meal.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {meal.mealType && (
                        <span className="px-2 py-1 bg-muted rounded">
                          {meal.mealType}
                        </span>
                      )}
                      {meal.day && (
                        <span className="px-2 py-1 bg-muted rounded capitalize">
                          {meal.day}
                        </span>
                      )}
                      {meal.prepTime && (
                        <span className="px-2 py-1 bg-muted rounded">
                          ⏱️ {meal.prepTime}
                        </span>
                      )}
                      {meal.difficulty && (
                        <span className="px-2 py-1 bg-muted rounded capitalize">
                          {meal.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Voting Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleVote(meal.recipeId, "up")}
                  disabled={isSubmitting}
                  className={`py-4 rounded-lg font-semibold text-lg transition-all ${
                    currentVote === "up"
                      ? "bg-green-500 text-white scale-105 shadow-lg"
                      : "bg-muted hover:bg-green-100 dark:hover:bg-green-900"
                  } disabled:opacity-50`}
                >
                  <div className="text-3xl mb-1">👍</div>
                  <div className="text-xs">Would eat</div>
                </button>

                <button
                  onClick={() => handleVote(meal.recipeId, "neutral")}
                  disabled={isSubmitting}
                  className={`py-4 rounded-lg font-semibold text-lg transition-all ${
                    currentVote === "neutral"
                      ? "bg-yellow-500 text-white scale-105 shadow-lg"
                      : "bg-muted hover:bg-yellow-100 dark:hover:bg-yellow-900"
                  } disabled:opacity-50`}
                >
                  <div className="text-3xl mb-1">😐</div>
                  <div className="text-xs">Okay</div>
                </button>

                <button
                  onClick={() => handleVote(meal.recipeId, "down")}
                  disabled={isSubmitting}
                  className={`py-4 rounded-lg font-semibold text-lg transition-all ${
                    currentVote === "down"
                      ? "bg-red-500 text-white scale-105 shadow-lg"
                      : "bg-muted hover:bg-red-100 dark:hover:bg-red-900"
                  } disabled:opacity-50`}
                >
                  <div className="text-3xl mb-1">👎</div>
                  <div className="text-xs">Please not</div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {votedCount === totalMeals && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-xl font-bold mb-1">Thanks, {voterName}!</h2>
            <p className="text-muted-foreground">
              Your votes are saved. You can change them anytime before voting closes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
