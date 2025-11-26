// app/api/vision-and-goals/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🔵 [API] POST /api/vision-and-goals body:', body);

    const {
      engagementId,
      purpose,
      bhag,
      playing_rules,
      three_year_vision,
      annual_goals,
      core_kpis,
    } = body;

    if (!engagementId || typeof engagementId !== 'string') {
      console.error('🔴 [API] Missing or invalid engagementId');
      return NextResponse.json(
        { error: 'engagementId is required' },
        { status: 400 }
      );
    }

    const payload = {
      engagement_id: engagementId,
      purpose: purpose ?? null,
      bhag: bhag ?? null,
      playing_rules: playing_rules ?? null,
      three_year_vision: three_year_vision ?? null,
      annual_goals: annual_goals ?? null,
      core_kpis: core_kpis ?? null,
    };

    console.log('🟡 [API] Upserting payload into vision_and_goals:', payload);

    const { data, error } = await supabase
      .from('vision_and_goals')
      .upsert(payload, { onConflict: 'engagement_id' }) // 👈 IMPORTANT
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
      );

    console.log('🟢 [API] Supabase upsert result:', { data, error });

    if (error) {
      console.error('🔴 [API] Error upserting vision_and_goals', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });

      return NextResponse.json(
        {
          error: error.message || 'Failed to save Vision & Goals',
          details: (error as any).details ?? null,
          hint: (error as any).hint ?? null,
          code: (error as any).code ?? null,
        },
        { status: 500 }
      );
    }

    const row = Array.isArray(data) ? data[0] : data;

    return NextResponse.json(
      { success: true, vision: row },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('🔴 [API] Error in POST /api/vision-and-goals', err);
    return NextResponse.json(
      {
        error: err.message || 'Invalid request body',
        raw: String(err),
      },
      { status: 400 }
    );
  }
}
