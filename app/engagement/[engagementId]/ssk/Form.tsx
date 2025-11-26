'use client';

import { FormEvent, useState } from 'react';

type Props = {
  engagementId: string;
};

export default function Form({ engagementId }: Props) {
  const [participantName, setParticipantName] = useState('');
  const [start, setStart] = useState('');
  const [stop, setStop] = useState('');
  const [keep, setKeep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!participantName.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!start.trim() && !stop.trim() && !keep.trim()) {
      setError('Please add at least one comment in Start, Stop, or Keep.');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/start-stop-keep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId,
          participantName,
          start,
          stop,
          keep,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Something went wrong.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to submit right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setSubmitted(false);
    setStart('');
    setStop('');
    setKeep('');
    // keep name so they can submit multiple responses easily
  }

  // new: best-effort close handler
  function handleClose() {
    const fallback = 'https://www.salesup.com.au';
    try {
      // try to close the window — browsers allow this when the tab/window was opened by script
      window.open('', '_self');
      window.close();

      // If the tab wasn't closed (browser blocked), fallback to salesup
      setTimeout(() => {
        if (!window.closed) {
          try {
            if (window.opener) {
              // detach opener, then try to close again
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              window.opener = null;
              window.close();
            }
          } catch {}
          if (!window.closed) window.location.href = fallback;
        }
      }, 200);
    } catch {
      // final fallback: navigate to salesup
      window.location.href = fallback;
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-sm text-slate-700">
        <p className="text-base font-semibold text-slate-900">
          Thank you — your response has been recorded.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Submit another
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <label
          htmlFor="participantName"
          className="text-sm font-medium text-slate-800"
        >
          Your name <span className="text-red-500">*</span>
        </label>
        <input
          id="participantName"
          type="text"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="start" className="text-sm font-medium text-slate-800">
          What should we START doing?
        </label>
        <textarea
          id="start"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="stop" className="text-sm font-medium text-slate-800">
          What should we STOP doing?
        </label>
        <textarea
          id="stop"
          value={stop}
          onChange={(e) => setStop(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="keep" className="text-sm font-medium text-slate-800">
          What should we KEEP doing?
        </label>
        <textarea
          id="keep"
          value={keep}
          onChange={(e) => setKeep(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}
