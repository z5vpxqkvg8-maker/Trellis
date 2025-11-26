// app/api/strategy-ideation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

type StrategyPayload = {
  engagementId?: string;
  anchors?: any;
  growthMarket?: any[];
  growthProduct?: any[];
  operations?: any[];
  people?: any[];
  finance?: any[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StrategyPayload;

    const {
      engagementId,
      anchors,
      growthMarket,
      growthProduct,
      operations,
      people,
      finance,
    } = body;

    if (!engagementId) {
      return NextResponse.json(
        { error: 'Missing engagementId.' },
        { status: 400 },
      );
    }

    // Check if a row already exists
    const { data: existing, error: existingError } = await supabase
      .from('strategy_ideation')
      .select('id')
      .eq('engagement_id', engagementId)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing strategy_ideation row', existingError);
      return NextResponse.json(
        { error: 'Unable to load existing strategy data.' },
        { status: 500 },
      );
    }

    const payload = {
      engagement_id: engagementId,
      anchors: anchors ?? {},
      growth_market: growthMarket ?? [],
      growth_product: growthProduct ?? [],
      operations: operations ?? [],
      people: people ?? [],
      finance: finance ?? [],
    };

    if (existing) {
      const { data, error } = await supabase
        .from('strategy_ideation')
        .update(payload)
        .eq('engagement_id', engagementId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating strategy_ideation', error);
        return NextResponse.json(
          { error: 'Error updating strategy ideas. Please try again.' },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true, data }, { status: 200 });
    } else {
      const { data, error } = await supabase
        .from('strategy_ideation')
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error inserting strategy_ideation', error);
        return NextResponse.json(
          { error: 'Error saving strategy ideas. Please try again.' },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true, data }, { status: 201 });
    }
  } catch (err: any) {
    console.error('Unexpected error in /api/strategy-ideation', err);
    return NextResponse.json(
      { error: 'Unexpected error while saving strategy ideas.' },
      { status: 500 },
    );
  }
}
