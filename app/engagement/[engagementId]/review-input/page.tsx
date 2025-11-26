// app/engagement/[engagementId]/review-input/page.tsx

import { createClient } from "@supabase/supabase-js";
import SskSwotView from "../ssk-swot/SskSwotView";

type Params = { engagementId: string };

type PageProps = {
  params: Params | Promise<Params>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

type EngagementRow = {
  id: string;
  company_name: string | null;
  leader_name: string | null;
  financial_year_end: string | null;
};

type SskRow = {
  id: string;
  engagement_id: string;
  participant_name: string | null;
  start_text: string | null;
  stop_text: string | null;
  keep_text: string | null;
  created_at: string | null;
};

type SwotRow = {
  id: string;
  engagement_id: string;
  participant_name: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  opportunities: string[] | null;
  threats: string[] | null;
  created_at: string | null;
};

type SskItem = {
  id: string;
  category: "start" | "stop" | "keep";
  description: string;
  participantName: string | null;
  created_at: string | null;
};

type SwotItem = {
  id: string;
  type: "strength" | "weakness" | "opportunity" | "threat";
  description: string;
  participantName: string | null;
  created_at: string | null;
};

export default async function ReviewInputPage(props: PageProps) {
  const rawParams =
    props.params instanceof Promise ? await props.params : props.params;
  const { engagementId } = rawParams;

  const [
    { data: engagement, error: engagementError },
    { data: sskRows, error: sskError },
    { data: swotRows, error: swotError },
  ] = await Promise.all([
    supabase
      .from("engagements")
      .select("id, company_name, leader_name, financial_year_end")
      .eq("id", engagementId)
      .maybeSingle<EngagementRow>(),
    supabase
      .from("start_stop_keep_responses")
      .select(
        "id, engagement_id, participant_name, start_text, stop_text, keep_text, created_at"
      )
      .eq("engagement_id", engagementId)
      .order("created_at", { ascending: true }) as any,
    supabase
      .from("swot")
      .select(
        "id, engagement_id, participant_name, strengths, weaknesses, opportunities, threats, created_at"
      )
      .eq("engagement_id", engagementId)
      .order("id", { ascending: true }) as any,
  ]);

  if (!engagement || engagementError) {
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

  if (sskError) console.warn("Error loading SSK for summary:", sskError);
  if (swotError) console.warn("Error loading SWOT for summary:", swotError);

  const sskRowList = (sskRows as SskRow[] | null) ?? [];
  const swotRowList = (swotRows as SwotRow[] | null) ?? [];

  const sskItems: SskItem[] = [];

  for (const row of sskRowList) {
    const createdAt = row.created_at ?? null;
    const name = row.participant_name ?? null;

    if (row.start_text && row.start_text.trim()) {
      sskItems.push({
        id: `${row.id}-start`,
        category: "start",
        description: row.start_text.trim(),
        participantName: name,
        created_at: createdAt,
      });
    }

    if (row.stop_text && row.stop_text.trim()) {
      sskItems.push({
        id: `${row.id}-stop`,
        category: "stop",
        description: row.stop_text.trim(),
        participantName: name,
        created_at: createdAt,
      });
    }

    if (row.keep_text && row.keep_text.trim()) {
      sskItems.push({
        id: `${row.id}-keep`,
        category: "keep",
        description: row.keep_text.trim(),
        participantName: name,
        created_at: createdAt,
      });
    }
  }

  const swotItems: SwotItem[] = [];

  for (const row of swotRowList) {
    const createdAt = row.created_at ?? null;
    const name = row.participant_name ?? null;

    if (Array.isArray(row.strengths)) {
      row.strengths.forEach((desc, idx) => {
        if (typeof desc === "string" && desc.trim()) {
          swotItems.push({
            id: `${row.id}-strength-${idx}`,
            type: "strength",
            description: desc,
            participantName: name,
            created_at: createdAt,
          });
        }
      });
    }

    if (Array.isArray(row.weaknesses)) {
      row.weaknesses.forEach((desc, idx) => {
        if (typeof desc === "string" && desc.trim()) {
          swotItems.push({
            id: `${row.id}-weakness-${idx}`,
            type: "weakness",
            description: desc,
            participantName: name,
            created_at: createdAt,
          });
        }
      });
    }

    if (Array.isArray(row.opportunities)) {
      row.opportunities.forEach((desc, idx) => {
        if (typeof desc === "string" && desc.trim()) {
          swotItems.push({
            id: `${row.id}-opportunity-${idx}`,
            type: "opportunity",
            description: desc,
            participantName: name,
            created_at: createdAt,
          });
        }
      });
    }

    if (Array.isArray(row.threats)) {
      row.threats.forEach((desc, idx) => {
        if (typeof desc === "string" && desc.trim()) {
          swotItems.push({
            id: `${row.id}-threat-${idx}`,
            type: "threat",
            description: desc,
            participantName: name,
            created_at: createdAt,
          });
        }
      });
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <SskSwotView
          engagementId={engagementId}
          companyName={engagement.company_name}
          leaderName={engagement.leader_name}
          financialYearEnd={engagement.financial_year_end}
          sskItems={sskItems}
          swotItems={swotItems}
        />
      </div>
    </main>
  );
}
