// app/api/engagements/[engagementId]/ssk-swot-export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

type EngagementRow = {
  company_name: string | null;
};

type SskRow = {
  participant_name: string | null;
  start_text: string | null;
  stop_text: string | null;
  keep_text: string | null;
  created_at: string | null;
};

type SwotRow = {
  participant_name: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  opportunities: string[] | null;
  threats: string[] | null;
  created_at: string | null;
};

function escapeCsv(value: string | null | undefined): string {
  const s = (value ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { engagementId: string } }
) {
  const { engagementId } = params;

  const { data: engagement } = await supabase
    .from("engagements")
    .select("company_name")
    .eq("id", engagementId)
    .maybeSingle<EngagementRow>();

  const companyName = engagement?.company_name ?? "";

  const [
    { data: sskRows, error: sskError },
    { data: swotRows, error: swotError },
  ] = await Promise.all([
    supabase
      .from("start_stop_keep_responses")
      .select(
        "participant_name, start_text, stop_text, keep_text, created_at"
      )
      .eq("engagement_id", engagementId)
      .order("created_at", { ascending: true }) as any,
    supabase
      .from("swot")
      .select(
        "participant_name, strengths, weaknesses, opportunities, threats, created_at"
      )
      .eq("engagement_id", engagementId)
      .order("id", { ascending: true }) as any,
  ]);

  if (sskError) console.error("Error loading SSK for export:", sskError);
  if (swotError) console.error("Error loading SWOT for export:", swotError);

  const sskList = (sskRows as SskRow[] | null) ?? [];
  const swotList = (swotRows as SwotRow[] | null) ?? [];

  const rows: string[] = [];

  rows.push(
    [
      "company_name",
      "source",
      "category_or_quadrant",
      "description",
      "participant_name",
      "created_at",
    ]
      .map((h) => `"${h}"`)
      .join(",")
  );

  // SSK
  for (const item of sskList) {
    const participant = item.participant_name ?? "";
    const created = item.created_at ?? "";

    const pushIf = (text: string | null, category: string) => {
      if (!text || !text.trim()) return;
      rows.push(
        [
          companyName,
          "SSK",
          category,
          text,
          participant,
          created,
        ].map(escapeCsv).join(",")
      );
    };

    pushIf(item.start_text, "start");
    pushIf(item.stop_text, "stop");
    pushIf(item.keep_text, "keep");
  }

  // SWOT
  for (const row of swotList) {
    const participant = row.participant_name ?? "";
    const created = row.created_at ?? "";

    const pushItems = (items: string[] | null, quadrant: string) => {
      if (!Array.isArray(items)) return;
      items.forEach((desc) => {
        if (!desc || !desc.trim()) return;
        rows.push(
          [
            companyName,
            "SWOT",
            quadrant,
            desc,
            participant,
            created,
          ].map(escapeCsv).join(",")
        );
      });
    };

    pushItems(row.strengths, "strength");
    pushItems(row.weaknesses, "weakness");
    pushItems(row.opportunities, "opportunity");
    pushItems(row.threats, "threat");
  }

  const csv = rows.join("\r\n");

  const safeCompany =
    (companyName || "ssk-swot-export")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase() || "ssk-swot-export";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeCompany}.csv"`,
    },
  });
}
