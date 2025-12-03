// app/api/strategy-ideation/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type {
  StrategyDomain,
  StrategySourceTag,
  StrategyIdeationItem,
} from '@/types/strategy';

export const runtime = 'nodejs';

type CreateItemBody = {
  engagementId: string;
  theme: string;
  description?: string;
  domain: StrategyDomain;
  sourceTags?: StrategySourceTag[];
};

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  let body: CreateItemBody;
  try {
    body = await req.json();
  } catch (error) {
    console.error('Invalid JSON for strategy item POST', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const { engagementId, theme, description, domain, sourceTags } = body;

  if (!engagementId || !theme || !domain) {
    return NextResponse.json(
      { error: 'engagementId, theme and domain are required' },
      { status: 400 },
    );
  }

  const source_tags: StrategySourceTag[] = Array.isArray(sourceTags)
    ? sourceTags
    : [];

  const { data, error } = await supabase
    .from('strategy_ideation_items')
    .insert({
      engagement_id: engagementId,
      theme,
      description: description ?? null,
      domain,
      source_tags,
    })
    .select('*')
    .single<StrategyIdeationItem>();

  if (error || !data) {
    console.error('Error inserting strategy_ideation_item', error);
    return NextResponse.json(
      { error: 'Could not create strategy item' },
      { status: 500 },
    );
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
