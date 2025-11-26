// lib/reviewInput.ts
'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client (service role key – never use in client components)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

// --- Types used by this helper ---

type EngagementRow = {
  id: string;
  company_name: string | null;
  leader_name: string | null;
  financial_year_end: string | null;
};

type StartStopKeepRow = {
  start: unknown;
  stop: unknown;
  keep: unknown;
};

type SwotRow = {
  strengths: unknown;
  weaknesses: unknown;
  opportunities: unknown;
  threats: unknown;
};

export type ReviewInputData = {
  engagement: {
    id: string;
    companyName: string | null;
    leaderName: string | null;
    financialYearEnd: string | null;
  } | null;
  startItems: string[];
  stopItems: string[];
  keepItems: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
};

// --- Helpers ---

/**
 * Normalises JSONB / text from Supabase into a string array.
 * - If value is an array → stringify each item.
 * - If value is a string → split on newlines.
 * - Otherwise → empty array.
 */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item == null) return '';
        return String(item).trim();
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

// --- Main loader ---

export async function getReviewInputData(
  engagementId: string
): Promise<ReviewInputData> {
  // Fetch engagement, SSK, SWOT in parallel
  const [engagementRes, sskRes, swotRes] = await Promise.all([
    supabase
      .from('engagements')
      .select('id, company_name, leader_name, financial_year_end')
      .eq('id', engagementId)
      .maybeSingle(),

    supabase
      .from('start_stop_keep')
      .select('start, stop, keep')
      .eq('engagement_id', engagementId),

    supabase
      .from('swot')
      .select('strengths, weaknesses, opportunities, threats')
      .eq('engagement_id', engagementId),
  ]);

  const engagementRow = (engagementRes.data ?? null) as EngagementRow | null;

  const engagement = engagementRow
    ? {
        id: engagementRow.id,
        companyName: engagementRow.company_name ?? null,
        leaderName: engagementRow.leader_name ?? null,
        financialYearEnd: engagementRow.financial_year_end ?? null,
      }
    : null;

  const sskRows = (sskRes.data ?? []) as StartStopKeepRow[];
  const swotRows = (swotRes.data ?? []) as SwotRow[];

  // Flatten all SSK rows for this engagement
  const startItems = sskRows.flatMap((row) => toStringArray(row.start));
  const stopItems = sskRows.flatMap((row) => toStringArray(row.stop));
  const keepItems = sskRows.flatMap((row) => toStringArray(row.keep));

  // Flatten all SWOT rows for this engagement
  const strengths = swotRows.flatMap((row) =>
    toStringArray(row.strengths)
  );
  const weaknesses = swotRows.flatMap((row) =>
    toStringArray(row.weaknesses)
  );
  const opportunities = swotRows.flatMap((row) =>
    toStringArray(row.opportunities)
  );
  const threats = swotRows.flatMap((row) =>
    toStringArray(row.threats)
  );

  return {
    engagement,
    startItems,
    stopItems,
    keepItems,
    strengths,
    weaknesses,
    opportunities,
    threats,
  };
}
