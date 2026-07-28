import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui';

export function ReviewPrompt({
  title,
  description,
  reviewLabel,
  dismissLabel,
  onReview,
  onDismiss,
}: {
  title: string;
  description: string;
  reviewLabel: string;
  dismissLabel: string;
  onReview: () => void;
  onDismiss: () => void;
}) {
  return (
    <aside
      aria-live="polite"
      className="absolute inset-x-2 bottom-2 z-30 rounded-[6px] border border-[#b6d7a8] bg-white p-3 shadow-overlay"
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-gray-100 hover:text-ink"
        aria-label={dismissLabel}
      >
        <X size={14} />
      </button>
      <div className="flex items-start gap-2.5 pr-6">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded bg-success-50 text-success-600">
          <Star size={15} />
        </span>
        <div>
          <h2 className="text-xs font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-[11px] leading-4 text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={onDismiss}>
          {dismissLabel}
        </Button>
        <Button variant="primary" icon={<Star size={13} />} onClick={onReview}>
          {reviewLabel}
        </Button>
      </div>
    </aside>
  );
}
