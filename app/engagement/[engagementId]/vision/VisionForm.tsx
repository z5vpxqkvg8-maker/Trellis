// app/engagement/[engagementId]/vision/VisionForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import HelpModal from './HelpModal';

type VisionFormProps = {
  engagementId: string;
  initialValues: {
    purpose: string;
    bhag: string;
    playingRules: string;
    threeYearVision: string;
    annualGoals: string;
    coreKpis: string;
  };
};

export default function VisionForm({
  engagementId,
  initialValues,
}: VisionFormProps) {
  const [purpose, setPurpose] = useState(initialValues.purpose || '');
  const [bhag, setBhag] = useState(initialValues.bhag || '');
  const [playingRules, setPlayingRules] = useState(
    initialValues.playingRules || ''
  );
  const [threeYearVision, setThreeYearVision] = useState(
    initialValues.threeYearVision || ''
  );
  const [annualGoals, setAnnualGoals] = useState(
    initialValues.annualGoals || ''
  );
  const [coreKpis, setCoreKpis] = useState(initialValues.coreKpis || '');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [showPurposeHelp, setShowPurposeHelp] = useState(false);
  const [showPlayingRulesHelp, setShowPlayingRulesHelp] = useState(false);

  const textareaClasses =
    'mt-2 block w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    const payload = {
      engagementId,
      purpose,
      bhag,
      playing_rules: playingRules,
      three_year_vision: threeYearVision,
      annual_goals: annualGoals,
      core_kpis: coreKpis,
    };

    try {
      setIsSaving(true);

      const res = await fetch('/api/vision-and-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let body: any = {};
      try {
        body = rawText ? JSON.parse(rawText) : {};
      } catch {
        body = { raw: rawText };
      }

      if (!res.ok) {
        const message =
          body?.error ||
          `Request failed with status ${res.status}: ${rawText || 'No body'}`;
        throw new Error(message);
      }

      setSavedMessage('Saved');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Purpose */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label className="block text-sm font-medium text-slate-800">
              1. Purpose
            </label>
            <button
              type="button"
              onClick={() => setShowPurposeHelp(true)}
              className="rounded-full border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Need help?
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Why does this business exist beyond making money? What positive
            difference are you here to make?
          </p>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={3}
            className={textareaClasses}
          />
        </div>

        {/* 2. BHAG */}
        <div>
          <label className="block text-sm font-medium text-slate-800">
            2. BHAG (Big Hairy Audacious Goal)
          </label>
          <p className="mt-1 text-xs text-slate-500">
            A bold, long-term (10+ year) goal that is clear, compelling, and a
            bit uncomfortable – something you can imagine but don&apos;t yet
            know how to achieve.
          </p>
          <textarea
            value={bhag}
            onChange={(e) => setBhag(e.target.value)}
            rows={3}
            className={textareaClasses}
          />
        </div>

        {/* 3. Playing Rules */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label className="block text-sm font-medium text-slate-800">
              3. Playing Rules
            </label>
            <button
              type="button"
              onClick={() => setShowPlayingRulesHelp(true)}
              className="rounded-full border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Need help?
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            The guardrails for how you want the business to operate (e.g. ways
            you will and won&apos;t grow, deal with customers, hire, etc.).
          </p>
          <textarea
            value={playingRules}
            onChange={(e) => setPlayingRules(e.target.value)}
            rows={3}
            className={textareaClasses}
          />
        </div>

        {/* 4. 3-Year Vision */}
        <div>
          <label className="block text-sm font-medium text-slate-800">
            4. 3-Year Vision
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Describe what success looks like three years from now – customers,
            team, finances, culture, and how the business feels to run.
          </p>
          <textarea
            value={threeYearVision}
            onChange={(e) => setThreeYearVision(e.target.value)}
            rows={4}
            className={textareaClasses}
          />
        </div>

        {/* 5. Top 3–5 Annual Goals */}
        <div>
          <label className="block text-sm font-medium text-slate-800">
            5. Top 3–5 Annual Goals
          </label>
          <p className="mt-1 text-xs text-slate-500">
            List the 3–5 most important outcomes for the next 12 months (big
            wins, not tasks).
          </p>
          <textarea
            value={annualGoals}
            onChange={(e) => setAnnualGoals(e.target.value)}
            rows={4}
            className={textareaClasses}
          />
        </div>

        {/* 6. 3–5 Core KPIs */}
        <div>
          <label className="block text-sm font-medium text-slate-800">
            6. 3–5 Core KPIs
          </label>
          <p className="mt-1 text-xs text-slate-500">
            The small set of metrics you&apos;ll track to know if the strategy
            is working.
          </p>
          <textarea
            value={coreKpis}
            onChange={(e) => setCoreKpis(e.target.value)}
            rows={3}
            className={textareaClasses}
          />
        </div>

        {/* Status + actions */}
        {error && (
          <p className="text-sm font-medium text-red-600">{error}</p>
        )}
        {!error && savedMessage && (
          <p className="text-sm font-medium text-emerald-700">
            {savedMessage}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href={`/engagement/${engagementId}`}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to engagement
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save Vision'}
          </button>
        </div>
      </form>

      {/* Purpose modal */}
      {showPurposeHelp && (
        <HelpModal
          title="Developing Your Purpose"
          onClose={() => setShowPurposeHelp(false)}
          pdfHref="/helper-docs/developing-your-purpose.pdf"
        >
          <p className="text-sm text-slate-700">
            Your Purpose explains why your business exists beyond making money.
            It should be short, memorable and emotionally true.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>If you closed tomorrow, what meaningful gap would you leave?</li>
            <li>What change are you trying to create for your customers?</li>
            <li>What work gives you energy even when it&apos;s hard?</li>
          </ul>
          <p className="mt-3 text-sm text-slate-700">
            Try starting with{' '}
            <span className="font-semibold">“We exist to…”</span> and finish the
            sentence in one or two lines.
          </p>
        </HelpModal>
      )}

      {/* Playing Rules modal */}
      {showPlayingRulesHelp && (
        <HelpModal
          title="Developing Your Playing Rules"
          onClose={() => setShowPlayingRulesHelp(false)}
          pdfHref="/helper-docs/developing-your-playing-rules.pdf"
        >
          <p className="text-sm text-slate-700">
            Playing Rules describe how you behave when you&apos;re at your best.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>
              Think of moments when your team was really humming – what
              behaviours were present?
            </li>
            <li>
              What behaviours won&apos;t you tolerate, even in a high performer?
            </li>
            <li>
              If your kids worked here one day, what culture would you want
              them to experience?
            </li>
          </ul>
          <p className="mt-3 text-sm text-slate-700">
            Aim for <span className="font-semibold">3–5 clear rules</span>. Go
            beyond one-word values by adding a short phrase that makes it
            uniquely you.
          </p>
        </HelpModal>
      )}
    </>
  );
}
