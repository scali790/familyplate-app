"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

type VotingResultsModalProps = {
  sessionId: string;
  shareUrl: string;
  familyName?: string | null;
  weekStartDate: string;
  onClose: () => void;
};

export default function VotingResultsModal({
  sessionId,
  shareUrl,
  familyName,
  weekStartDate,
  onClose,
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const { mealAggregates, voterBreakdown, totalVoters } = results;
  const mealCount = Object.keys(mealAggregates).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-amber-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Voting Results</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalVoters} voter{totalVoters !== 1 ? "s" : ""} • {mealCount} meal{mealCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Family Info */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-1">
            <span>👨‍👩‍👧‍👦</span>
            <span>{familyName || "Your Family"}</span>
          </div>
          <p className="text-sm text-gray-600">
            Week of {new Date(weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Share Link */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                📋 Share voting link with your family
              </p>
              <p className="text-xs text-gray-600">
                Click the button to copy the link to clipboard
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "summary"
                ? "bg-white text-orange-600 border-b-2 border-orange-500"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📊 Meal Summary
          </button>
          <button
            onClick={() => setActiveTab("voters")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "voters"
                ? "bg-white text-orange-600 border-b-2 border-orange-500"
                : "text-gray-600 hover:text-gray-800"
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
              <p className="text-xl font-semibold text-gray-700 mb-2">No votes yet</p>
              <p className="text-gray-500">Share the link above to start collecting votes!</p>
            </div>
          ) : activeTab === "summary" ? (
            <div className="space-y-4">
              {Object.entries(mealAggregates).map(([mealId, stats]) => {
                const scoreColor =
                  stats.score > 0 ? "text-green-600" : stats.score < 0 ? "text-red-600" : "text-gray-600";
                const barColor =
                  stats.score > 0 ? "bg-green-500" : stats.score < 0 ? "bg-red-500" : "bg-gray-400";

                return (
                  <div key={mealId} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{stats.name}</h3>
                      </div>
                      <div className={`text-2xl font-bold ${scoreColor}`}>
                        {stats.score > 0 ? "+" : ""}
                        {stats.score}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👍</span>
                        <span className="font-semibold text-gray-700">{stats.up}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">😐</span>
                        <span className="font-semibold text-gray-700">{stats.neutral}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👎</span>
                        <span className="font-semibold text-gray-700">{stats.down}</span>
                      </div>
                    </div>

                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
            <div className="space-y-6">
              {Object.entries(voterBreakdown).map(([voterName, votes]) => (
                <div key={voterName} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 text-lg mb-3 flex items-center gap-2">
                    <span>👤</span>
                    <span>{voterName}</span>
                  </h3>
                  <div className="space-y-2">
                    {votes.map((vote, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{vote.mealId}</span>
                        <span className="text-2xl">
                          {vote.reaction === "up" ? "👍" : vote.reaction === "down" ? "👎" : "😐"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleResetVotes}
            disabled={resetVotesMutation.isPending}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Reset Votes
          </button>
          <button
            onClick={handleCloseSession}
            disabled={closeSessionMutation.isPending}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Close Session
          </button>
          <button
            onClick={onClose}
            className="ml-auto px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
