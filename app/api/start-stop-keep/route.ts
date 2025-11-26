import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      engagementId,
      participantName,
      start,
      stop,
      keep,
    }: {
      engagementId?: string;
      participantName?: string;
      start?: string;
      stop?: string;
      keep?: string;
    } = body || {};

    if (!engagementId) {
      return NextResponse.json(
        { error: 'engagementId is required.' },
        { status: 400 },
      );
    }

    if (!participantName?.trim()) {
      return NextResponse.json(
        { error: 'participantName is required.' },
        { status: 400 },
      );
    }

    if (
      !start?.trim() &&
      !stop?.trim() &&
      !keep?.trim()
    ) {
      return NextResponse.json(
        { error: 'At least one of Start, Stop, or Keep must have content.' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('start_stop_keep_responses')
      .insert({
        engagement_id: engagementId,
        participant_name: participantName.trim(),
        start_text: start || '',
        stop_text: stop || '',
        keep_text: keep || '',
      })
      .select('id')
      .single();

    if (error) {
      console.error('SSK insert error', error);
      return NextResponse.json(
        { error: 'Failed to save response.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error('SSK POST error', err);
    return NextResponse.json(
      { error: 'Unexpected error.' },
      { status: 500 },
    );
  }
}
