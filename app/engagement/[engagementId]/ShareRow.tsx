'use client';

import { useState } from 'react';

type ShareRowProps = {
  label: string;
  path: string; // e.g. `/engagement/${engagementId}/ssk`
};

export function ShareRow({ label, path }: ShareRowProps) {
  // Build the full URL on each render – simple and reliable
  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${path}`
      : path;

  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={fullUrl}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-mono text-slate-800"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
