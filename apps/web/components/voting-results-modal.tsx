"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

type VotingResultsModalProps = {
  sessionId: string;
  shareUrl: string;
  onClose: () => void;
};

type ViewMode = "summary" | "breakdown";

export function VotingResultsModal({ sessionId, shareUrl, onClose }: VotingResultsModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("summary");
  const [showCopied, setShowCopied] = useState(false);

  const utils = trpc.useUtils();

  // Fetch results
  const { data: results, isLoading } = trpc.voteSessions.getResults.useQuery(
    { sessionId },
    { refetchInterval: 5000 } // Poll every 5 seconds
  );

  // Mutations
  const closeMutation = trpc.voteSessions.close.useMutation({
    onSuccess: () => {
      utils.voteSessions.getResults.invalidate({ sessionId });
    },
  });

  const resetMutation = trpc.voteSessions.reset.useMutation({
    onSuccess: () => {
      utils.voteSessions.getResults.invalidate({ sessionId });
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleClose = () => {
    if (confirm("Close this voting session? Voters will no longer be able to vote.")) {
      closeMutation.mutate({ sessionId });
    }
  };

  const handleReset = () => {
    if (confirm("Delete all votes? This cannot be undone.")) {
      resetMutation.mutate({ sessionId });
    }
  };

  const getReactionEmoji = (reaction: string) => {
    switch (reaction) {
      case "up":
        return "👍";
      case "neutral":
        return "😐";
      case "down":
        return "👎";
      default:
        return "❓";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Voting Results</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          {results && (
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total Voters: </span>
                <span className="font-semibold">{results.totalVoters}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Meals: </span>
                <span className="font-semibold">
                  {Object.keys(results.mealAggregates).length}
                </span>
              </div>
            </div>
          )}

          {/* Share Link */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-muted rounded text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90"
            >
              {showCopied ? "✓ Copied" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="px-6 pt-4 border-b">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("summary")}
              className={`px-4 py-2 rounded-t font-medium transition-colors ${
                viewMode === "summary"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Meal Summary
            </button>
            <button
              onClick={() => setViewMode("breakdown")}
              className={`px-4 py-2 rounded-t font-medium transition-colors ${
                viewMode === "breakdown"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Voter Breakdown
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              Loading results...
            </div>
          )}

          {!isLoading && results && viewMode === "summary" && (
            <div className="space-y-4">
              {Object.entries(results.mealAggregates).map(([mealId, stats]) => (
                <div key={mealId} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="font-medium">{mealId}</div>
                    <div
                      className={`text-2xl font-bold ${
                        stats.score > 0
                          ? "text-green-500"
                          : stats.score < 0
                          ? "text-red-500"
                          : "text-yellow-500"
                      }`}
                    >
                      {stats.score > 0 ? "+" : ""}
                      {stats.score}
                    </div>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👍</span>
                      <span className="font-semibold">{stats.up}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">😐</span>
                      <span className="font-semibold">{stats.neutral}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👎</span>
                      <span className="font-semibold">{stats.down}</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="mt-3 flex h-2 rounded-full overflow-hidden">
                    {stats.up > 0 && (
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${
                            (stats.up / (stats.up + stats.neutral + stats.down)) * 100
                          }%`,
                        }}
                      />
                    )}
                    {stats.neutral > 0 && (
                      <div
                        className="bg-yellow-500"
                        style={{
                          width: `${
                            (stats.neutral / (stats.up + stats.neutral + stats.down)) * 100
                          }%`,
                        }}
                      />
                    )}
                    {stats.down > 0 && (
                      <div
                        className="bg-red-500"
                        style={{
                          width: `${
                            (stats.down / (stats.up + stats.neutral + stats.down)) * 100
                          }%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {Object.keys(results.mealAggregates).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No votes yet. Share the link to start collecting votes!
                </div>
              )}
            </div>
          )}

          {!isLoading && results && viewMode === "breakdown" && (
            <div className="space-y-6">
              {Object.entries(results.voterBreakdown).map(([voterName, votes]) => (
                <div key={voterName} className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-lg">{voterName}</h3>
                  <div className="space-y-2">
                    {votes.map((vote, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{vote.mealId}</span>
                        <span className="text-2xl">{getReactionEmoji(vote.reaction)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(results.voterBreakdown).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No voters yet. Share the link to start collecting votes!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="px-4 py-2 bg-muted text-foreground rounded font-medium hover:bg-muted/80 disabled:opacity-50"
          >
            {resetMutation.isPending ? "Resetting..." : "Reset Votes"}
          </button>
          <button
            onClick={handleClose}
            disabled={closeMutation.isPending}
            className="px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {closeMutation.isPending ? "Closing..." : "Close Session"}
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground rounded font-medium hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
