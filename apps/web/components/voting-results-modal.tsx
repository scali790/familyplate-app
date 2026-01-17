'use client';

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

type VotingResultsModalProps = {
  sessionId: string;
  shareUrl: string;
  familyName?: string | null;
  weekStartDate: string;
  onClose: () => void;
  onGenerateShoppingList?: () => void;
};

export default function VotingResultsModal({
  sessionId,
  shareUrl,
  familyName,
  weekStartDate,
  onClose,
  onGenerateShoppingList,
}: VotingResultsModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "voters">("summary");
  const [copied, setCopied] = useState(false);

  // Fetch results
  const { data: results, refetch } = trpc.voteSessions.getResults.useQuery(
    { sessionId },
    { refetchInterval: 5000 } // Auto-refresh every 5s
  );

  // Mutations
  const closeSessionMutation = trpc.voteSessions.close.useMutation();
  const resetVotesMutation = trpc.voteSessions.reset.useMutation();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetVotes = async () => {
    if (!confirm("Are you sure you want to delete all votes? This cannot be undone.")) return;
    try {
      await resetVotesMutation.mutateAsync({ sessionId });
      refetch();
    } catch (err) {
      alert("Failed to reset votes");
    }
  };

  const handleCloseSession = async () => {
    if (!confirm("Are you sure you want to close this voting session? Voters will no longer be able to vote.")) return;
    try {
      await closeSessionMutation.mutateAsync({ sessionId });
      onClose();
    } catch (err) {
      alert("Failed to close session");
    }
  };

  if (!results) {
    return (
      <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-muted">Loading results...</p>
        </div>
      </div>
    );
  }

  const { status, closedReason, closedAt, mealAggregates, voterBreakdown, totalVoters } = results;
  const mealCount = Object.keys(mealAggregates).length;
  const isOpen = status === 'open';

  // Find winner (highest score)
  const winner = Object.entries(mealAggregates).reduce((max, [id, stats]) => {
    return stats.score > (max?.stats.score || -Infinity) ? { id, stats } : max;
  }, null as { id: string; stats: typeof mealAggregates[string] } | null);

  // Sort meals by score (highest first)
  const sortedMeals = Object.entries(mealAggregates).sort(([, a], [, b]) => b.score - a.score);

  // Determine if voting is incomplete
  const expectedVoters = 4; // TODO: Get from preferences
  const isIncomplete = totalVoters < expectedVoters;

  // Smart CTA
  const getSmartCTA = () => {
    if (isOpen && isIncomplete) {
      return {
        label: '📢 Remind family to vote',
        description: `${expectedVoters - totalVoters} ${expectedVoters - totalVoters === 1 ? 'person hasn\'t' : 'people haven\'t'} voted yet`,
        action: handleCopyLink,
        variant: 'default' as const,
      };
    }

    if (!isOpen && onGenerateShoppingList) {
      return {
        label: '🛒 Generate shopping list',
        description: 'You\'re ready to shop for the week',
        action: onGenerateShoppingList,
        variant: 'default' as const,
      };
    }

    return null;
  };

  const smartCTA = getSmartCTA();

  const getStatusBadge = () => {
    if (isOpen) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Open
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface text-muted rounded-full text-sm font-medium">
        <span className="w-2 h-2 bg-muted rounded-full"></span>
        Closed
      </span>
    );
  };

  const getClosedReasonText = () => {
    if (closedReason === 'meal_plan_changed') return 'Closed because meal plan changed';
    if (closedReason === 'manual') return 'Closed manually';
    if (closedReason === 'expired') return 'Closed due to expiration';
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground">🗳️ Voting Results</h2>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted">
              {totalVoters} voter{totalVoters !== 1 ? "s" : ""} • {mealCount} meal{mealCount !== 1 ? "s" : ""}
            </p>
            {!isOpen && getClosedReasonText() && (
              <p className="text-xs text-muted mt-1">
                {getClosedReasonText()}
                {closedAt && ` on ${new Date(closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground transition-colors"
          >
            <span className="text-3xl leading-none">×</span>
          </button>
        </div>

        {/* Smart CTA Banner */}
        {smartCTA && (
          <div className="px-6 py-4 bg-primary/10 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-foreground">{smartCTA.description}</p>
              </div>
              <Button
                onClick={smartCTA.action}
                variant={smartCTA.variant}
                size="lg"
              >
                {smartCTA.label}
              </Button>
            </div>
          </div>
        )}

        {/* Family Info */}
        <div className="px-6 py-4 bg-surface border-b border-border">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground mb-1">
            <span>👨‍👩‍👧‍👦</span>
            <span>{familyName ? `This week at the ${familyName} table` : "Your Family"}</span>
          </div>
          <p className="text-sm text-muted">
            Week of {new Date(weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Share Link */}
        {isOpen && (
          <div className="px-6 py-4 bg-surface border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  📋 Share voting link with your family
                </p>
                <p className="text-xs text-muted">
                  Click to copy the link to clipboard
                </p>
              </div>
              <Button
                onClick={handleCopyLink}
                variant="default"
                size="lg"
              >
                {copied ? (
                  <>
                    <span className="mr-2">✓</span>
                    Copied!
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔗</span>
                    Share Link
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border bg-surface">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "summary"
                ? "bg-background text-primary border-b-2 border-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            📊 Meal Summary
          </button>
          <button
            onClick={() => setActiveTab("voters")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "voters"
                ? "bg-background text-primary border-b-2 border-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            👥 Voter Breakdown
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {totalVoters === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl font-semibold text-foreground mb-2">No votes yet</p>
              <p className="text-muted">Share the link above to start collecting votes!</p>
            </div>
          ) : activeTab === "summary" ? (
            <div className="space-y-4">
              {sortedMeals.map(([mealId, stats], index) => {
                const isWinner = winner?.id === mealId && stats.score > 0;
                const scoreColor =
                  stats.score > 0 ? "text-green-600 dark:text-green-400" : 
                  stats.score < 0 ? "text-red-600 dark:text-red-400" : 
                  "text-muted";
                const barColor =
                  stats.score > 0 ? "bg-green-500" : 
                  stats.score < 0 ? "bg-red-500" : 
                  "bg-muted";

                return (
                  <div 
                    key={mealId} 
                    className={`rounded-2xl p-5 border-2 transition-all ${
                      isWinner 
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-400 dark:border-yellow-600 shadow-lg' 
                        : 'bg-surface border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground text-lg">{stats.name}</h3>
                          {isWinner && (
                            <span className="px-2 py-0.5 bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 text-xs font-bold rounded-full">
                              🏆 WINNER
                            </span>
                          )}
                          {index === 0 && !isWinner && stats.score > 0 && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                              Top Pick
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-3xl font-bold ${scoreColor}`}>
                        {stats.score > 0 ? "+" : ""}
                        {stats.score}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👍</span>
                        <span className="font-semibold text-foreground">{stats.up}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">😐</span>
                        <span className="font-semibold text-foreground">{stats.neutral}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👎</span>
                        <span className="font-semibold text-foreground">{stats.down}</span>
                      </div>
                    </div>

                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all`}
                        style={{ width: `${Math.min(100, Math.abs(stats.score) * 20)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface">
                    <th className="sticky left-0 z-10 bg-surface px-4 py-3 text-left font-semibold text-foreground border-b-2 border-border">
                      Voter
                    </th>
                    {sortedMeals.map(([mealId, stats]) => (
                      <th key={mealId} className="px-3 py-3 text-center font-medium text-foreground border-b-2 border-border min-w-[120px]">
                        <div className="text-sm">{stats.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(voterBreakdown).map(([voterName, votes]) => {
                    // Create meal lookup for this voter
                    const voterVotes: Record<string, string> = {};
                    votes.forEach((vote) => {
                      voterVotes[vote.mealId] = vote.reaction;
                    });

                    return (
                      <tr key={voterName} className="hover:bg-surface/50 transition-colors">
                        <td className="sticky left-0 z-10 bg-background hover:bg-surface/50 px-4 py-3 font-medium text-foreground border-b border-border">
                          <div className="flex items-center gap-2">
                            <span>👤</span>
                            <span>{voterName}</span>
                          </div>
                        </td>
                        {sortedMeals.map(([mealId]) => (
                          <td key={mealId} className="px-3 py-3 text-center border-b border-border">
                            <span className="text-3xl">
                              {voterVotes[mealId] === "up" ? "👍" : 
                               voterVotes[mealId] === "down" ? "👎" : 
                               voterVotes[mealId] === "neutral" ? "😐" : 
                               <span className="text-muted text-xl">—</span>}
                            </span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-border bg-surface">
          <Button
            onClick={handleResetVotes}
            disabled={resetVotesMutation.isPending}
            variant="outline"
            size="sm"
          >
            Reset Votes
          </Button>
          <Button
            onClick={handleCloseSession}
            disabled={closeSessionMutation.isPending || !isOpen}
            variant="destructive"
            size="sm"
            title={!isOpen ? "Session is already closed" : ""}
          >
            Close Session
          </Button>
          <Button
            onClick={onClose}
            variant="default"
            size="lg"
            className="ml-auto"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
