// app/engagement/[engagementId]/financials/page.tsx

import { createClient } from '@supabase/supabase-js';
import FinancialDocumentsPanel from './FinancialDocumentsPanel';
import type {
  FinancialDocumentRow,
  FinancialPeriod,
} from './types';

type Params = { engagementId: string };

type PageProps = {
  params: Params | Promise<Params>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Simple service-role client for server-side usage only
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

type EngagementRow = {
  id: string;
  company_name: string;
  leader_name: string | null;
  financial_year_end: string | null; // date in YYYY-MM-DD
};

/**
 * Build the last 3 completed financial years (full year),
 * the current FY year-to-date, and an Opening Balance Sheet period.
 *
 * We treat the "financial year" as ending on financialYearEnd (usually 30 June in AU),
 * and label by the *end* year (e.g. FY 2026 for the year ending 30 Jun 2026).
 */
function buildFinancialPeriods(
  now: Date,
  financialYearEnd: string | null
): FinancialPeriod[] {
  let fyeMonth = 6;
  let fyeDay = 30;

  if (financialYearEnd) {
    // financial_year_end is a date; we only care about month/day here
    const [y, m, d] = financialYearEnd.split('-').map((v) => parseInt(v, 10));
    if (!Number.isNaN(m) && !Number.isNaN(d)) {
      fyeMonth = m;
      fyeDay = d;
    }
  } else {
    // Fallback to calendar year end if we genuinely have no FYE
    fyeMonth = 12;
    fyeDay = 31;
  }

  const nowYear = now.getFullYear();
  const fyeThisYear = new Date(nowYear, fyeMonth - 1, fyeDay);

  // Current FY is the one whose end date is next in the calendar
  const currentEndYear = now <= fyeThisYear ? nowYear : nowYear + 1;
  const lastCompletedEndYear = currentEndYear - 1;

  const fullYearsEnd: number[] = [
    lastCompletedEndYear,
    lastCompletedEndYear - 1,
    lastCompletedEndYear - 2,
  ];

  const periods: FinancialPeriod[] = fullYearsEnd.map((endYear, index) => ({
    key: `fy${endYear}_full`,
    label: `FY ${endYear} (full year)`,
    description: `Financial year ending ${fyeDay} ${monthName(fyeMonth)} ${endYear}.`,
    type: 'full_year',
    order: index + 1,
    isRecommended: true,
    endYear,
    }));


  // Current FY year-to-date period
  const ytdEndYear = currentEndYear;
  periods.push({
    key: `fy${ytdEndYear}_ytd`,
    label: `FY ${ytdEndYear} (year-to-date)`,
    description: `Current financial year to date (year ending ${fyeDay} ${monthName(
      fyeMonth
    )} ${ytdEndYear}).`,
    type: 'ytd',
    order: 0,
    isRecommended: true,
    endYear: ytdEndYear,
  });

  // Opening Balance Sheet at the start of the earliest full FY in the series
  const earliestEndYear = fullYearsEnd[fullYearsEnd.length - 1];
  const openingLabelYear = earliestEndYear - 1; // start of the first FY

  periods.push({
    key: 'opening_balance_sheet',
    label: 'Opening Balance Sheet',
    description: `Balance Sheet at the start of the first financial year in this series (1 ${
      monthName(fyeMonth)
    } ${openingLabelYear}).`,
    type: 'opening_bs',
    order: fullYearsEnd.length + 1,
    isRecommended: true,
    endYear: null,
  });

  return periods;
}

function monthName(month: number): string {
  return [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][month]!;
}

export default async function FinancialsPage(props: PageProps) {
  const rawParams = props.params instanceof Promise ? await props.params : props.params;
  const { engagementId } = rawParams;

  const [
    { data: engagement, error: engagementError },
    { data: docs, error: docsError },
  ] = await Promise.all([
    supabase
      .from('engagements')
      .select('id, company_name, leader_name, financial_year_end')
      .eq('id', engagementId)
      .maybeSingle<EngagementRow>(),
    supabase
      .from('financial_documents')
      .select(
        'id, engagement_id, doc_type, file_path, original_file_name, mime_type, uploaded_at, meta'
      )
      .eq('engagement_id', engagementId)
      .order('uploaded_at', { ascending: true }) as any,
  ]);

  if (engagementError) {
    console.warn('Error loading engagement for financials:', engagementError);
  }
  if (docsError) {
    console.warn('Error loading financial_documents:', docsError);
  }

  if (!engagement) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-semibold text-slate-900">
            Engagement not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Please check the link and try again.
          </p>
        </div>
      </main>
    );
  }

  const periods = buildFinancialPeriods(new Date(), engagement.financial_year_end);
  const documents = (docs as FinancialDocumentRow[] | null) ?? [];
  const companyName = engagement.company_name ?? 'your company';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <FinancialDocumentsPanel
          engagementId={engagementId}
          companyName={companyName}
          financialYearEnd={engagement.financial_year_end}
          periods={periods}
          initialDocuments={documents}
        />
      </div>
    </main>
  );
}
