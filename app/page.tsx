// app/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import EngagementList from './EngagementList';

export default function HomePage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [financialYearEnd, setFinancialYearEnd] = useState('');
  const [engagementName, setEngagementName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) return setError('Company name is required');
    if (!leaderName.trim()) return setError('Leader name is required');
    if (!financialYearEnd) return setError('Financial year end is required');

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/engagements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          leaderName,
          financialYearEnd,
          engagementName,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create engagement');
      }

      const data = await res.json();
      const engagementId = data.engagementId as string;

      router.push(`/engagement/${engagementId}`);
    } catch (err: any) {
      console.error('Error creating engagement', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Trellis – Coach Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Create a new engagement or open an existing one to continue your strategic planning work.
          </p>
        </header>

        {/* Create New Engagement Card */}
        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Create new engagement
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Set up a new company and leader to start a Trellis strategic planning engagement.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Acme Windows & Doors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Leader name
              </label>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Financial year end
              </label>
              <input
                type="date"
                value={financialYearEnd}
                onChange={(e) => setFinancialYearEnd(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Used to align planning with your financial reporting cycle.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Engagement name
              </label>
              <input
                type="text"
                value={engagementName}
                onChange={(e) => setEngagementName(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="e.g. FY25 Annual Planning, Q1 Reset, Strategy Refresh"
              />
              <p className="mt-1 text-xs text-slate-500">
                Helps distinguish multiple engagements for the same company.
              </p>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating…' : 'Create engagement'}
            </button>
          </form>
        </section>

        {/* Existing Engagements List */}
        <section>
          <EngagementList />
        </section>
      </div>
    </main>
  );
}
