export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { InputSummaryPdf, type CategoryItem, type EngagementInfo } from './PdfDocument';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

type Params = { engagementId: string } | Promise<{ engagementId: string }>;

type SskRow = {
  id: string;
  engagement_id: string;
  participant_name: string | null;
  start_text: string | null;
  stop_text: string | null;
  keep_text: string | null;
  created_at: string;
};

type SwotRow = {
  id: string;
  engagement_id: string;
  participant_name: string | null;
  strengths: any;
  weaknesses: any;
  opportunities: any;
  threats: any;
  created_at: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'engagement';
}

type CategoryField =
  | 'start_text'
  | 'stop_text'
  | 'keep_text';

type SwotField =
  | 'strengths'
  | 'weaknesses'
  | 'opportunities'
  | 'threats';

function buildSskCategory(
  rows: SskRow[],
  field: CategoryField,
): CategoryItem[] {
  return rows.flatMap((row) => {
    const raw = row[field] || '';
    const bullets = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const participant = row.participant_name?.trim() || 'Anonymous';

    return bullets.map((text) => ({ text, participant }));
  });
}

function normalizeSwotField(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
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

function buildSwotCategory(
  rows: SwotRow[],
  field: SwotField,
): CategoryItem[] {
  return rows.flatMap((row) => {
    const bullets = normalizeSwotField((row as any)[field]);
    const participant = row.participant_name?.trim() || 'Anonymous';
    return bullets.map((text) => ({ text, participant }));
  });
}

export async function GET(
  _req: NextRequest,
  context: { params: Params },
) {
  try {
    const { engagementId } = await context.params;

    const [{ data: engagement }, { data: ssk }, { data: swot }] =
      await Promise.all([
        supabase
          .from('engagements')
          .select('company_name, leader_name, financial_year_end')
          .eq('id', engagementId)
          .maybeSingle(),
        supabase
          .from('start_stop_keep_responses')
          .select('*')
          .eq('engagement_id', engagementId)
          .order('created_at', { ascending: true }),
        supabase
          .from('swot')
          .select('*')
          .eq('engagement_id', engagementId)
          .order('created_at', { ascending: true }),
      ]);

    const engagementInfo: EngagementInfo | null = engagement
      ? {
          company_name: engagement.company_name ?? null,
          leader_name: engagement.leader_name ?? null,
          financial_year_end: engagement.financial_year_end ?? null,
        }
      : null;

    const sskRows = (ssk || []) as SskRow[];
    const swotRows = (swot || []) as SwotRow[];

    const startItems = buildSskCategory(sskRows, 'start_text');
    const stopItems = buildSskCategory(sskRows, 'stop_text');
    const keepItems = buildSskCategory(sskRows, 'keep_text');

    const strengthsItems = buildSwotCategory(swotRows, 'strengths');
    const weaknessesItems = buildSwotCategory(swotRows, 'weaknesses');
    const opportunitiesItems = buildSwotCategory(swotRows, 'opportunities');
    const threatsItems = buildSwotCategory(swotRows, 'threats');

        const element = React.createElement(InputSummaryPdf, {
      engagementId,
      engagement: engagementInfo,
      startItems,
      stopItems,
      keepItems,
      strengthsItems,
      weaknessesItems,
      opportunitiesItems,
      threatsItems,
    });

    // Loosen types so TS stops treating this as a ReadableStream
    const pdfInstance: any = pdf(element as any);
    const pdfBuffer: any = await pdfInstance.toBuffer();

    const companyPart = engagementInfo?.company_name
      ? slugify(engagementInfo.company_name)
      : 'engagement';

    const filename = `${companyPart}-input-summary-${engagementId}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });


  } catch (err) {
    console.error('PDF generation error', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF.' },
      { status: 500 },
    );
  }
}
