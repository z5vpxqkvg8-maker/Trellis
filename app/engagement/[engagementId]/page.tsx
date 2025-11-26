// app/engagement/[engagementId]/page.tsx

import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import ModuleCard from "./ModuleCard";

type PageProps = {
  params: { engagementId: string } | Promise<{ engagementId: string }>;
};

type ModuleStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "available"
  | "not_ready"
  | "coming_soon";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/* ---------- Status helpers ---------- */

function getVisionStatus(vision: any | null): ModuleStatus {
  if (!vision) return "not_started";

  const fields = [
    vision.purpose,
    vision.bhag,
    vision.playing_rules,
    vision.three_year_vision,
    vision.annual_goals,
    vision.core_kpis,
  ];

  const nonEmptyCount = fields.reduce((count, v) => {
    if (Array.isArray(v)) return v.length > 0 ? count + 1 : count;
    if (typeof v === "string" && v.trim().length > 0) return count + 1;
    return count;
  }, 0);

  if (nonEmptyCount === 0) return "not_started";
  if (nonEmptyCount === fields.length) return "complete";
  return "in_progress";
}

function getSwotStatus(swotRows: any[] | null): ModuleStatus {
  if (!Array.isArray(swotRows) || swotRows.length === 0) return "not_started";

  let strengths = 0;
  let weaknesses = 0;
  let opportunities = 0;
  let threats = 0;

  for (const r of swotRows) {
    strengths += Array.isArray(r.strengths) ? r.strengths.length : 0;
    weaknesses += Array.isArray(r.weaknesses) ? r.weaknesses.length : 0;
    opportunities += Array.isArray(r.opportunities)
      ? r.opportunities.length
      : 0;
    threats += Array.isArray(r.threats) ? r.threats.length : 0;
  }

  const groupsFilled = [
    strengths > 0,
    weaknesses > 0,
    opportunities > 0,
    threats > 0,
  ].filter(Boolean).length;

  if (groupsFilled === 0) return "not_started";
  if (groupsFilled === 4) return "complete";
  return "in_progress";
}

function getSskStatus(count: number): ModuleStatus {
  if (count === 0) return "not_started";
  return "in_progress";
}

function getStrategyIdeationStatus(opts: {
  strategyIdeation: any | null;
  visionStatus: ModuleStatus;
  sskStatus: ModuleStatus;
  swotStatus: ModuleStatus;
}): ModuleStatus {
  const { strategyIdeation, visionStatus, sskStatus, swotStatus } = opts;

  if (strategyIdeation) return "complete";

  const visionReady =
    visionStatus === "in_progress" || visionStatus === "complete";
  const hasInputs =
    sskStatus === "in_progress" ||
    swotStatus === "in_progress" ||
    swotStatus === "complete";

  if (!visionReady || !hasInputs) return "not_ready";
  return "available";
}

function getCustomerInsightsStatus(count: number): ModuleStatus {
  if (count === 0) return "not_started";
  return "complete";
}

function getFinancialsStatus(count: number): ModuleStatus {
  if (count === 0) return "not_started";
  if (count < 3) return "in_progress";
  return "complete";
}

/* ---------- Page ---------- */

