// app/api/engagements/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

// POST /api/engagements
// Creates a new engagement and returns its id.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { companyName, leaderName, financialYearEnd, engagementName } = body as {
      companyName?: string;
      leaderName?: string;
      financialYearEnd?: string;
      engagementName?: string;
    };

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    if (!leaderName || !leaderName.trim()) {
      return NextResponse.json(
        { error: 'Leader name is required' },
        { status: 400 }
      );
    }

    if (!financialYearEnd || !financialYearEnd.trim()) {
      return NextResponse.json(
        { error: 'Financial year end is required' },
        { status: 400 }
      );
    }

    const payload = {
      company_name: companyName.trim(),
      leader_name: leaderName.trim(),
      financial_year_end: financialYearEnd, // expecting YYYY-MM-DD
      engagement_name: engagementName?.trim() || null,
    };

    const { data, error } = await supabase
      .from('engagements')
      .insert(payload)
      .select('id')
      .single();

    if (error || !data) {
      console.error('🔴 [API] Error inserting engagement:', error);
      return NextResponse.json(
        { error: 'Failed to create engagement' },
        { status: 500 }
      );
    }

    console.log('🟢 [API] Created engagement with id:', data.id);

    return NextResponse.json({ engagementId: data.id }, { status: 201 });
  } catch (err) {
    console.error('🔴 [API] Error in POST /api/engagements:', err);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// GET /api/engagements
// Returns a list of all engagements for the coach dashboard.
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('engagements')
      .select(
        'id, company_name, leader_name, financial_year_end, engagement_name, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 [API] Error fetching engagements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch engagements' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { engagements: data ?? [] },
      { status: 200 }
    );
  } catch (err) {
    console.error('🔴 [API] Error in GET /api/engagements:', err);
    return NextResponse.json(
      { error: 'Failed to fetch engagements' },
      { status: 500 }
    );
  }
}
