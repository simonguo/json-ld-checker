import { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Info,
  Lightbulb,
  MoreHorizontal,
} from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { formatJsonPath } from '@/lib/json-path';
import { useI18n } from '@/lib/i18n';
import { validator, type ValidationResult } from '@/lib/validator';

type IssueFilter = 'all' | ValidationResult['type'];

const resultConfig = {
  error: { icon: AlertCircle, color: 'text-[#c5221f]', marker: 'bg-[#c5221f]' },
  warning: { icon: AlertTriangle, color: 'text-[#b06000]', marker: 'bg-[#f9ab00]' },
  suggestion: { icon: Lightbulb, color: 'text-[#0b57d0]', marker: 'bg-[#1a73e8]' },
  info: { icon: Info, color: 'text-[#5f6368]', marker: 'bg-[#9aa0a6]' },
};

export function IssuesView({
  data,
  pageUrl,
  onNavigate,
}: {
  data: any;
  pageUrl: string;
  onNavigate: (path: NonNullable<ValidationResult['path']>) => void;
}) {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<IssueFilter>('all');
  const results = useMemo(() => validator.validate(data, lang), [data, lang]);
  const summary = useMemo(() => validator.getSummary(results), [results]);
  const allResults = useMemo(
    () => [...results.errors, ...results.warnings, ...results.suggestions, ...results.info],
    [results],
  );
  const visibleResults = filter === 'all' ? allResults : allResults.filter((result) => result.type === filter);
  const schemaType = Array.isArray(data?.['@type']) ? data['@type'][0] : data?.['@type'];
  const schemaOrgUrl = schemaType ? `https://schema.org/${encodeURIComponent(schemaType)}` : null;

  const handleGoogleTest = () => {
    if (pageUrl) {
      window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`, '_blank');
    }
  };

  const handleExport = () => {
    const report = {
      url: pageUrl,
      timestamp: new Date().toISOString(),
      schema_type: schemaType || null,
      summary,
      errors: results.errors,
      warnings: results.warnings,
      suggestions: results.suggestions,
      info: results.info,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `validation-${schemaType || 'results'}-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const filters = [
    { value: 'all' as const, label: `${t('all')} ${allResults.length}` },
    { value: 'error' as const, label: `${t('error')} ${results.errors.length}` },
    { value: 'warning' as const, label: `${t('warning')} ${results.warnings.length}` },
    { value: 'suggestion' as const, label: `${t('suggestion')} ${results.suggestions.length}` },
    { value: 'info' as const, label: `${t('info')} ${results.info.length}` },
  ];

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-9 flex-none items-center gap-2 border-b border-[#c7d1e0] bg-[#f3f6fc] px-2">
        <div
          className={[
            'flex h-5 w-5 flex-none items-center justify-center',
            summary.isValid ? 'text-[#188038]' : 'text-[#c5221f]',
          ].join(' ')}
        >
          {summary.isValid ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
        </div>
        <h2 className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#202124]">
          {summary.isValid ? t('validationPassed') : t('validationFailed')}
        </h2>
        <span className="inline-flex flex-none items-center gap-1 font-mono text-[10px] text-[#c5221f]" title={t('errors')}>
          <AlertCircle size={12} /> {summary.errors}
        </span>
        <span className="inline-flex flex-none items-center gap-1 font-mono text-[10px] text-[#b06000]" title={t('warnings')}>
          <AlertTriangle size={12} /> {summary.warnings}
        </span>

        <details className="relative flex-none">
          <summary
            className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-[3px] text-[#5f6368] hover:bg-[#e8eaed] hover:text-[#202124] [&::-webkit-details-marker]:hidden"
            aria-label={t('moreActions')}
            title={t('moreActions')}
          >
            <MoreHorizontal size={16} />
          </summary>
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-[4px] border border-[#c7d1e0] bg-white p-1 shadow-overlay">
            <button
              type="button"
              disabled={!pageUrl}
              onClick={handleGoogleTest}
              className="flex w-full items-center gap-2 rounded-[3px] px-2.5 py-2 text-left text-[11px] text-[#202124] hover:bg-[#e8f0fe] disabled:opacity-50"
            >
              <ExternalLink size={14} /> {t('googleTest')}
            </button>
            {schemaOrgUrl && (
              <a
                href={schemaOrgUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 rounded-[3px] px-2.5 py-2 text-[11px] text-[#202124] hover:bg-[#e8f0fe]"
              >
                <ExternalLink size={14} /> {schemaType} {t('schemaDocs')}
              </a>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="flex w-full items-center gap-2 rounded-[3px] px-2.5 py-2 text-left text-[11px] text-[#202124] hover:bg-[#e8f0fe]"
            >
              <Download size={14} /> {t('exportValidation')}
            </button>
          </div>
        </details>
      </div>

      <div
        role="group"
        aria-label={t('filterIssues')}
        className="flex h-8 flex-none items-stretch overflow-x-auto border-b border-[#d6deeb] bg-white px-1"
      >
        {filters.map((item) => {
          const active = item.value === filter;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(item.value)}
              className={[
                'relative min-w-max px-2 text-[10px] font-medium transition-colors',
                active ? 'text-[#0b57d0]' : 'text-[#5f6368] hover:bg-[#f3f6fc] hover:text-[#202124]',
              ].join(' ')}
            >
              {item.label}
              {active && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[#1a73e8]" />}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {visibleResults.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title={t('noIssuesForFilter')}
            description={t('chooseAnotherFilter')}
            className="min-h-32"
          />
        ) : (
          <div className="divide-y divide-[#e1e5ea]">
            {visibleResults.map((result, index) => {
              const config = resultConfig[result.type];
              const Icon = config.icon;
              const content = (
                <div className="relative flex items-start gap-2.5 px-2 py-2.5">
                  <span className={['absolute inset-y-0 left-0 w-0.5', config.marker].join(' ')} />
                  <Icon size={14} className={['mt-0.5 flex-none', config.color].join(' ')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <h3 className="min-w-0 flex-1 text-[11px] font-medium leading-4 text-[#202124]">
                        {result.title}
                      </h3>
                      {result.path && (
                        <code className="max-w-[45%] flex-none truncate font-mono text-[9px] text-[#5f6368]">
                          {formatJsonPath(result.path)}
                        </code>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] leading-4 text-[#5f6368]">{result.message}</p>
                    {result.suggestion && (
                      <p className="mt-1.5 border-l border-[#c7d1e0] pl-2 text-[10px] leading-4 text-[#3c4043]">
                        <span className="font-medium">{t('suggestionLabel')}:</span> {result.suggestion}
                      </p>
                    )}
                  </div>
                  {result.path && <ChevronRight size={14} className="mt-0.5 flex-none text-[#80868b]" />}
                </div>
              );

              const className = [
                'w-full bg-white text-left',
                result.path ? 'transition-colors hover:bg-[#e8f0fe] focus-visible:relative focus-visible:z-10' : '',
              ].join(' ');

              return result.path ? (
                <button key={`${result.type}-${index}`} type="button" className={className} onClick={() => onNavigate(result.path!)}>
                  {content}
                </button>
              ) : (
                <div key={`${result.type}-${index}`} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
