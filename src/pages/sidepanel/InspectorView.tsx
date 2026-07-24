import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JSONTree } from 'react-json-tree';
import { ArrowDownAZ, Check, Clipboard, Code2, Download, RotateCcw, Search, TreePine, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  formatJsonPath,
  isPathAncestor,
  pathsEqual,
  serializeJsonPath,
  treeKeyPathToJsonPath,
} from '@/lib/json-path';
import { validator } from '@/lib/validator';
import type { FocusRequest } from './types';

interface InspectorViewProps {
  data: any;
  focusRequest?: FocusRequest | null;
}

const treeTheme = {
  scheme: 'json-ld-tool',
  author: 'JSON-LD Checker',
  base00: '#ffffff',
  base01: '#f3f6fc',
  base02: '#c7d1e0',
  base03: '#80868b',
  base04: '#5f6368',
  base05: '#202124',
  base06: '#202124',
  base07: '#202124',
  base08: '#c5221f',
  base09: '#b06000',
  base0A: '#b06000',
  base0B: '#188038',
  base0C: '#0b57d0',
  base0D: '#1a73e8',
  base0E: '#7b1fa2',
  base0F: '#c5221f',
};

const toolbarIconButton =
  'inline-flex h-7 w-7 items-center justify-center rounded-[3px] border border-transparent text-[#5f6368] transition-colors hover:bg-[#e8eaed] hover:text-[#202124] active:bg-[#dadce0]';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function HighlightedText({
  value,
  searchTerm,
}: {
  value: string;
  searchTerm: string;
}) {
  if (!searchTerm) return <>{value}</>;
  const parts = value.split(new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={index} className="bg-warning-50 px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function InspectorView({ data, focusRequest }: InspectorViewProps) {
  const { t, lang } = useI18n();
  const [viewMode, setViewMode] = useState<'tree' | 'source'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKeys, setSortKeys] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState(() => JSON.stringify(data, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [draftSummary, setDraftSummary] = useState<{ errors: number; warnings: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(JSON.stringify(data, null, 2));
    setParseError(null);
    setDraftSummary(null);
    setSearchTerm('');
  }, [data]);

  useEffect(() => {
    if (focusRequest) setViewMode('tree');
  }, [focusRequest?.token]);

  useEffect(() => {
    if (!focusRequest || viewMode !== 'tree') return;
    const frame = window.requestAnimationFrame(() => {
      const serialized = serializeJsonPath(focusRequest.resolvedPath);
      const target = [...document.querySelectorAll<HTMLElement>('[data-json-path]')].find(
        (element) => element.dataset.jsonPath === serialized,
      );
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest?.token, viewMode, sortKeys]);

  const handleDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      try {
        const parsed = JSON.parse(value);
        const results = validator.validate(parsed, lang);
        setParseError(null);
        setDraftSummary({ errors: results.errors.length, warnings: results.warnings.length });
      } catch (error: any) {
        setParseError(error?.message || t('parseError'));
        setDraftSummary(null);
      }
    },
    [lang, t],
  );

  const resetDraft = useCallback(() => {
    setDraft(JSON.stringify(data, null, 2));
    setParseError(null);
    setDraftSummary(null);
  }, [data]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(viewMode === 'source' ? draft : JSON.stringify(data, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error('Failed to copy JSON-LD:', error);
    }
  };

  const handleExport = () => {
    const content = viewMode === 'source' ? draft : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const type = Array.isArray(data?.['@type']) ? data['@type'][0] : data?.['@type'];
    anchor.href = url;
    anchor.download = `${type || 'json-ld'}-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const focusPath = focusRequest?.resolvedPath;
  const treeKey = `${sortKeys}-${focusRequest?.token || 0}`;
  const sourceLineNumbers = useMemo(
    () => Array.from({ length: Math.max(1, draft.split('\n').length) }, (_, index) => index + 1).join('\n'),
    [draft],
  );
  const draftTone = parseError ? 'danger' : draftSummary?.errors ? 'warning' : 'success';
  const draftMessage = parseError
    ? `${t('jsonParseError')}: ${parseError}`
    : draftSummary
      ? draftSummary.errors > 0
        ? `${draftSummary.errors} ${t('errors')}${draftSummary.warnings ? ` · ${draftSummary.warnings} ${t('warnings')}` : ''}`
        : draftSummary.warnings > 0
          ? `${draftSummary.warnings} ${t('warnings')}`
          : t('validationPassed')
      : t('localDraftNotice');

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-9 flex-none items-stretch border-b border-[#c7d1e0] bg-[#f3f6fc] px-1">
        {([
          { value: 'tree' as const, label: t('treeView'), icon: TreePine },
          { value: 'source' as const, label: t('sourceView'), icon: Code2 },
        ]).map(({ value, label, icon: Icon }) => {
          const active = viewMode === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setViewMode(value)}
              aria-pressed={active}
              className={[
                'relative flex min-w-0 items-center gap-1.5 px-2 text-[11px] font-medium transition-colors',
                active ? 'bg-white text-[#0b57d0]' : 'text-[#3c4043] hover:bg-[#e8eef8]',
              ].join(' ')}
            >
              <Icon size={13} />
              <span className="truncate">{label}</span>
              {active && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[#1a73e8]" />}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-0.5">
          {viewMode === 'tree' && (
            <button
              type="button"
              className={[toolbarIconButton, sortKeys ? 'bg-[#d3e3fd] text-[#0b57d0]' : ''].join(' ')}
              aria-label={sortKeys ? t('sourceOrder') : t('sortKeys')}
              title={sortKeys ? t('sourceOrder') : t('sortKeys')}
              aria-pressed={sortKeys}
              onClick={() => setSortKeys((current) => !current)}
            >
              <ArrowDownAZ size={15} />
            </button>
          )}
          {viewMode === 'source' && (
            <button
              type="button"
              className={toolbarIconButton}
              aria-label={t('resetDraft')}
              title={t('resetDraft')}
              onClick={resetDraft}
            >
              <RotateCcw size={15} />
            </button>
          )}
          <button
            type="button"
            className={toolbarIconButton}
            aria-label={copied ? t('copied') : t('copyJson')}
            title={copied ? t('copied') : t('copyJson')}
            onClick={handleCopy}
          >
            {copied ? <Check size={15} className="text-success-500" /> : <Clipboard size={15} />}
          </button>
          <button
            type="button"
            className={toolbarIconButton}
            aria-label={t('exportJson')}
            title={t('exportJson')}
            onClick={handleExport}
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {viewMode === 'tree' && (
        <div className="flex h-8 flex-none items-center border-b border-[#d6deeb] bg-white px-1.5">
          <Search size={13} className="pointer-events-none ml-1 flex-none text-[#5f6368]" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-7 min-w-0 flex-1 border-0 bg-transparent px-2 text-[11px] text-[#202124] outline-none placeholder:text-[#80868b]"
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className={toolbarIconButton}
              aria-label={t('clearSearch')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {focusRequest && !focusRequest.exact && viewMode === 'tree' && (
        <div
          role="status"
          className="flex-none border-b border-[#f9ab00] bg-[#fef7e0] px-2.5 py-1.5 font-mono text-[10px] leading-4 text-[#7a4d00]"
        >
          {t('missingPathFallback', {
            requested: formatJsonPath(focusRequest.requestedPath),
            resolved: formatJsonPath(focusRequest.resolvedPath),
          })}
        </div>
      )}

      {viewMode === 'tree' ? (
        <div ref={viewportRef} className="min-h-0 flex-1 overflow-auto bg-white px-2 py-1.5 font-mono text-[11px]">
          <JSONTree
            key={treeKey}
            data={data}
            theme={treeTheme}
            invertTheme={false}
            sortObjectKeys={sortKeys}
            shouldExpandNodeInitially={(keyPath, _nodeData, level) => {
              if (level === 0) return true;
              if (searchTerm) return true;
              const path = treeKeyPathToJsonPath(keyPath);
              return focusPath ? isPathAncestor(path, focusPath) : level <= 1;
            }}
            getItemString={(type, nodeData) => (
              <span className="ml-1 text-[10px] text-muted">
                {type === 'Array'
                  ? `Array[${(nodeData as any[]).length}]`
                  : `Object{${Object.keys(nodeData as object).length}}`}
              </span>
            )}
            labelRenderer={(keyPath) => {
              const path = treeKeyPathToJsonPath(keyPath);
              const key = String(keyPath[0]);
              const focused = Boolean(focusPath && pathsEqual(path, focusPath));
              return (
                <span
                  data-json-path={serializeJsonPath(path)}
                  className={[
                    'rounded-[2px] px-0.5 font-medium text-[#7b1fa2]',
                    focused ? 'bg-[#d3e3fd] outline outline-1 outline-[#1a73e8]' : '',
                  ].join(' ')}
                >
                  <HighlightedText value={key} searchTerm={searchTerm} />
                </span>
              );
            }}
            valueRenderer={(_raw, value) => {
              if (value === null) return <span className="text-[#5f6368]">null</span>;
              if (typeof value === 'string') {
                return <span className="text-[#c5221f]">"<HighlightedText value={value} searchTerm={searchTerm} />"</span>;
              }
              if (typeof value === 'number') return <span className="text-[#0b57d0]">{value}</span>;
              if (typeof value === 'boolean') return <span className="text-[#7b1fa2]">{String(value)}</span>;
              return <span className="text-[#202124]">{String(value)}</span>;
            }}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div
              ref={gutterRef}
              className="w-10 flex-none overflow-hidden border-r border-[#e1e5ea] bg-[#f8f9fa] py-2 text-right font-mono text-[11px] leading-5 text-[#9aa0a6]"
              aria-hidden="true"
            >
              <pre className="pr-2">{sourceLineNumbers}</pre>
            </div>
            <textarea
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onScroll={(event) => {
                if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
              }}
              className="min-h-0 min-w-0 flex-1 resize-none border-0 bg-white px-2 py-2 font-mono text-[11px] leading-5 text-[#202124] outline-none selection:bg-[#d3e3fd]"
              spellCheck={false}
              wrap="off"
              aria-label={t('sourceEditor')}
            />
          </div>
          <div className={[
            'flex h-7 flex-none items-center border-t px-2 font-mono text-[9px]',
            draftTone === 'danger' ? 'border-[#f6aea9] bg-[#fce8e6] text-[#c5221f]' : '',
            draftTone === 'warning' ? 'border-[#fdd663] bg-[#fef7e0] text-[#7a4d00]' : '',
            draftTone === 'success' ? 'border-[#a8dab5] bg-[#e6f4ea] text-[#137333]' : '',
          ].join(' ')}>
            <span className="mr-2 rounded-[2px] border border-current px-1 py-px text-[8px] font-semibold uppercase">
              Local
            </span>
            <span className="min-w-0 truncate">{draftMessage}</span>
          </div>
        </div>
      )}
    </section>
  );
}
