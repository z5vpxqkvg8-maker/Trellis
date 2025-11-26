// app/engagement/[engagementId]/strategy-ideation/page.tsx

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import StrategyIdeationForm from './StrategyIdeationForm';

type Params = { engagementId: string };
type PageProps = { params: Params | Promise<Params> };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

type EngagementHeader = {
  company_name: string;
  leader_name: string;
  financial_year_end: string | null;
};

type VisionAndGoalsRow = {
  purpose: string | null;
  three_year_vision: string | null;
  annual_goals: any | null; // jsonb
  core_kpis: any | null; // jsonb
  playing_rules: string | null;
  bhag: string | null;
};

type StrategyIdeationRow = {
  anchors: any;
  growth_market: any;
  growth_product: any;
  operations: any;
  people: any;
  finance: any;
};

export const dynamic = 'force-dynamic';

function extractNotes(field: any): string {
  if (!field) return '';
  if (typeof field === 'object' && field !== null && 'notes' in field) {
    return String(field.notes ?? '');
  }
  return '';
}

function renderJsonField(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    // Try to render arrays nicely (strings or simple objects)
    const lines = value.map((item) => {
      if (item == null) return '';
      if (typeof item === 'string') return item;
      if (typeof item === 'object') {
        // common pattern: { text: '...' }
        if ('text' in item && typeof (item as any).text === 'string') {
          return (item as any).text;
        }
        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      }
      return String(item);
    });
    return lines.filter(Boolean).join('\n');
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default async function StrategyIdeationPage({ params }: PageProps) {
  const rawParams = params instanceof Promise ? await params : params;
  const { engagementId } = rawParams;

  const [
    { data: engagement },
    { data: visionRow },
    { data: strategyRow },
    { data: sskRows },
    { data: swotRows },
  ] = await Promise.all([
    supabase
      .from('engagements')
      .select('company_name, leader_name, financial_year_end')
      .eq('id', engagementId)
      .maybeSingle<EngagementHeader>(),
    supabase
      .from('vision_and_goals')
      .select(
        `
        purpose,
        three_year_vision,
        annual_goals,
        core_kpis,
        playing_rules,
        bhag
      `
      )
      .eq('engagement_id', engagementId)
      .maybeSingle<VisionAndGoalsRow>(),
    supabase
      .from('strategy_ideation')
      .select('anchors, growth_market, growth_product, operations, people, finance')
      .eq('engagement_id', engagementId)
      .maybeSingle<StrategyIdeationRow>(),
    supabase
      .from('start_stop_keep_responses')
      .select('id')
      .eq('engagement_id', engagementId),
    supabase.from('swot').select('id').eq('engagement_id', engagementId),
  ]);

  const sskCount = sskRows?.length ?? 0;
  const swotCount = swotRows?.length ?? 0;

  const vision = (visionRow as VisionAndGoalsRow | null) ?? null;
  const strategy = (strategyRow as StrategyIdeationRow | null) ?? null;

  const companyName = engagement?.company_name ?? 'your company';

  const initialData = {
    anchorsNotes: extractNotes(strategy?.anchors),
    domainNotes: {
      growth_market: extractNotes(strategy?.growth_market),
      growth_product: extractNotes(strategy?.growth_product),
      operations: extractNotes(strategy?.operations),
      people: extractNotes(strategy?.people),
      finance: extractNotes(strategy?.finance),
    },
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Phase 3 · Strategy Ideation
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              Strategy ideation for {companyName}
            </h1>
            {engagement && (
              <p className="mt-2 text-sm text-slate-600">
                Leader:{' '}
                <span className="font-medium">{engagement.leader_name}</span>
                {engagement.financial_year_end && (
                  <>
                    {' · FY End: '}
                    <span className="font-medium">
                      {engagement.financial_year_end}
                    </span>
                  </>
                )}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Use this page as a light, conversational brainstorm. Respond to
              the prompts in each domain – you can type or dictate – and this
              content can later feed AI-generated strategy options.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Inputs ready: Vision{' '}
              <span className="font-semibold">
                {vision ? 'Yes' : 'No'}
              </span>{' '}
              · SSK responses:{' '}
              <span className="font-semibold">{sskCount}</span> · SWOT entries:{' '}
              <span className="font-semibold">{swotCount}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/engagement/${engagementId}`}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Back to Planning Dashboard
            </Link>
            <Link
              href={`/engagement/${engagementId}/review-input`}
              className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
            >
              View input summary
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Left: Ideation form (anchors + 5 text areas) */}
          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <StrategyIdeationForm
              engagementId={engagementId}
              initialData={initialData}
            />
          </section>

          {/* Right: Vision recap */}
          <aside className="space-y-4">
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">
                Strategic anchors (from Vision & Goals)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                A quick recap to keep everyone pointed at the same future while
                you ideate.
              </p>

              {vision ? (
                <dl className="mt-3 space-y-2">
                  {vision.purpose && (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Purpose
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-xs text-slate-700">
                        {vision.purpose}
                      </dd>
                    </div>
                  )}
                  {vision.bhag && (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        BHAG
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-xs text-slate-700">
                        {vision.bhag}
                      </dd>
                    </div>
                  )}
                  {vision.three_year_vision && (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        3-year vision
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-xs text-slate-700">
                        {vision.three_year_vision}
                      </dd>
                    </div>
                  )}
                  {vision.playing_rules && (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Playing rules
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-xs text-slate-700">
                        {vision.playing_rules}
                      </dd>
                    </div>
                  )}
                  {vision.annual_goals && (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        12-month goals
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-xs text-slate-700">
                        {renderJsonField(vision.annual_goals)}
                      </dd>
                    </div>
                  )}
                  {vision.core_kpis && (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Core KPIs
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-xs text-slate-700">
                        {renderJsonField(vision.core_kpis)}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  No Vision & Goals have been captured yet for this engagement.
                  You can still brainstorm ideas here, but you’ll get better
                  outcomes if Vision & Goals are in place.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
