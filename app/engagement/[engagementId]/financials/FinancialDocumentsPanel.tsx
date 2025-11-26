// app/engagement/[engagementId]/financials/FinancialDocumentsPanel.tsx
'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import type {
  DocRole,
  FinancialDocumentMeta,
  FinancialDocumentRow,
  FinancialPeriod,
} from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const FINANCIAL_DOCS_BUCKET = 'financial-documents';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  engagementId: string;
  companyName: string;
  financialYearEnd: string | null;
  periods: FinancialPeriod[];
  initialDocuments: FinancialDocumentRow[];
};

type PeriodStatus = 'missing' | 'partial' | 'complete';

type PeriodStatusSummary = {
  status: PeriodStatus;
  hasPack: boolean;
  hasPnl: boolean;
  hasBs: boolean;
  totalDocs: number;
};

type OverallReadiness = {
  completedRecommended: number;
  totalRecommended: number;
  label: 'Not started' | 'In progress' | 'Complete';
};

type PeriodDocumentsMap = Record<string, FinancialDocumentRow[]>;

export default function FinancialDocumentsPanel({
  engagementId,
  companyName,
  financialYearEnd,
  periods,
  initialDocuments,
}: Props) {
  const [documents, setDocuments] =
    useState<FinancialDocumentRow[]>(initialDocuments);

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('');
  const [includePnl, setIncludePnl] = useState(false);
  const [includeBs, setIncludeBs] = useState(false);
  const [coverageYears, setCoverageYears] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadSectionRef = useRef<HTMLDivElement | null>(null);

  // Map period_key → docs explicitly stored against that period
  const periodMap = useMemo(() => {
    const map: PeriodDocumentsMap = {};
    const knownKeys = new Set(periods.map((p) => p.key));

    for (const p of periods) {
      map[p.key] = [];
    }

    for (const doc of documents) {
      const key = doc.meta?.period_key ?? null;
      if (key && knownKeys.has(key)) {
        map[key].push(doc);
      }
    }

    return map;
  }, [documents, periods]);

  // Map FY end year → docs that declare they cover that year
  const docsCoveringYear = useMemo(() => {
    const map = new Map<number, FinancialDocumentRow[]>();

    for (const doc of documents) {
      const covers = doc.meta?.covers_years;
      if (!Array.isArray(covers)) continue;

      for (const year of covers) {
        if (typeof year !== 'number') continue;
        if (!map.has(year)) map.set(year, []);
        map.get(year)!.push(doc);
      }
    }

    return map;
  }, [documents]);

  const periodStatuses = useMemo(() => {
    const result = new Map<string, PeriodStatusSummary>();

    for (const period of periods) {
      const docsForPeriod = periodMap[period.key] ?? [];
      result.set(
        period.key,
        computePeriodStatus(period, docsForPeriod, docsCoveringYear)
      );
    }

    return result;
  }, [periodMap, periods, docsCoveringYear]);

  const overallReadiness: OverallReadiness = useMemo(
    () => computeOverallReadiness(periods, periodStatuses),
    [periods, periodStatuses]
  );

  // FY options for the year chips
  const yearPeriods = useMemo(
    () =>
      periods
        .filter((p) => typeof p.endYear === 'number')
        .slice()
        .sort((a, b) => (a.endYear! - b.endYear!)),
    [periods]
  );

  function scrollToUpload() {
    if (uploadSectionRef.current) {
      uploadSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  function handleQuickUpload(periodKey: string, docRole: DocRole) {
    setSelectedPeriodKey(periodKey);

    const period = periods.find((p) => p.key === periodKey);
    if (period?.endYear) {
      setCoverageYears((prev) => (prev.length ? prev : [period.endYear!]));
    }

    setIncludePnl(docRole === 'financial_pack' || docRole === 'pnl');
    setIncludeBs(docRole === 'financial_pack' || docRole === 'balance_sheet');

    scrollToUpload();
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!includePnl && !includeBs) {
      setUploadError(
        'Please select whether this file includes P&L and/or Balance Sheet.'
      );
      return;
    }

    if (!file) {
      setUploadError('Please choose a file to upload.');
      return;
    }

    if (!coverageYears.length) {
      setUploadError(
        'Please tick at least one financial year that is included in this file.'
      );
      return;
    }

    // Determine doc_role from P&L / Balance Sheet selection
    let docRole: DocRole;
    if (includePnl && includeBs) {
      docRole = 'financial_pack';
    } else if (includePnl) {
      docRole = 'pnl';
    } else {
      docRole = 'balance_sheet';
    }

    // Choose the primary period based on the most recent year ticked
    let period: FinancialPeriod | null = null;
    const mainYear = Math.max(...coverageYears);
    const candidates = periods.filter(
      (p) => p.endYear === mainYear && p.type !== 'opening_bs'
    );
    if (candidates.length > 0) {
      period = candidates.slice().sort((a, b) => a.order - b.order)[0];
    }

    if (!period) {
      setUploadError(
        'We could not match these years to a period. Please double-check your selection.'
      );
      return;
    }

    try {
      setIsUploading(true);

      const safeName = file.name.replace(/\s+/g, '-');
      const periodKeyForPath = period.key ?? 'other';
      const filePath = `financials/${engagementId}/${periodKeyForPath}/${docRole}/${Date.now()}-${safeName}`;

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from(FINANCIAL_DOCS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        });

      if (storageError) {
        console.error('Supabase Storage upload error:', storageError);
        setUploadError('We could not upload that file. Please try again.');
        return;
      }

      // Build metadata
      const coversYears = [...coverageYears].sort();
      const meta: FinancialDocumentMeta = {
        period_key: period.key,
        period_label: period.label,
        period_type: period.type,
        doc_role: docRole,
        includes_comparatives: coversYears.length > 1,
        notes: notes || null,
        covers_years: coversYears,
      };

      // Save metadata via API
      const res = await fetch('/api/financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId,
          docType: docRole,
          filePath,
          originalFileName: file.name,
          mimeType: file.type || null,
          meta,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        document?: FinancialDocumentRow;
        error?: string;
      };

      if (!res.ok || !body.document) {
        console.error('Error saving financial doc metadata:', body.error);
        setUploadError(body.error || 'We could not save the document metadata.');
        return;
      }

      setDocuments((prev) => [...prev, body.document]);

      const docLabel =
        docRole === 'financial_pack'
          ? 'Financial pack'
          : prettyDocRoleLabel(docRole);

      setUploadSuccess(
        `Uploaded “${file.name}” as ${docLabel} for ${period.label}.`
      );

      // Reset minimal fields
      setFile(null);
      setNotes('');
      setIncludePnl(false);
      setIncludeBs(false);
      setCoverageYears([]);
    } catch (err) {
      console.error('Unexpected upload error:', err);
      setUploadError('Unexpected error while uploading. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleOpenDocument(doc: FinancialDocumentRow) {
    try {
      const { data, error } = await supabase.storage
        .from(FINANCIAL_DOCS_BUCKET)
        .createSignedUrl(doc.file_path, 60 * 60, {
          download: doc.original_file_name || undefined,
        });

      if (error || !data?.signedUrl) {
        console.error('Error creating signed URL:', error);
        alert('We could not open that file. Please try again.');
        return;
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error opening financial document:', err);
      alert('Unexpected error while opening this file.');
    }
  }

  async function handleDeleteDocument(doc: FinancialDocumentRow) {
    const confirmDelete = window.confirm(
      `Remove “${doc.original_file_name}” from this engagement?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/financials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: doc.id,
          filePath: doc.file_path,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        console.error('Error deleting financial doc:', body.error);
        alert(body.error || 'We could not remove that file.');
        return;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      console.error('Unexpected error deleting financial doc:', err);
      alert('Unexpected error while removing this file.');
    }
  }

  return (
    <div className="space-y-8">
      {/* Header + company bar + readiness pill */}
      <header className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Phase I · Financial inputs
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Financial documents
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Upload your core financial reports so Trellis can use them when we
              review performance and shape strategy. Focus on the last 3 full
              financial years plus the current year-to-date, with P&amp;L and
              Balance Sheet for each period.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
            <span className="text-xs font-medium text-slate-500">
              Financial data readiness
            </span>
            <span
              className={[
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                overallReadiness.label === 'Complete'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : overallReadiness.label === 'In progress'
                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                  : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
              ].join(' ')}
            >
              {overallReadiness.label}
            </span>
          </div>
        </div>
            <Link
            href={`/engagement/${engagementId}`}
            className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 hover:bg-slate-50"
            >
            ← Back to dashboard
            </Link>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-slate-100">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-300">
              Company
            </span>
            <span className="text-base font-semibold">{companyName}</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-300">
              Financial year end
            </span>
            <span className="text-sm font-medium">
              {financialYearEnd || 'Not set'}
            </span>
          </div>
        </div>
      </header>

      {/* Financial checklist matrix */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Financial checklist
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              For each period, upload either a full financial pack or separate
              P&amp;L and Balance Sheet. If you upload one report that includes
              multiple financial years, tick all the years covered so Trellis
              knows which periods are satisfied.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            {overallReadiness.completedRecommended} of{' '}
            {overallReadiness.totalRecommended} core slots filled
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead>
              <tr>
                <th className="py-2 pr-4 text-xs font-semibold text-slate-500">
                  Period
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">
                  P&amp;L
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">
                  Balance Sheet
                </th>
              </tr>
            </thead>
            <tbody>
              {periods
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((period) => {
                  // Ignore any legacy opening balance sheet periods
                  if (period.type === 'opening_bs') return null;

                  const status = periodStatuses.get(period.key)!;

                  return (
                    <tr key={period.key} className="border-t border-slate-100">
                      <td className="py-3 pr-4 align-middle text-sm font-medium text-slate-900">
                        {period.label}
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <ChecklistCell
                          checked={status.hasPack || status.hasPnl}
                          onUpload={() =>
                            handleQuickUpload(period.key, 'pnl')
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <ChecklistCell
                          checked={status.hasPack || status.hasBs}
                          onUpload={() =>
                            handleQuickUpload(period.key, 'balance_sheet')
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upload form */}
      <section
        ref={uploadSectionRef}
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <h2 className="text-base font-semibold text-slate-900">
          Upload a financial document
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Start with your P&amp;L and Balance Sheet for the last 3 completed
          financial years and the current year-to-date.
        </p>

        <form onSubmit={handleUpload} className="mt-4 space-y-4">
          {/* Which statements */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-800">
              Which financial statements are in this file?
            </label>
            <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-800">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                  checked={includePnl}
                  onChange={(e) => setIncludePnl(e.target.checked)}
                />
                <span>P&amp;L</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                  checked={includeBs}
                  onChange={(e) => setIncludeBs(e.target.checked)}
                />
                <span>Balance Sheet</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Select one or both. If both are selected, Trellis treats this as a
              full financial pack.
            </p>
          </div>

          {/* Year coverage */}
          <div className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-700">
            <p className="text-[11px] font-semibold text-slate-800">
              Which financial years are included in this file?
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Tick all the financial years this report covers. For example, a
              3-year comparison pack would tick three years.
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {yearPeriods.map((p) => {
                const year = p.endYear!;
                const checked = coverageYears.includes(year);
                const label =
                  p.type === 'ytd'
                    ? `FY ${year} (YTD)`
                    : `FY ${year} (full year)`;

                return (
                  <label
                    key={p.key}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-800 ring-1 ring-slate-200"
                  >
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                      checked={checked}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setCoverageYears((prev) => {
                          if (isChecked) {
                            if (prev.includes(year)) return prev;
                            return [...prev, year].sort();
                          }
                          return prev.filter((y) => y !== year);
                        });
                      }}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-3">
              <label className="block text-[11px] font-medium text-slate-700">
                Notes for later (optional)
              </label>
              <textarea
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 'Includes 3 years of P&L and Balance Sheet in one workbook.'"
              />
            </div>
          </div>

          {/* File input with drag & drop */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-800">File</label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  setFile(f);
                }
              }}
              className={[
                'mt-1 flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center text-sm',
                'cursor-pointer transition-colors',
                isDragging
                  ? 'border-slate-500 bg-slate-100 text-slate-800'
                  : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-slate-100',
              ].join(' ')}
              onClick={() => {
                document.getElementById('financial-file-input')?.click();
              }}
            >
              <input
                id="financial-file-input"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                }}
                accept=".pdf,.xls,.xlsx,.csv,.doc,.docx"
              />
              <span className="font-medium">
                Drop a file here, or click to browse
              </span>
              <span className="mt-1 text-xs text-slate-500">
                PDF, Excel, CSV, or Word. Max 20MB per file.
              </span>
              {file && (
                <span className="mt-2 text-xs text-slate-700">
                  Selected:{' '}
                  <span className="font-medium">{file.name}</span>
                </span>
              )}
            </div>
          </div>

          {uploadError && (
            <p className="text-sm text-rose-600">{uploadError}</p>
          )}
          {uploadSuccess && (
            <p className="text-sm text-emerald-700">{uploadSuccess}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isUploading ? 'Uploading…' : 'Upload document'}
            </button>
          </div>
        </form>
      </section>

      {/* Uploaded docs – flat list */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Uploaded documents
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Files listed here with tags for which statements and years they
              cover.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Total files: {documents.length}
          </p>
        </div>

        <div className="mt-4">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">
              No documents uploaded yet. Start with your last 3 full financial
              years of P&amp;L and Balance Sheet.
            </p>
          ) : (
            <ul className="space-y-2">
              {documents
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.uploaded_at).getTime() -
                    new Date(a.uploaded_at).getTime()
                )
                .map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => handleOpenDocument(doc)}
                        className="text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
                      >
                        {doc.original_file_name}
                      </button>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {buildDocTags(doc)} ·{' '}
                        {doc.mime_type ? doc.mime_type : 'Unknown type'} ·
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString('en-AU')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenDocument(doc)}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/* ----------------- helpers ----------------- */

function ChecklistCell({
  checked,
  onUpload,
  disabled,
}: {
  checked: boolean;
  onUpload: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-[11px]">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-slate-700"
        checked={checked}
        readOnly
        disabled={disabled}
      />
      {!checked && !disabled && (
        <button
          type="button"
          onClick={onUpload}
          className="text-[11px] font-semibold text-slate-700 underline-offset-2 hover:underline"
        >
          Upload
        </button>
      )}
    </div>
  );
}

function computePeriodStatus(
  period: FinancialPeriod,
  docsForPeriod: FinancialDocumentRow[],
  docsCoveringYear: Map<number, FinancialDocumentRow[]>
): PeriodStatusSummary {
  const combined: FinancialDocumentRow[] = [...docsForPeriod];
  const seen = new Set(docsForPeriod.map((d) => d.id));

  if (typeof period.endYear === 'number') {
    const extras = docsCoveringYear.get(period.endYear) ?? [];
    for (const doc of extras) {
      if (!seen.has(doc.id)) {
        combined.push(doc);
        seen.add(doc.id);
      }
    }
  }

  let hasPack = false;
  let hasPnl = false;
  let hasBs = false;

  for (const doc of combined) {
    const role = (doc.meta?.doc_role as DocRole | null) ?? 'other';
    if (role === 'financial_pack') hasPack = true;
    if (role === 'pnl') hasPnl = true;
    if (role === 'balance_sheet') hasBs = true;
  }

  let status: PeriodStatus;

  if (combined.length === 0) {
    status = 'missing';
  } else {
    const complete = hasPack || (hasPnl && hasBs);
    status = complete ? 'complete' : 'partial';
  }

  return {
    status,
    hasPack,
    hasPnl,
    hasBs,
    totalDocs: combined.length,
  };
}

function computeOverallReadiness(
  periods: FinancialPeriod[],
  periodStatuses: Map<string, PeriodStatusSummary>
): OverallReadiness {
  let totalRecommended = 0;
  let completedSlots = 0;

  for (const period of periods) {
    if (!period.isRecommended) continue;
    if (period.type === 'opening_bs') continue; // ignore legacy opening rows

    const summary = periodStatuses.get(period.key);
    if (!summary) continue;

    // Each recommended period has 2 required statements: P&L and Balance Sheet
    totalRecommended += 2;

    // P&L is satisfied by either a P&L document or a pack
    if (summary.hasPack || summary.hasPnl) completedSlots += 1;

    // Balance Sheet is satisfied by either a BS document or a pack
    if (summary.hasPack || summary.hasBs) completedSlots += 1;
  }

  let label: OverallReadiness['label'];
  if (completedSlots === 0) label = 'Not started';
  else if (completedSlots === totalRecommended) label = 'Complete';
  else label = 'In progress';

  return {
    completedRecommended: completedSlots,
    totalRecommended,
    label,
  };
}

function prettyDocRoleLabel(role: DocRole | 'other'): string {
  switch (role) {
    case 'financial_pack':
      return 'Financial pack';
    case 'pnl':
      return 'P&L';
    case 'balance_sheet':
      return 'Balance Sheet';
    case 'cash_flow':
      return 'Cash flow';
    case 'trial_balance':
      return 'Trial balance';
    case 'other':
    default:
      return 'Other';
  }
}

function buildDocTags(doc: FinancialDocumentRow): string {
  const meta = doc.meta ?? ({} as FinancialDocumentMeta);

  const role = (meta.doc_role as DocRole | null) ?? 'other';
  let stmtTag: string;
  if (role === 'financial_pack') stmtTag = 'P&L + Balance Sheet';
  else if (role === 'pnl') stmtTag = 'P&L';
  else if (role === 'balance_sheet') stmtTag = 'Balance Sheet';
  else stmtTag = prettyDocRoleLabel(role);

  const years = meta.covers_years ?? [];
  const yearsTag =
    years.length > 0
      ? years
          .slice()
          .sort()
          .map((y) => `FY ${y}`)
          .join(', ')
      : 'Years not specified';

  return `${stmtTag} · ${yearsTag}`;
}
