// app/api/strategy-ideation/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type {
  StrategyDomain,
  StrategySourceTag,
  StrategyIdeationItem,
} from '@/types/strategy';

export const runtime = 'nodejs';

type UpdateItemBody = {
  theme?: string;
  description?: string | null;
  domain?: StrategyDomain;
  sourceTags?: StrategySourceTag[];
};

type RouteParams = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const supabase = createSupabaseServerClient();

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  let body: UpdateItemBody;
  try {
    body = await req.json();
  } catch (error) {
    console.error('Invalid JSON for strategy item PUT', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const updatePayload: Record<string, unknown> = {};

  if (typeof body.theme === 'string') {
    updatePayload.theme = body.theme;
  }
  if (typeof body.description === 'string' || body.description === null) {
    updatePayload.description = body.description;
  }
  if (typeof body.domain === 'string') {
    updatePayload.domain = body.domain;
  }
  if (Array.isArray(body.sourceTags)) {
    updatePayload.source_tags = body.sourceTags;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 },
    );
  }

  updatePayload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('strategy_ideation_items')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single<StrategyIdeationItem>();

  if (error || !data) {
    console.error('Error updating strategy_ideation_item', error);
    return NextResponse.json(
      { error: 'Could not update strategy item' },
      { status: 500 },
    );
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const supabase = createSupabaseServerClient();

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('strategy_ideation_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting strategy_ideation_item', error);
    return NextResponse.json(
      { error: 'Could not delete strategy item' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
