"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";

type Meal = {
  recipeId: string;
  name: string;
  emoji: string;
  description?: string;
  tags?: string[];
  mealType?: string;
  day?: string;
};

type Reaction = "up" | "neutral" | "down";

export default function VotePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [voterName, setVoterName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [currentMealIndex, setCurrentMealIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, Reaction>>({});
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

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
      setVotes(existingVotes.votes as Record<string, Reaction>);
    }
  }, [existingVotes]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim().length < 2) return;

    const sanitizedName = nameInput.trim();
    setVoterName(sanitizedName);
    setHasEnteredName(true);

    // Save to localStorage
    const storageKey = `fp_vote_${sessionId}_name`;
    localStorage.setItem(storageKey, sanitizedName);
  };

  const handleVote = async (reaction: Reaction) => {
    if (!meals || currentMealIndex >= meals.length) return;

    const meal = meals[currentMealIndex];
    
    // Optimistic update
    setVotes((prev) => ({ ...prev, [meal.recipeId]: reaction }));

    // Trigger swipe animation
    if (reaction === "up") setSwipeDirection("right");
    if (reaction === "down") setSwipeDirection("left");

    // Save vote
    try {
      await voteMutation.mutateAsync({
        sessionId,
        voterName,
        mealId: meal.recipeId,
        reaction,
      });
    } catch (err) {
      console.error("Failed to save vote:", err);
    }

    // Advance to next meal after animation
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentMealIndex((prev) => prev + 1);
    }, 300);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🍽️</div>
          <p className="text-lg text-gray-600">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Oops!</h1>
          <p className="text-gray-600">This voting session could not be found.</p>
        </div>
      </div>
    );
  }

  // Session closed
  if (!session.isOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Voting Closed</h1>
          <p className="text-gray-600">
            {session.isExpired
              ? "This voting session has expired."
              : "The meal plan manager has closed this voting session."}
          </p>
        </div>
      </div>
    );
  }

  // Max voters reached
  if (session.currentVoterCount >= session.maxVoters && !hasEnteredName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Voting Completed</h1>
          <p className="text-gray-600">
            Maximum number of voters ({session.maxVoters}) has been reached.
          </p>
        </div>
      </div>
    );
  }

  // Name Gate
  if (!hasEnteredName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Welcome!</h1>
            <p className="text-gray-600">Who are you?</p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-orange-400 focus:outline-none transition-colors"
              minLength={2}
              maxLength={32}
              required
              autoFocus
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
            >
              Start Voting
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {session.currentVoterCount} / {session.maxVoters} voters
          </div>
        </div>
      </div>
    );
  }

  // Parse meals
  const meals: Meal[] = Array.isArray(session.meals)
    ? session.meals
    : typeof session.meals === "string"
    ? JSON.parse(session.meals)
    : [];

  // Voting Complete
  if (currentMealIndex >= meals.length) {
    const votedCount = Object.keys(votes).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Emojis */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="text-6xl absolute top-10 left-10 animate-bounce" style={{ animationDelay: "0s" }}>🎉</div>
          <div className="text-6xl absolute top-20 right-20 animate-bounce" style={{ animationDelay: "0.2s" }}>🎊</div>
          <div className="text-6xl absolute bottom-20 left-20 animate-bounce" style={{ animationDelay: "0.4s" }}>✨</div>
          <div className="text-6xl absolute bottom-10 right-10 animate-bounce" style={{ animationDelay: "0.6s" }}>🌟</div>
          <div className="text-5xl absolute top-1/3 left-1/4 animate-pulse" style={{ animationDelay: "0.3s" }}>💚</div>
          <div className="text-5xl absolute top-2/3 right-1/4 animate-pulse" style={{ animationDelay: "0.5s" }}>🎈</div>
        </div>

        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center relative z-10 animate-[scale-in_0.5s_ease-out]">
          <div className="text-8xl mb-6 animate-[bounce_1s_ease-in-out_3]" style={{ animationDelay: "0.2s" }}>🎉</div>
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 animate-[fade-in_0.6s_ease-out]">
            All Done!
          </h1>
          <p className="text-2xl text-gray-700 mb-2 font-semibold animate-[fade-in_0.8s_ease-out]">
            Thanks for voting, {voterName}! 🙌
          </p>
          <p className="text-lg text-gray-600 mb-6 animate-[fade-in_1s_ease-out]">
            You voted on {votedCount} meal{votedCount !== 1 ? "s" : ""}.
          </p>
          
          <div className="space-y-3 animate-[fade-in_1.2s_ease-out]">
            <button
              onClick={() => setCurrentMealIndex(0)}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Review & Change Votes
            </button>
            <p className="text-sm text-gray-500">
              The meal planner will see your votes! 👨‍🍳
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes scale-in {
            from {
              transform: scale(0.8);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Current meal
  const currentMeal = meals[currentMealIndex];
  const votedCount = Object.keys(votes).length;
  const progressPercent = (votedCount / meals.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="text-center mb-3">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <span>👨‍👩‍👧‍👦</span>
              <span>{session.familyName || "Your Family"}</span>
            </h1>
            <p className="text-sm text-gray-500">Week of {new Date(session.weekStartDate).toLocaleDateString()}</p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">{currentMeal.mealType || "Meals"}</span>
              <span>{votedCount} / {meals.length} voted</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Meal Card */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div
          className={`bg-white rounded-3xl shadow-2xl p-8 transition-all duration-300 ${
            swipeDirection === "left" ? "-translate-x-full opacity-0" : ""
          } ${swipeDirection === "right" ? "translate-x-full opacity-0" : ""}`}
        >
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">{currentMeal.emoji}</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{currentMeal.name}</h2>
            {currentMeal.description && (
              <p className="text-gray-600 text-lg">{currentMeal.description}</p>
            )}
          </div>

          {currentMeal.tags && currentMeal.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {currentMeal.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Vote Buttons */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <button
              onClick={() => handleVote("down")}
              className="flex flex-col items-center justify-center py-6 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-5xl mb-2">👎</span>
              <span className="text-sm font-semibold text-red-700">No thanks</span>
            </button>

            <button
              onClick={() => handleVote("neutral")}
              className="flex flex-col items-center justify-center py-6 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-5xl mb-2">😐</span>
              <span className="text-sm font-semibold text-gray-700">Okay</span>
            </button>

            <button
              onClick={() => handleVote("up")}
              className="flex flex-col items-center justify-center py-6 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-5xl mb-2">👍</span>
              <span className="text-sm font-semibold text-green-700">Would eat!</span>
            </button>
          </div>
        </div>

        {/* Skip Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentMealIndex((prev) => prev + 1)}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}
