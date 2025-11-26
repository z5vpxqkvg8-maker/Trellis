import Form from './Form';
import { createClient } from '@supabase/supabase-js';

export const metadata = {
  title: 'Trellis SSK',
};

type PageProps = {
  params: { engagementId: string } | Promise<{ engagementId: string }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function getCompanyName(engagementId: string) {
  try {
    const { data, error } = await supabase
      .from('engagements')
      .select('company_name')
      .eq('id', engagementId)
      .single();

    if (error) {
      console.error('Supabase error fetching engagement', error);
      return null;
    }

    return data?.company_name ?? null;
  } catch (err) {
    console.error('Unexpected error fetching company name', err);
    return null;
  }
}
async function getEngagementName(engagementId: string) {
  try {
    const { data, error } = await supabase
      .from('engagements')
      .select('engagement_name')
      .eq('id', engagementId)
      .single();

    if (error) {
      console.error('Supabase error fetching engagement', error);
      return null;
    }

    return data?.engagement_name ?? null;
  } catch (err) {
    console.error('Unexpected error fetching company name', err);
    return null;
  }  
}

export default async function StartStopKeepPage({ params }: PageProps) {
  const { engagementId } = await params;
  const companyName = await getCompanyName(engagementId);
  const engagementName = await getEngagementName(engagementId);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Start / Stop / Keep
        </h1>

        <p className="mt-2 text-sm font-medium text-slate-700">
          {companyName ?? 'Company name not available'}
          {engagementName ? ` - ${engagementName}` : ''}
        </p>

        <p className="mt-2 text-sm text-slate-600">
          Please share your honest input. Your name is included so we can
          understand perspectives. What you have to say is important.
        </p>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <Form engagementId={engagementId} />
        </div>
      </div>
    </main>
  );
}
