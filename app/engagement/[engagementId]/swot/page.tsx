// app/engagement/[engagementId]/swot/page.tsx
import { createClient } from '@supabase/supabase-js';
import SwotForm from './Form';

type Params = { engagementId: string };
type PageProps = { params: Params | Promise<Params> };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SwotRow = {
  id: string;
  engagement_id: string;
  participant_name: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  opportunities: string[] | null;
  threats: string[] | null;
  created_at: string;
};

export default async function SwotPage({ params }: PageProps) {
  const raw = params instanceof Promise ? await params : params;
  const { engagementId } = raw;

  // Load engagement header
  const { data: engagement, error: engagementError } = await supabase
    .from('engagements')
    .select('id, company_name, leader_name')
    .eq('id', engagementId)
    .maybeSingle();

  if (engagementError) {
    console.warn('Error loading engagement for SWOT page:', engagementError);
  }

  // Load all SWOT entries for this engagement
  const { data: swotRows, error: swotError } = await supabase
    .from('swot')
    .select(
      `
      id,
      engagement_id,
      participant_name,
      strengths,
      weaknesses,
      opportunities,
      threats,
      created_at
    `
    )
    .eq('engagement_id', engagementId)
    .order('created_at', { ascending: true });

  if (swotError) {
    console.warn('Error loading SWOT rows:', swotError);
  }

  const responses: SwotRow[] = (swotRows as SwotRow[] | null) ?? [];
  const companyName = engagement?.company_name ?? 'your company';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Phase 2 · SWOT
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            SWOT for {companyName}
          </h1>
          <p className="text-sm text-slate-600">
            Capture Strengths, Weaknesses, Opportunities and Threats. Multiple
            people can contribute; each submission is stored separately.
          </p>
        </header>

        {/* Form */}
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <SwotForm engagementId={engagementId} />
        </section>
      </div>
    </main>
  );
}

type SwotListProps = {
  title: string;
  items: string[] | null;
};

function SwotList({ title, items }: SwotListProps) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {safeItems.length === 0 ? (
        <p className="mt-1 text-[11px] text-slate-500">No items.</p>
      ) : (
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-slate-700">
          {safeItems.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
