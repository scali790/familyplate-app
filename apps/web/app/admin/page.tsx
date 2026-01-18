'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type TimeRange = '7d' | '30d' | '90d';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
};

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const { data: overview, isLoading, error } = trpc.admin.kpi.getOverview.useQuery({ range: timeRange });
  const { data: topErrors } = trpc.admin.errors.getTop.useQuery({ range: timeRange, limit: 5 });

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted mb-6">
              {error.message || 'You do not have permission to access this page.'}
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !overview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📊</div>
          <p className="text-muted">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const { latest, average, total } = overview;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                <span className="text-xl font-bold text-foreground">FamilyPlate</span>
              </Link>
              <span className="text-muted">|</span>
              <span className="text-lg text-foreground">Admin Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Back to App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Time Range Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">KPI Overview</h1>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {TIME_RANGE_LABELS[range]}
                </Button>
              ))}
            </div>
          </div>

          {/* Growth/Usage KPIs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">📈 Growth & Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="DAU"
                value={latest?.dau || 0}
                subtitle={`Avg: ${average?.dau || 0}`}
                icon="👥"
              />
              <KpiCard
                title="WAU"
                value={latest?.wau || 0}
                subtitle={`Avg: ${average?.wau || 0}`}
                icon="📅"
              />
              <KpiCard
                title="MAU"
                value={latest?.mau || 0}
                subtitle={`Avg: ${average?.mau || 0}`}
                icon="🗓️"
              />
              <KpiCard
                title="New Users"
                value={latest?.newUsers || 0}
                subtitle={`Total: ${total?.newUsers || 0}`}
                icon="✨"
              />
            </div>
          </div>

          {/* Core Product KPIs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">🍽️ Core Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Meal Plans Generated"
                value={latest?.mealPlansGenerated || 0}
                subtitle={`Total: ${total?.mealPlansGenerated || 0}`}
                icon="🪄"
              />
              <KpiCard
                title="Meals Planned"
                value={latest?.mealsPlanned || 0}
                subtitle={`Total: ${total?.mealsPlanned || 0}`}
                icon="🍴"
              />
              <KpiCard
                title="Cook CTA Usage"
                value={latest?.cookCtaUsage || 0}
                subtitle={`Total: ${total?.cookCtaUsage || 0}`}
                icon="👨‍🍳"
              />
              <KpiCard
                title="Activation Rate"
                value={`${latest?.activationRate.toFixed(1) || 0}%`}
                subtitle={`Avg: ${average?.activationRate.toFixed(1) || 0}%`}
                icon="🎯"
              />
            </div>
          </div>

          {/* Voting/Quality KPIs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">👍 Voting & Quality</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard
                title="Votes Cast"
                value={latest?.votesCast || 0}
                subtitle={`Total: ${total?.votesCast || 0}`}
                icon="🗳️"
              />
              <KpiCard
                title="Voting Participation"
                value={`${latest?.votingParticipation.toFixed(1) || 0}%`}
                subtitle={`Avg: ${average?.votingParticipation.toFixed(1) || 0}%`}
                icon="📊"
              />
              <KpiCard
                title="Positive Vote Ratio"
                value={`${latest?.positiveVoteRatio.toFixed(1) || 0}%`}
                subtitle={`Avg: ${average?.positiveVoteRatio.toFixed(1) || 0}%`}
                icon="💚"
              />
            </div>
          </div>

          {/* Shopping List KPIs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">🛒 Shopping List</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard
                title="Opens"
                value={latest?.shoppingListOpens || 0}
                subtitle={`Total: ${total?.shoppingListOpens || 0}`}
                icon="👀"
              />
              <KpiCard
                title="Generated"
                value={latest?.shoppingListGenerated || 0}
                subtitle={`Total: ${total?.shoppingListGenerated || 0}`}
                icon="📝"
              />
              <KpiCard
                title="Exported"
                value={latest?.shoppingListExported || 0}
                subtitle={`Total: ${total?.shoppingListExported || 0}`}
                icon="📤"
              />
            </div>
          </div>

          {/* Reliability KPIs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">⚡ Reliability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard
                title="Error Rate"
                value={`${latest?.errorRate.toFixed(2) || 0}%`}
                subtitle={`Avg: ${average?.errorRate.toFixed(2) || 0}%`}
                icon="⚠️"
                alert={latest ? latest.errorRate > 5 : false}
              />
              <KpiCard
                title="AI Tokens In"
                value={latest?.tokensIn.toLocaleString() || 0}
                subtitle={`Total: ${total?.tokensIn.toLocaleString() || 0}`}
                icon="🤖"
              />
              <KpiCard
                title="AI Tokens Out"
                value={latest?.tokensOut.toLocaleString() || 0}
                subtitle={`Total: ${total?.tokensOut.toLocaleString() || 0}`}
                icon="💬"
              />
            </div>
          </div>

          {/* Top Errors */}
          {topErrors && topErrors.topErrors.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">🐛 Top Errors</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {topErrors.topErrors.map((error, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-destructive">{error.count}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground break-words">{error.message}</p>
                          <p className="text-xs text-muted mt-1">
                            Last occurred: {new Date(error.lastOccurred).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  alert?: boolean;
};

function KpiCard({ title, value, subtitle, icon, alert }: KpiCardProps) {
  return (
    <Card className={alert ? 'border-2 border-destructive' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="text-3xl">{icon}</div>
          {alert && <div className="text-destructive text-xs font-bold">⚠️ HIGH</div>}
        </div>
        <h3 className="text-sm font-medium text-muted mb-1">{title}</h3>
        <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
        <p className="text-xs text-muted">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
