// app/engagement/[engagementId]/ssk-swot/SskSwotView.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type SskItem = {
  id: string;
  category: "start" | "stop" | "keep" | string;
  description: string;
  participantName: string | null;
  created_at: string | null;
};

type SwotItem = {
  id: string;
  type: "strength" | "weakness" | "opportunity" | "threat" | string;
  description: string;
  participantName: string | null;
  created_at: string | null;
};

type Props = {
  engagementId: string;
  companyName: string | null;
  leaderName: string | null;
  financialYearEnd: string | null;
  sskItems: SskItem[];
  swotItems: SwotItem[];
};

export default function SskSwotView({
  engagementId,
  companyName,
  leaderName,
  financialYearEnd,
  sskItems,
  swotItems,
}: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadError(null);

      const res = await fetch(
        `/api/engagements/${encodeURIComponent(engagementId)}/ssk-swot-export`
      );

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      const safeCompany =
        (companyName || "ssk-swot-export")
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase() || "ssk-swot-export";

      a.href = url;
      a.download = `${safeCompany}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setDownloadError("Could not download export. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-AU");
  };

  const sskByCategory: Record<string, SskItem[]> = {
    start: [],
    stop: [],
    keep: [],
  };
  for (const item of sskItems) {
    const key = (item.category || "").toLowerCase();
    if (!sskByCategory[key]) sskByCategory[key] = [];
    sskByCategory[key].push(item);
  }

  const swotByType: Record<string, SwotItem[]> = {
    strength: [],
    weakness: [],
    opportunity: [],
    threat: [],
  };
  for (const item of swotItems) {
    const key = (item.type || "").toLowerCase();
    if (!swotByType[key]) swotByType[key] = [];
    swotByType[key].push(item);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header / Actions */}
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            SSK &amp; SWOT – Input Summary
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            View and export all Start / Stop / Keep and SWOT inputs captured so
            far for this engagement.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {companyName && (
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                Company:{" "}
                <span className="font-medium text-slate-700">
                  {companyName}
                </span>
              </span>
            )}
            {leaderName && (
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                Leader:{" "}
                <span className="font-medium text-slate-700">
                  {leaderName}
                </span>
              </span>
            )}
            {financialYearEnd && (
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                FY End:{" "}
                <span className="font-medium text-slate-700">
                  {financialYearEnd}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Back to dashboard */}
          <Link
            href={`/engagement/${encodeURIComponent(engagementId)}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Back to dashboard
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Print
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {downloading ? "Preparing…" : "Download as Excel"}
          </button>
        </div>
      </header>

      {downloadError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {downloadError}
        </div>
      )}

      {/* Content layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* SSK */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Start / Stop / Keep Responses
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            All SSK responses captured for this engagement, grouped by category.
          </p>

          <div className="mt-4 space-y-4">
            {(["start", "stop", "keep"] as const).map((cat) => {
              const items = sskByCategory[cat] ?? [];
              const label =
                cat === "start" ? "Start" : cat === "stop" ? "Stop" : "Keep";

              return (
                <div key={cat}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </h3>
                  {items.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">
                      No items captured yet.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-sm">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-lg bg-slate-50 px-3 py-2 text-slate-800 ring-1 ring-slate-100"
                        >
                          <div>{item.description}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {item.participantName && (
                              <>
                                By{" "}
                                <span className="font-medium">
                                  {item.participantName}
                                </span>
                              </>
                            )}
                            {item.created_at && (
                              <>
                                {item.participantName ? " • " : ""}
                                Added: {formatDate(item.created_at)}
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SWOT */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">SWOT Items</h2>
          <p className="mt-1 text-xs text-slate-500">
            All SWOT entries captured for this engagement, grouped by quadrant.
          </p>

          <div className="mt-4 space-y-4">
            {(
              [
                ["strength", "Strengths"],
                ["weakness", "Weaknesses"],
                ["opportunity", "Opportunities"],
                ["threat", "Threats"],
              ] as const
            ).map(([key, label]) => {
              const items = swotByType[key] ?? [];
              return (
                <div key={key}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </h3>
                  {items.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">
                      No items captured yet.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-sm">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-lg bg-slate-50 px-3 py-2 text-slate-800 ring-1 ring-slate-100"
                        >
                          <div>{item.description}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {item.participantName && (
                              <>
                                By{" "}
                                <span className="font-medium">
                                  {item.participantName}
                                </span>
                              </>
                            )}
                            {item.created_at && (
                              <>
                                {item.participantName ? " • " : ""}
                                Added: {formatDate(item.created_at)}
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
