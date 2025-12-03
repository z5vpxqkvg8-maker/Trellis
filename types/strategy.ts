// types/strategy.ts

export type StrategyDomain =
  | 'growth_market'
  | 'growth_product'
  | 'operations'
  | 'people'
  | 'financials';

export type StrategySourceTag =
  | 'swot'
  | 'ssk'
  | 'vision'
  | 'customer_insights'
  | 'financials'
  | 'other';

export interface StrategyIdeationItem {
  id: string;
  engagement_id: string;
  theme: string;
  description: string | null;
  domain: StrategyDomain;
  source_tags: StrategySourceTag[];
  created_at: string;   // ISO string from Supabase
  updated_at: string;   // ISO string from Supabase
}

