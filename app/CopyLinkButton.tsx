// app/CopyLinkButton.tsx
'use client';

import { useState } from 'react';

type CopyLinkButtonProps = {
  path: string; // e.g. `/engagement/123/ssk`
};

export default function CopyLinkButton({ path }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}${path}`;

      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link', error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-200"
    >
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  );
}
