// app/engagement/[engagementId]/swot/SwotForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  engagementId: string;
};

export default function SwotForm({ engagementId }: Props) {
  const router = useRouter();

  const [participantName, setParticipantName] = useState('');
  const [strengthsText, setStrengthsText] = useState('');
  const [weaknessesText, setWeaknessesText] = useState('');
  const [opportunitiesText, setOpportunitiesText] = useState('');
  const [threatsText, setThreatsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toList(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !strengthsText.trim() &&
      !weaknessesText.trim() &&
      !opportunitiesText.trim() &&
      !threatsText.trim()
    ) {
      setError('Please add at least one SWOT item before saving.');
      return;
    }

    const payload = {
      engagementId,
      participantName: participantName.trim() || null,
      strengths: toList(strengthsText),
      weaknesses: toList(weaknessesText),
      opportunities: toList(opportunitiesText),
      threats: toList(threatsText),
    };

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/swot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to save SWOT');
      }

      setSuccess('SWOT response saved.');
      setStrengthsText('');
      setWeaknessesText('');
      setOpportunitiesText('');
      setThreatsText('');
      // optional: keep participant name for multiple entries
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong saving SWOT.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-200">
          {success}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Your name (optional)
        </label>
        <input
          type="text"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Jamie"
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Used to label each SWOT response. Leave blank to stay anonymous.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SwotTextarea
          label="Strengths"
          value={strengthsText}
          onChange={setStrengthsText}
          helper="One per line – internal strengths, capabilities, assets."
        />
        <SwotTextarea
          label="Weaknesses"
          value={weaknessesText}
          onChange={setWeaknessesText}
          helper="One per line – internal weaknesses, constraints, gaps."
        />
        <SwotTextarea
          label="Opportunities"
          value={opportunitiesText}
          onChange={setOpportunitiesText}
          helper="One per line – external opportunities or trends to leverage."
        />
        <SwotTextarea
          label="Threats"
          value={threatsText}
          onChange={setThreatsText}
          helper="One per line – external threats, risks, or headwinds."
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Saving SWOT…' : 'Save SWOT response'}
        </button>
      </div>
    </form>
  );
}

type TextareaProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  helper?: string;
};

function SwotTextarea({ label, value, onChange, helper }: TextareaProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        placeholder="Type one item per line…"
      />
      {helper && (
        <p className="mt-1 text-[11px] text-slate-500">
          {helper}
        </p>
      )}
    </div>
  );
}
