import type { ReactNode } from 'react';

export type Translator = (key: string, params?: Record<string, string | number>) => string;

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-tool border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
