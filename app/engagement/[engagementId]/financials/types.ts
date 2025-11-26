// app/engagement/[engagementId]/financials/types.ts

export type PeriodType = 'full_year' | 'ytd' | 'opening_bs';

export type DocRole =
  | 'financial_pack'
  | 'pnl'
  | 'balance_sheet'
  | 'cash_flow'
  | 'trial_balance'
  | 'other';

export type FinancialPeriod = {
  key: string;          // e.g. 'fy2026_full', 'fy2026_ytd', 'opening_balance_sheet'
  label: string;        // e.g. 'FY 2026 (full year)'
  description: string;  // helper text for UI
  type: PeriodType;
  order: number;        // for sorting
  isRecommended: boolean;
  endYear?: number | null; // end year of the financial year (e.g. 2026 for FY25–26)
};

export type FinancialDocumentMeta = {
  period_key?: string | null;
  period_label?: string | null;
  period_type?: PeriodType | null;
  doc_role?: DocRole | null;
  includes_comparatives?: boolean | null;
  notes?: string | null;
  /**
   * Years this file is intended to cover, using the FY end year.
   * e.g. a 3-year pack ending FY 2026 → [2024, 2025, 2026].
   */
  covers_years?: number[] | null;
};

export type FinancialDocumentRow = {
  id: string;
  engagement_id: string;
  doc_type: string | null;
  file_path: string;
  original_file_name: string;
  mime_type: string | null;
  uploaded_at: string; // ISO timestamp from Supabase
  meta: FinancialDocumentMeta | null;
};
