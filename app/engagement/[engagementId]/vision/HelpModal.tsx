// app/engagement/[engagementId]/vision/HelpModal.tsx

type HelpModalProps = {
  title: string;
  pdfHref: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function HelpModal({
  title,
  pdfHref,
  onClose,
  children,
}: HelpModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              Use this guide to draft your answer. You can also download the full
              worksheet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-80 space-y-3 overflow-y-auto text-sm">
          {children}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Download full PDF guidebook
          </a>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
