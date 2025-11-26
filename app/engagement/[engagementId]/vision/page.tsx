// app/engagement/[engagementId]/vision/page.tsx
import { createClient } from '@supabase/supabase-js';
import VisionForm from './VisionForm';

type PageProps = {
  params: { engagementId: string } | Promise<{ engagementId: string }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

type VisionRow = {
  engagement_id: string;
  purpose: string | null;
  bhag: string | null;
  playing_rules: string | null;
  three_year_vision: string | null;
  annual_goals: string | null;
  core_kpis: string | null;
};

export default async function VisionPage(props: PageProps) {
  const { engagementId } =
    props.params instanceof Promise ? await props.params : props.params;

  // Load engagement header info
  const { data: engagement, error: engagementError } = await supabase
    .from('engagements')
    .select('id, company_name, leader_name')
    .eq('id', engagementId)
    .maybeSingle();

  if (engagementError) {
    console.warn('Error loading engagement for Vision page:', engagementError);
  }

  // Load existing Vision & Goals for this engagement
  const { data: rawVisionRow, error: visionError } = await supabase
    .from('vision_and_goals')
    .select(
      `
      engagement_id,
      purpose,
      bhag,
      playing_rules,
      three_year_vision,
      annual_goals,
      core_kpis
    `
    )
    .eq('engagement_id', engagementId)
    .maybeSingle();

  if (visionError) {
    console.warn('Error loading vision_and_goals:', visionError);
  }

  const vision = (rawVisionRow as VisionRow | null) ?? null;

  const initialValues = {
    purpose: vision?.purpose ?? '',
    bhag: vision?.bhag ?? '',
    playingRules: vision?.playing_rules ?? '',
    threeYearVision: vision?.three_year_vision ?? '',
    annualGoals: vision?.annual_goals ?? '',
    coreKpis: vision?.core_kpis ?? '',
  };

  const companyName = engagement?.company_name ?? 'your company';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <header className="mb-8 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Phase 2 · Vision &amp; Playing Rules
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Vision for {companyName}
          </h1>
          <p className="text-sm text-slate-600">
            Capture your Purpose, BHAG, Playing Rules, 3-Year Vision, Top 3–5
            Annual Goals, and 3–5 Core KPIs to guide strategy and prioritisation.
            Use the “Need help?” buttons for quick guidance and to download the
            full worksheets.
          </p>
        </header>

        {/* Form */}
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <VisionForm engagementId={engagementId} initialValues={initialValues} />
        </section>
      </div>
    </main>
  );
}
