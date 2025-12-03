// app/engagement/[engagementId]/strategy-ideation/page.tsx

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import StrategyIdeationForm from './StrategyIdeationForm';
import type { StrategyIdeationItem } from '../../../../types/strategy';

type Params = { engagementId: string };

type PageSearchParams = {
  tab?: string;
};

type PageProps = {
  params: Params | Promise<Params>;
  searchParams?: PageSearchParams | Promise<PageSearchParams>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

type VisionRow = {
  purpose: string | null;
  bhag: string | null;
  playing_rules: string | null;
  three_year_vision: string | null;
  annual_goals: string | null;
  core_kpis: string | null;
};

function extractNotes(field: any): string {
  if (!field) return '';
  if (typeof field === 'object' && typeof field.notes === 'string') {
    return field.notes;
  }
  return '';
}

export default async function StrategyIdeationPage(props: PageProps) {
  const resolvedParams = await Promise.resolve(props.params);
  const resolvedSearchParams = await Promise.resolve(props.searchParams ?? {});
  const { engagementId } = resolvedParams;
  const activeTab = resolvedSearchParams.tab === 'cards' ? 'cards' : 'brainstorm';

  // Load all required data in parallel
  const [
    { data: engagement, error: engagementError },
    { data: strategy, error: strategyError },
    { data: items, error: itemsError },
    { data: vision, error: visionError },
    { count: sskCount, error: sskError },
    { count: swotCount, error: swotError },
  ] = await Promise.all([
    supabase
      .from('engagements')
      .select('id, company_name, leader_name, financial_year_end')
      .eq('id', engagementId)
      .single(),
    supabase
      .from('strategy_ideation')
      .select('anchors, growth_market, growth_product, operations, people, finance')
      .eq('engagement_id', engagementId)
      .maybeSingle(),
    supabase
      .from('strategy_ideation_items')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false }),
    supabase
      .from('vision_and_goals')
      .select(
        'purpose, bhag, playing_rules, three_year_vision, annual_goals, core_kpis'
      )
      .eq('engagement_id', engagementId)
      .maybeSingle<VisionRow>(),
    supabase
      .from('start_stop_keep_responses')
      .select('id', { count: 'exact', head: true })
      .eq('engagement_id', engagementId),
    supabase
      .from('swot')
      .select('id', { count: 'exact', head: true })
      .eq('engagement_id', engagementId),
  ]);

  if (engagementError) {
    console.error('Error loading engagement for Strategy Ideation', engagementError);
  }
  if (strategyError) {
    console.error('Error loading strategy brainstorm row', strategyError);
  }
  if (itemsError) {
    console.error('Error loading strategy items', itemsError);
  }
  if (visionError) {
    console.error('Error loading vision_and_goals', visionError);
  }
  if (sskError) {
    console.error('Error loading SSK count', sskError);
  }
  if (swotError) {
    console.error('Error loading SWOT count', swotError);
  }

  const companyName = engagement?.company_name ?? 'your company';
  const leaderName = engagement?.leader_name ?? null;
  const financialYearEnd = engagement?.financial_year_end ?? null;

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

  const strategyItems = (items ?? []) as StrategyIdeationItem[];
  const hasVision = !!vision;

  const tabHref = (tab: 'brainstorm' | 'cards') =>
    `/engagement/${engagementId}/strategy-ideation?tab=${tab}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phase 3 · Strategy Ideation
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">
              {companyName} – Strategy Ideation
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Turn your inputs and 5-domain brainstorm into clear strategic options.
            </p>
            {leaderName && (
              <p className="mt-1 text-xs text-slate-400">
                Leader: <span className="font-medium text-slate-600">{leaderName}</span>
                {financialYearEnd
                  ? ` · Financial year end: ${financialYearEnd}`
                  : null}
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-slate-600 md:items-end">
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Vision &amp; Goals
                </p>
                <p className="font-medium">
                  {hasVision ? 'Captured' : 'Not yet captured'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  SSK responses
                </p>
                <p className="font-medium">{sskCount ?? 0}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  SWOT entries
                </p>
                <p className="font-medium">{swotCount ?? 0}</p>
              </div>
            </div>
            <Link
              href={`/engagement/${engagementId}`}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Back to engagement dashboard
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="-mb-px flex gap-6 text-sm">
            <Link
              href={tabHref('brainstorm')}
              className={`border-b-2 pb-2 ${
                activeTab === 'brainstorm'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Brainstorm
            </Link>
            <Link
              href={tabHref('cards')}
              className={`border-b-2 pb-2 ${
                activeTab === 'cards'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Strategy Cards
            </Link>
          </nav>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          {/* Main panel: tab content */}
          <section>
            {activeTab === 'brainstorm' ? (
              <StrategyIdeationForm
                engagementId={engagementId}
                initialData={initialData}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-800">
                  Strategy Cards – coming in the next step.
                </p>
                <p className="mt-2">
                  Here you’ll be able to turn your brainstorm into a shortlist of clear
                  strategic options that can be prioritised in the next module.
                </p>
                {strategyItems.length > 0 && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-slate-500">
                      Debug view: existing strategy_ideation_items for this engagement
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {strategyItems.map((item) => (
                        <li key={item.id}>
                          • <span className="font-medium">{item.theme}</span>{' '}
                          <span className="text-slate-400">({item.domain})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right-hand anchors / helper panel */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Strategic anchors
              </h2>
              {vision ? (
                <div className="mt-3 space-y-3 text-xs text-slate-700">
                  {vision.purpose && (
                    <div>
                      <p className="font-semibold text-slate-800">Purpose</p>
                      <p className="mt-1 whitespace-pre-line">{vision.purpose}</p>
                    </div>
                  )}
                  {vision.bhag && (
                    <div>
                      <p className="font-semibold text-slate-800">BHAG</p>
                      <p className="mt-1 whitespace-pre-line">{vision.bhag}</p>
                    </div>
                  )}
                  {vision.three_year_vision && (
                    <div>
                      <p className="font-semibold text-slate-800">3-year vision</p>
                      <p className="mt-1 whitespace-pre-line">
                        {vision.three_year_vision}
                      </p>
                    </div>
                  )}
                  {vision.annual_goals && (
                    <div>
                      <p className="font-semibold text-slate-800">12-month goals</p>
                      <p className="mt-1 whitespace-pre-line">
                        {vision.annual_goals}
                      </p>
                    </div>
                  )}
                  {vision.core_kpis && (
                    <div>
                      <p className="font-semibold text-slate-800">Core KPIs</p>
                      <p className="mt-1 whitespace-pre-line">{vision.core_kpis}</p>
                    </div>
                  )}
                  {vision.playing_rules && (
                    <div>
                      <p className="font-semibold text-slate-800">Playing rules</p>
                      <p className="mt-1 whitespace-pre-line">
                        {vision.playing_rules}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  No Vision &amp; Goals have been captured yet for this engagement. You
                  can still brainstorm ideas here, but you’ll get better outcomes if
                  Vision &amp; Goals are in place.
                </p>
              )}
            </section>

            {/* Placeholder for future AI summary / questions */}
            <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">
                AI summary &amp; challenge questions (future)
              </p>
              <p className="mt-2">
                Once we hook in AI, this panel will summarise your 5-domain brainstorm
                and surface thought-provoking questions for the team.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
