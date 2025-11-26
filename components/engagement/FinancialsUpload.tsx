// components/engagement/FinancialsUpload.tsx
'use client';

import { useState } from 'react';

type FinancialDoc = {
  id: string;
  original_file_name: string;
  doc_type: string | null;
  uploaded_at: string;
};

type Props = {
  engagementId: string;
  existingDocs: FinancialDoc[];
};

export default function FinancialsUpload({
  engagementId,
  existingDocs,
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<'pnl' | 'balance_sheet' | 'other'>(
    'pnl'
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const uploads = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('engagementId', engagementId);
        formData.append('docType', docType);

        const res = await fetch('/api/financials', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          let msg = 'Upload failed';
          try {
            const data = await res.json();
            if (data?.error) msg = data.error;
          } catch {
            // ignore
          }
          throw new Error(msg);
        }
      });

      await Promise.all(uploads);
      setMessage(
        'Financial files uploaded successfully. Refresh to see them in the list.'
      );
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
          value={docType}
          onChange={(e) => setDocType(e.target.value as any)}
          disabled={isUploading}
        >
          <option value="pnl">P&amp;L</option>
          <option value="balance_sheet">Balance sheet</option>
          <option value="other">Other</option>
        </select>

        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
          {isUploading ? 'Uploading…' : 'Upload financial file(s)'}
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
            accept=".pdf,.xls,.xlsx,.csv"
            disabled={isUploading}
          />
        </label>
      </div>

      {message && (
        <p className="text-[11px] text-emerald-700">{message}</p>
      )}
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {existingDocs && existingDocs.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-[11px] font-semibold text-slate-700">
            Previously uploaded:
          </p>
          <ul className="space-y-1 text-[11px] text-slate-600">
            {existingDocs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1"
              >
                <span className="truncate">{doc.original_file_name}</span>
                <span className="whitespace-nowrap text-slate-500">
                  {(doc.doc_type || 'other').replace('_', ' ')} ·{' '}
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