export default async function EngagementDashboardPage(props: PageProps) {
  const { engagementId } =
    props.params instanceof Promise ? await props.params : props.params;

  const supabase = getSupabase();

  // Header data
  const { data: engagement, error: engagementError } = await supabase
    .from("engagements")
    .select("*")
    .eq("id", engagementId)
    .single();

  if (engagementError || !engagement) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Engagement not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Please check the link and try again.
        </p>
      </main>
    );
  }

  // Module data
  const [
    { data: vision },
    { data: swotRows },
    { data: strategyIdeation },
    sskCountRes,
    customerDocsRes,
    financialDocsRes,
  ] = await Promise.all([
    supabase
      .from("vision_and_goals")
      .select("*")
      .eq("engagement_id", engagementId)
      .maybeSingle(),
    supabase
      .from("swot")
      .select("id, strengths, weaknesses, opportunities, threats")
      .eq("engagement_id", engagementId)
      .order("id", { ascending: true }),
    supabase
      .from("strategy_ideation")
      .select("*")
      .eq("engagement_id", engagementId)
      .maybeSingle(),
    supabase
      .from("start_stop_keep_responses")
      .select("id", { count: "exact", head: true })
      .eq("engagement_id", engagementId),
    supabase
      .from("customer_insights_documents")
      .select("id", { count: "exact", head: true })
      .eq("engagement_id", engagementId),
    supabase
      .from("financial_documents")
      .select("id", { count: "exact", head: true })
      .eq("engagement_id", engagementId),
  ]);

  const sskCount = sskCountRes.count ?? 0;
  const customerDocCount = customerDocsRes.count ?? 0;
  const financialDocCount = financialDocsRes.count ?? 0;

  const swotRowList = (swotRows as any[] | null) ?? null;

  const visionStatus = getVisionStatus(vision ?? null);
  const swotStatus = getSwotStatus(swotRowList);
  const sskStatus = getSskStatus(sskCount);
  const strategyStatus = getStrategyIdeationStatus({
    strategyIdeation: strategyIdeation ?? null,
    visionStatus,
    sskStatus,
    swotStatus,
  });
  const customerInsightsStatus = getCustomerInsightsStatus(customerDocCount);
  const financialsStatus = getFinancialsStatus(financialDocCount);

  // # of SWOT responses (rows), not # of individual bullets
  const swotResponseCount = Array.isArray(swotRowList)
    ? swotRowList.length
    : 0;

  const hasSskOrSwot = sskCount > 0 || swotStatus !== "not_started";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        {/* Header */}
        <header className="mb-10 border-b-2 border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-emerald-50">
              <Image
                src="/trellis-logo.svg"
                alt="Trellis"
                width={300}
                height={300}
                className="h-20 w-20"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Trellis Planning Dashboard
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {engagement.company_name || "Engagement"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {engagement.leader_name && (
                  <>
                    Leader:{" "}
                    <span className="font-medium">
                      {engagement.leader_name}
                    </span>
                  </>
                )}
                {engagement.financial_year_end && (
                  <>
                    {" "}
                    • FYE:{" "}
                    <span className="font-medium">
                      {new Date(
                        engagement.financial_year_end
                      ).toLocaleDateString("en-AU")}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-12">
          {/* Phase I */}
          <section>
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Phase I – Input Gathering
              </h2>
              <p className="text-xs text-slate-500">
                Collect insights from your team, customers and financials
                before setting vision.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Start–Stop–Keep */}
              <ModuleCard
                engagementId={engagementId}
                title="Start–Stop–Keep"
                description="Team insights on what to start, stop and keep doing."
                href={`/engagement/${engagementId}/ssk`}
                status={sskStatus}
                primaryLabel="Open S-S-K"
                count={sskCount}
                slug="start-stop-keep"
                copyPath={`/engagement/${engagementId}/ssk`}
              >
                {hasSskOrSwot && (
                  <div className="mt-1">
                    <Link
                      href={`/engagement/${engagementId}/review-input`}
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View SSK &amp; SWOT summary
                    </Link>
                  </div>
                )}
              </ModuleCard>

              {/* SWOT */}
              <ModuleCard
                engagementId={engagementId}
                title="SWOT"
                description="Strengths, weaknesses, opportunities and threats."
                href={`/engagement/${engagementId}/swot`}
                status={swotStatus}
                primaryLabel="Open SWOT"
                count={swotResponseCount}
                slug="swot"
                copyPath={`/engagement/${engagementId}/swot`}
              >
                {hasSskOrSwot && (
                  <div className="mt-1">
                    <Link
                      href={`/engagement/${engagementId}/review-input`}
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View SSK &amp; SWOT summary
                    </Link>
                  </div>
                )}
              </ModuleCard>

              {/* Customer & Market Insights */}
              <ModuleCard
                engagementId={engagementId}
                title="Customer & Market Insights"
                description="Upload NPS summaries, interviews, competitor notes or other customer insights."
                href={`/engagement/${engagementId}/customer-insights`}
                status={customerInsightsStatus}
                primaryLabel="Manage uploads"
                count={customerDocCount}
                slug="customer-insights"
              />

              {/* Financial Documents */}
              <ModuleCard
                engagementId={engagementId}
                title="Financial Documents"
                description="Upload the last 3 years of P&L and balance sheet."
                href={`/engagement/${engagementId}/financials`}
                status={financialsStatus}
                primaryLabel="Manage uploads"
                count={financialDocCount}
                slug="financials"
              />
            </div>
          </section>

          {/* Phase II */}
          <section className="border-t border-slate-200 pt-8">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Phase II – Vision & Goal Setting
              </h2>
              <p className="text-xs text-slate-500">
                Turn inputs into a clear long-term direction and annual focus.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Vision & Goals */}
              <ModuleCard
                engagementId={engagementId}
                title="Vision & Goals"
                description="Clarify purpose, BHAG, playing rules and key goals."
                href={`/engagement/${engagementId}/vision`}
                status={visionStatus}
                primaryLabel="Open Vision"
                slug="vision"
              />
            </div>
          </section>

          {/* Phase III */}
          <section className="border-t border-slate-200 pt-8">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Phase III – Strategy Ideation & Prioritisation
              </h2>
              <p className="text-xs text-slate-500">
                Turn your inputs and vision into practical strategic options and
                choose where to focus.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Strategy Ideation */}
              <ModuleCard
                engagementId={engagementId}
                title="Strategy Ideation"
                description="Brainstorm strategic opportunities across anchors, growth, operations, people and finance."
                href={
                  strategyStatus === "not_ready"
                    ? undefined
                    : `/engagement/${engagementId}/strategy-ideation`
                }
                status={strategyStatus}
                primaryLabel={
                  strategyStatus === "not_ready"
                    ? "Prerequisites not met"
                    : "Open Strategy Ideation"
                }
                disabled={strategyStatus === "not_ready"}
                slug="strategy-ideation"
              >
                {strategyStatus === "not_ready" && (
                  <p className="text-xs text-slate-500">
                    To unlock Strategy Ideation, add some content to Vision and
                    at least one of SSK or SWOT.
                  </p>
                )}
              </ModuleCard>

              {/* Prioritisation – placeholder */}
              <ModuleCard
                engagementId={engagementId}
                title="Prioritisation"
                description="Score and prioritise your strategic options."
                status="coming_soon"
                primaryLabel="Coming soon"
                disabled
                slug="prioritisation"
              />
            </div>
          </section>

          {/* Phase IV */}
          <section className="border-t border-slate-200 pt-8">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Phase IV – Building the One-Page Plan
              </h2>
              <p className="text-xs text-slate-500">
                Bring your purpose, goals, KPIs and key initiatives onto a
                single page your team can rally around.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* A3 Strategic Plan – placeholder */}
              <ModuleCard
                engagementId={engagementId}
                title="A3 Strategic Plan"
                description="Bring purpose, goals, KPIs and key initiatives onto one page."
                status="coming_soon"
                primaryLabel="Coming soon"
                disabled
                slug="a3-plan"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
