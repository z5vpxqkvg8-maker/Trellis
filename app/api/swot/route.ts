// app/api/swot/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      engagementId,
      participantName,
      strengths,
      weaknesses,
      opportunities,
      threats,
    } = body;

    if (!engagementId) {
      return NextResponse.json(
        { error: 'Missing engagementId' },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase.from('swot').insert({
      engagement_id: engagementId,
      participant_name: participantName || null,
      strengths: strengths ?? [],
      weaknesses: weaknesses ?? [],
      opportunities: opportunities ?? [],
      threats: threats ?? [],
    });

    if (insertError) {
      console.error('Error inserting SWOT row:', insertError);
      return NextResponse.json(
        { error: 'Failed to save SWOT' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Unexpected error in /api/swot:', error);
    return NextResponse.json(
      { error: 'Unexpected error while saving SWOT' },
      { status: 500 }
    );
  }
}
