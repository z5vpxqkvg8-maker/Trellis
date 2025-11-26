// app/engagement/[engagementId]/ModuleCard.tsx
"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";

export type ModuleStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "available"
  | "not_ready"
  | "coming_soon";

type Props = {
  engagementId: string;
  title: string;
  description: string;
  href?: string;
  status: ModuleStatus;
  primaryLabel: string;
  count?: number | null;
  slug?: string;

  // Extras
  children?: ReactNode;
  disabled?: boolean;
  /** Optional path that the “Copy link” button should copy, e.g. `/engagement/123/start-stop-keep` */
  copyPath?: string;
};

function statusLabel(status: ModuleStatus): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "in_progress":
      return "In progress";
    case "complete":
      return "Complete";
    case "available":
      return "Ready";
    case "not_ready":
      return "Not ready yet";
    case "coming_soon":
      return "Coming soon";
    default:
      return "";
  }
}

function statusClasses(status: ModuleStatus): string {
  switch (status) {
    case "complete":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "in_progress":
    case "available":
      return "bg-sky-50 text-sky-700 ring-sky-100";
    case "not_ready":
      return "bg-slate-50 text-slate-500 ring-slate-200";
    case "coming_soon":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "not_started":
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

export default function ModuleCard({
  title,
  description,
  href,
  status,
  primaryLabel,
  count,
  children,
  disabled = false,
  copyPath,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyPath) return;
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(origin + copyPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const PrimaryInner = (
    <div
      className={`inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-medium shadow-sm ${
        disabled
          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {primaryLabel}
    </div>
  );

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200 hover:shadow-md">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${statusClasses(
              status
            )}`}
          >
            {statusLabel(status)}
          </span>
        </div>

        <p className="text-xs text-slate-500">{description}</p>

        {typeof count === "number" && (
          <p className="text-xs text-slate-400">
            {count === 0
              ? "No entries yet"
              : `${count} item${count === 1 ? "" : "s"} captured`}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* PRIMARY BUTTON */}
        {disabled || !href ? (
          PrimaryInner
        ) : (
          <Link href={href}>{PrimaryInner}</Link>
        )}

        {/* OPTIONAL CHILDREN (e.g., summary link) */}
        {children && (
          <div className="inline-flex">
            {children}
          </div>
        )}

        {/* COPY LINK BUTTON */}
        {copyPath && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
          >
            {copied ? "Link copied!" : "Copy link"}
          </button>
        )}
      </div>

    </article>
  );
}
