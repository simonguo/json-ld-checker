import {
  AlertCircle,
  Bot,
  Braces,
  CheckCircle2,
  ChevronDown,
  History,
  RefreshCw,
  SearchCode,
  Settings,
} from 'lucide-react';
import type { ValidationSummary } from '@/lib/validator';
import type { JsonLdInspectionItem } from '@/lib/json-ld';
import { formatJsonPath } from '@/lib/json-path';
import type { SidePanelView } from '../types';

const chromeIconButton =
  'inline-flex h-7 w-7 flex-none items-center justify-center rounded-[3px] border border-transparent text-[#5f6368] transition-colors hover:bg-[#e8eaed] hover:text-[#202124] active:bg-[#dadce0] disabled:pointer-events-none disabled:opacity-50';

export function SidePanelHeader({
  hostname,
  schemaCount,
  summary,
  refreshing,
  aiActive,
  onRefresh,
  onAiTools,
  onSettings,
  labels,
}: {
  hostname: string;
  schemaCount: number;
  summary?: ValidationSummary;
  refreshing: boolean;
  aiActive: boolean;
  onRefresh: () => void;
  onAiTools: () => void;
  onSettings: () => void;
  labels: {
    product: string;
    refresh: string;
    aiTools: string;
    settings: string;
    schemas: string;
    noSchema: string;
    valid: string;
    issues: string;
  };
}) {
  const issueCount = (summary?.errors || 0) + (summary?.warnings || 0);

  return (
    <header className="flex h-9 flex-none items-center gap-1 border-b border-[#c7d1e0] bg-[#f3f6fc] px-1.5 text-[#202124]">
      <div
        className="flex h-7 flex-none items-center gap-1.5 rounded-[3px] px-1.5"
        title={labels.product}
      >
        <div
          className="flex h-5 w-5 flex-none items-center justify-center text-[#0b57d0]"
          aria-hidden="true"
        >
          <Braces size={16} strokeWidth={2.1} />
        </div>
        <span className="text-[12px] font-semibold tracking-[-0.01em]">JSON-LD</span>
      </div>
      <span aria-hidden="true" className="mx-0.5 h-5 w-px flex-none bg-[#d6deeb]" />

      <div className="min-w-0 flex-1 truncate px-1 font-mono text-[10px] text-[#5f6368]" title={hostname}>
        {hostname || '—'}
      </div>

      <span
        className={[
          'hidden flex-none items-center gap-1 px-1 font-mono text-[10px] min-[360px]:inline-flex',
          schemaCount > 0 ? 'text-[#5f6368]' : 'text-[#b06000]',
        ].join(' ')}
      >
        {schemaCount > 0 ? `${schemaCount} ${labels.schemas}` : labels.noSchema}
      </span>

      {summary && (
        <span
          className={[
            'inline-flex h-6 min-w-6 flex-none items-center justify-center gap-1 rounded-[3px] px-1 font-mono text-[10px]',
            issueCount > 0 ? 'text-[#c5221f]' : 'text-[#188038]',
          ].join(' ')}
          title={issueCount > 0 ? `${issueCount} ${labels.issues}` : labels.valid}
        >
          {issueCount > 0 ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
          <span>{issueCount}</span>
        </span>
      )}

      <span aria-hidden="true" className="mx-0.5 h-5 w-px flex-none bg-[#d6deeb]" />
      <button
        type="button"
        className={[
          chromeIconButton,
          aiActive ? 'bg-[#d3e3fd] text-[#0b57d0]' : '',
        ].join(' ')}
        onClick={onAiTools}
        aria-pressed={aiActive}
        aria-label="AI"
        title={labels.aiTools}
      >
        <Bot size={15} />
      </button>
      <button
        type="button"
        className={chromeIconButton}
        aria-label={labels.refresh}
        title={labels.refresh}
        onClick={onRefresh}
        disabled={refreshing}
      >
        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
      </button>
      <button
        type="button"
        className={chromeIconButton}
        aria-label={labels.settings}
        title={labels.settings}
        onClick={onSettings}
      >
        <Settings size={15} />
      </button>
    </header>
  );
}

export function PrimaryNav({
  value,
  issueCount,
  onChange,
  labels,
}: {
  value: SidePanelView;
  issueCount: number;
  onChange: (view: SidePanelView) => void;
  labels: { inspector: string; issues: string; history: string };
}) {
  const items = [
    { value: 'inspector' as const, label: labels.inspector, icon: SearchCode },
    { value: 'issues' as const, label: labels.issues, icon: AlertCircle, count: issueCount },
    { value: 'history' as const, label: labels.history, icon: History },
  ];

  return (
    <nav
      aria-label="Primary"
      className="flex h-9 flex-none items-stretch gap-1 border-b border-[#c7d1e0] bg-[#f3f6fc] px-1.5"
    >
      {items.map(({ value: itemValue, label, icon: Icon, count }) => {
        const active = value === itemValue;
        return (
          <button
            key={itemValue}
            type="button"
            onClick={() => onChange(itemValue)}
            aria-current={active ? 'page' : undefined}
            className={[
              'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-t-[3px] px-1 text-[11px] font-medium transition-colors',
              active ? 'bg-white text-[#0b57d0]' : 'text-[#3c4043] hover:bg-[#e8eef8]',
            ].join(' ')}
          >
            <Icon size={13} strokeWidth={active ? 2.1 : 1.8} />
            <span className="truncate">{label}</span>
            {typeof count === 'number' && count > 0 && (
              <span className="min-w-4 rounded-[2px] bg-[#fce8e6] px-1 text-center font-mono text-[9px] leading-4 text-[#c5221f]">
                {count}
              </span>
            )}
            {active && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[#1a73e8]" />}
          </button>
        );
      })}
    </nav>
  );
}

export function SchemaPicker({
  items,
  selectedIndex,
  onChange,
  getIssueCount,
  unknownType,
  schemaLabel,
}: {
  items: JsonLdInspectionItem[];
  selectedIndex: number;
  onChange: (index: number) => void;
  getIssueCount: (item: JsonLdInspectionItem) => number;
  unknownType: string;
  schemaLabel: string;
}) {
  if (items.length < 2) return null;

  const selectedItem = items[selectedIndex];
  const selectedTypeLabel =
    selectedItem?.kind === 'parse-error'
      ? 'JSON parse error'
      : selectedItem?.schemaTypes.join(', ') || unknownType;
  const issueCount = getIssueCount(selectedItem);

  return (
    <div className="flex h-8 flex-none items-center border-b border-[#c7d1e0] bg-[#f3f6fc] px-2">
      <label className="relative flex min-w-0 flex-1 cursor-pointer items-center gap-2">
        <span className="flex-none text-[10px] font-medium text-[#5f6368]">
          {schemaLabel}
        </span>
        <span className="flex-none font-mono text-[9px] text-[#5f6368]">
          {selectedIndex + 1}:{items.length}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#202124]">
          {selectedTypeLabel}
        </span>
        {issueCount > 0 && (
          <span className="flex-none font-mono text-[9px] text-[#c5221f]">
            {issueCount}
          </span>
        )}
        <ChevronDown size={13} className="flex-none text-[#5f6368]" />
        <select
          value={selectedIndex}
          onChange={(event) => onChange(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={schemaLabel}
        >
          {items.map((item, index) => {
            const typeLabel =
              item.kind === 'parse-error'
                ? 'JSON parse error'
                : item.schemaTypes.join(', ') || unknownType;
            const issueCount = getIssueCount(item);
            const pathLabel =
              item.path.length > 0 ? ` · ${formatJsonPath(item.path)}` : '';
            return (
              <option key={item.id} value={index}>
                {index + 1}/{items.length} · {typeLabel}{pathLabel} · {issueCount}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}
