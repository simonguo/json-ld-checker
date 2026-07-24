import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const join = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'border-accent-500 bg-accent-500 text-white hover:border-accent-600 hover:bg-accent-600',
  secondary: 'border-border bg-surface text-ink hover:bg-gray-50',
  ghost: 'border-transparent bg-transparent text-muted hover:bg-gray-100 hover:text-ink',
  danger: 'border-danger-500 bg-surface text-danger-500 hover:bg-danger-50',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-2.5 py-1 text-xs',
  md: 'min-h-9 px-3 py-1.5 text-sm',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={join(
        'inline-flex items-center justify-center gap-1.5 rounded-tool border font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  active?: boolean;
}

export function IconButton({ label, children, active, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={join(
        'inline-flex h-8 w-8 items-center justify-center rounded-tool border border-transparent',
        'text-muted transition-colors hover:bg-gray-100 hover:text-ink disabled:pointer-events-none disabled:opacity-50',
        active && 'bg-accent-50 text-accent-600',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'border-border bg-gray-50 text-muted',
  accent: 'border-accent-100 bg-accent-50 text-accent-700',
  success: 'border-success-50 bg-success-50 text-success-600',
  warning: 'border-warning-50 bg-warning-50 text-warning-600',
  danger: 'border-danger-50 bg-danger-50 text-danger-600',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span className={join('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium', badgeTones[tone], className)}>
      {children}
    </span>
  );
}

interface SegmentItem<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  items,
  onChange,
  label,
  className,
}: {
  value: T;
  items: SegmentItem<T>[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={join('inline-flex rounded-tool border border-border bg-gray-50 p-0.5', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          disabled={item.disabled}
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
          className={join(
            'min-h-7 rounded px-2 py-1 text-xs font-medium transition-colors',
            value === item.value ? 'bg-surface text-ink' : 'text-muted hover:text-ink',
            item.disabled && 'cursor-not-allowed opacity-40',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

type NoticeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const noticeTones: Record<NoticeTone, string> = {
  neutral: 'border-border bg-gray-50 text-ink',
  accent: 'border-accent-100 bg-accent-50 text-accent-700',
  success: 'border-success-50 bg-success-50 text-success-600',
  warning: 'border-warning-50 bg-warning-50 text-warning-600',
  danger: 'border-danger-50 bg-danger-50 text-danger-600',
};

export function Notice({
  tone = 'neutral',
  title,
  children,
  actions,
  className,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={join('rounded-tool border px-3 py-2.5 text-sm', noticeTones[tone], className)} role={tone === 'danger' ? 'alert' : 'status'}>
      {title && <div className="font-medium">{title}</div>}
      {children && <div className={join('text-xs leading-5', title && 'mt-1')}>{children}</div>}
      {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={join('flex min-h-48 flex-col items-start justify-center px-4 py-8', className)}>
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 max-w-md text-xs leading-5 text-muted">{description}</p>}
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={join('block', className)}>
      <span className="mb-1.5 block text-xs font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-5 text-muted">{hint}</span>}
    </div>
  );
}

export const controlClassName =
  'w-full rounded-tool border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 disabled:bg-gray-100 disabled:text-muted';
