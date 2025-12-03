// app/EngagementList.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CopyLinkButton from './CopyLinkButton';

type Engagement = {
  id: string;
  company_name: string;
  leader_name: string;
  financial_year_end: string | null;
  engagement_name: string | null;
  created_at: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function EngagementList() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEngagements() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/engagements', {
          method: 'GET',
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load engagements');
        }

        const data = await res.json();
        if (!isMounted) return;

        setEngagements(data.engagements || []);
      } catch (err: any) {
        console.error('Error loading engagements', err);
        if (isMounted) {
          setError(err.message || 'Unable to load engagements.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEngagements();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Existing engagements
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Open an engagement to continue work or copy the link to resend to the leader.
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-600">
          Loading engagements…
        </p>
      )}

      {error && !loading && (
        <p className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && engagements.length === 0 && (
        <p className="text-sm text-slate-600">
          No engagements found yet. Create your first engagement above.
        </p>
      )}

      {!loading && !error && engagements.length > 0 && (
        <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          {engagements.map((engagement) => {
            const engagementLabel =
              engagement.engagement_name?.trim() || 'Untitled engagement';

            return (
              <div
                key={engagement.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {engagement.company_name}
                  </p>
                  <p className="text-xs text-slate-700">
                    Engagement: {engagementLabel}
                  </p>
                  <p className="text-xs text-slate-600">
                    Leader: {engagement.leader_name || '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Financial year end: {formatDate(engagement.financial_year_end)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Created: {formatDate(engagement.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/engagement/${engagement.id}`}
                    className="inline-flex items-center justify-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    Open engagement
                  </Link>

                  <CopyLinkButton path={`/engagement/${engagement.id}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
