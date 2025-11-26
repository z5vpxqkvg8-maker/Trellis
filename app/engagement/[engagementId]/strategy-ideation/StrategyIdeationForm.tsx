// app/engagement/[engagementId]/strategy-ideation/StrategyIdeationForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


type DomainKey =
  | 'growth_market'
  | 'growth_product'
  | 'operations'
  | 'people'
  | 'finance';

type InitialData = {
  anchorsNotes: string;
  domainNotes: Record<DomainKey, string>;
};

type StrategyIdeationFormProps = {
  engagementId: string;
  initialData: InitialData;
};

type DomainMeta = {
  key: DomainKey;
  label: string;
  prompts: string[];
  stretch: string;
};

const DOMAIN_META: DomainMeta[] = [
  {
    key: 'growth_market',
    label: 'Growth – Market & Customer Expansion',
    prompts: [
      'Where are we currently growing? Where is demand pulling us?',
      'What new customer segments could we serve 10x better?',
      'What customer pain could we solve more deeply (not just faster)?',
      'Where has the competitive landscape changed?',
      'How relevant is our USP?',
      'What would it take to move into a blue ocean?',
    ],
    stretch:
      'If we had to triple our revenue from existing customers only, what would we do?',
  },
  {
    key: 'growth_product',
    label: 'Growth – Product & Service Innovation',
    prompts: [
      'What elements of our offer are becoming commoditized?',
      'What do our top clients love that we’re under-leveraging?',
      'What innovations would make competitors irrelevant?',
      'What’s one offering we’ve been scared to launch?',
    ],
    stretch: 'What would we build if we weren’t afraid to fail?',
  },
  {
    key: 'operations',
    label: 'Operations',
    prompts: [
      'What systems are currently bottlenecks?',
      'What roles or processes break if we double volume?',
      'What can we automate, outsource, or simplify?',
      'What’s the #1 thing each leader is doing that they shouldn’t?',
      'What is their 10x 80:20?',
    ],
    stretch:
      'If we had to grow 50% without hiring anyone, what would we change?',
  },
  {
    key: 'people',
    label: 'People & Culture',
    prompts: [
      'Where is team engagement highest? Why?',
      'What’s holding back leadership development?',
      'What roles do we need to grow into our vision?',
      'How do we scale culture with new hires?',
    ],
    stretch:
      'If we rebuilt our org chart from scratch, what would it look like?',
  },
  {
    key: 'finance',
    label: 'Financial Leverage & Efficiency',
    prompts: [
      'What costs have crept in without ROI?',
      'Where are we leaving margin or pricing power on the table?',
      'What parts of the business drive 80% of profit?',
      'What financial model would better fund our future?',
    ],
    stretch:
      'If we had to 10x profits with no new revenue, where would we start?',
  },
];

export default function StrategyIdeationForm({
  engagementId,
  initialData,
}: StrategyIdeationFormProps) {
  const router = useRouter();

  const [anchorsNotes, setAnchorsNotes] = useState(
    initialData.anchorsNotes || '',
  );

  const [domainNotes, setDomainNotes] = useState<Record<DomainKey, string>>({
    growth_market: initialData.domainNotes.growth_market || '',
    growth_product: initialData.domainNotes.growth_product || '',
    operations: initialData.domainNotes.operations || '',
    people: initialData.domainNotes.people || '',
    finance: initialData.domainNotes.finance || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNotesChange(key: DomainKey, value: string) {
    setDomainNotes((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const res = await fetch('/api/strategy-ideation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId,
          anchors: { notes: anchorsNotes },
          growthMarket: { notes: domainNotes.growth_market },
          growthProduct: { notes: domainNotes.growth_product },
          operations: { notes: domainNotes.operations },
          people: { notes: domainNotes.people },
          finance: { notes: domainNotes.finance },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Error saving strategy ideation.');
      }

      setSaved(true);
      router.refresh();
    } catch (err: any) {
      console.error('Error saving strategy ideation', err);
      setError(err.message || 'Unexpected error while saving.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Anchors */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Anchor notes for this plan
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Capture any constraints, big bets, or success criteria you want to
          hold in mind while you brainstorm. This is the “guardrails” for your
          strategy conversation.
        </p>
        <textarea
          className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 p-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          rows={4}
          value={anchorsNotes}
          onChange={(e) => {
            setAnchorsNotes(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      {/* Domains */}
      <div className="space-y-5">
        {DOMAIN_META.map((domain) => (
          <section
            key={domain.key}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              {domain.label}
            </h3>

            {/* Main prompts */}
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
              {domain.prompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>

            {/* Stretch prompt */}
            <p className="mt-3 text-[11px] font-semibold text-emerald-700">
              Stretch prompt: {domain.stretch}
            </p>

            {/* Response area */}
            <textarea
              className="mt-3 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={5}
              placeholder="Let people talk freely and capture the highlights here. Use bullet points, fragments, and quotes from the conversation."
              value={domainNotes[domain.key]}
              onChange={(e) => handleNotesChange(domain.key, e.target.value)}
            />
          </section>
        ))}
      </div>

      {/* Save bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="text-xs text-slate-500">
          {error && <span className="text-red-600">{error}</span>}
          {!error && saved && (
            <span className="text-emerald-700">
              Saved. These notes will feed later AI-generated strategy options
              and prioritisation.
            </span>
          )}
          {!error && !saved && !isSaving && (
            <span>Changes not yet saved.</span>
          )}
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save brainstorm notes'}
        </button>
        <Link
        href={`/engagement/${engagementId}`}
        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-100"
        >
        Return to Dashboard
        </Link>

      </div>
    </form>
  );
}
