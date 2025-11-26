// components/engagement/CustomerInsightsUpload.tsx
'use client';

import { useState } from 'react';

type CustomerInsightsDoc = {
  id: string;
  original_file_name: string;
  uploaded_at: string;
};

type Props = {
  engagementId: string;
  existingDocs: CustomerInsightsDoc[];
};

export default function CustomerInsightsUpload({
  engagementId,
  existingDocs,
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('engagementId', engagementId);

    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/customer-insights', {
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

      setMessage('Document uploaded successfully. Refresh to see it in the list.');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
        {isUploading ? 'Uploading…' : 'Upload document'}
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
          disabled={isUploading}
        />
      </label>

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
