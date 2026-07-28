import { useEffect, useState } from 'react';
import { AlertCircle, Download, Printer } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { formatJsonPath } from '@/lib/json-path';
import { serializeJsonLdReport, type JsonLdReport } from '@/lib/report';
import { translate } from '@/lib/i18n';

export function ReportPage() {
  const [report, setReport] = useState<JsonLdReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reportId = new URLSearchParams(window.location.search).get('id');
    if (!reportId) {
      setLoading(false);
      return;
    }
    const key = `json_ld_report_${reportId}`;
    chrome.storage.session
      .get(key)
      .then((stored) => setReport((stored[key] as JsonLdReport) || null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <EmptyState
        icon={<AlertCircle size={22} />}
        title="Report unavailable"
        description="Generate a new report from the JSON-LD Checker side panel."
        className="min-h-screen"
      />
    );
  }

  const t = (key: string, params?: Record<string, string | number>) =>
    translate(key, report.language, undefined, params);
  const downloadHtml = () => {
    const blob = new Blob([serializeJsonLdReport(report)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `json-ld-report-${Date.now()}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">{t('reportTitle')}</h1>
            <p className="truncate text-xs text-muted">{report.url || t('currentPage')}</p>
          </div>
          <Button variant="secondary" icon={<Download size={14} />} onClick={downloadHtml}>
            {t('downloadHtmlReport')}
          </Button>
          <Button variant="primary" icon={<Printer size={14} />} onClick={() => window.print()}>
            {t('printSavePdf')}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 print:max-w-none print:p-0">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">{t('reportTitle')}</h1>
          <p className="mt-2 break-all text-sm text-accent-700">{report.url}</p>
          <p className="mt-1 text-xs text-muted">
            {new Date(report.createdAt).toLocaleString(report.language)}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            [t('reportBlocks'), report.summary.blocks],
            [t('reportEntities'), report.summary.entities],
            [t('reportParseErrors'), report.summary.parseErrors],
            [t('errors'), report.summary.errors],
            [t('warnings'), report.summary.warnings],
            [t('suggestions'), report.summary.suggestions],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-tool border border-border bg-surface p-3">
              <strong className="block text-xl">{value}</strong>
              <span className="text-xs text-muted">{label}</span>
            </div>
          ))}
        </section>

        <p className="rounded-tool border border-accent-200 bg-accent-50 p-3 text-xs leading-5 text-accent-800">
          {t('localValidationDisclosure')}
        </p>

        {report.blocks
          .filter((block) => block.parseError)
          .map((block) => (
            <section
              key={block.index}
              className="break-inside-avoid rounded-tool border border-danger-300 bg-surface p-4"
            >
              <h2 className="font-semibold text-danger-700">
                {t('invalidJsonLdBlock', { index: block.index + 1 })}
              </h2>
              <p className="mt-1 text-xs text-danger-700">{block.parseError?.message}</p>
              <pre className="mt-3 overflow-auto rounded bg-[#0d1117] p-3 font-mono text-[11px] leading-5 text-[#e6edf3]">
                {block.raw}
              </pre>
            </section>
          ))}

        {report.entities.map((entity) => (
          <section
            key={entity.id}
            className="break-inside-avoid rounded-tool border border-border bg-surface p-4"
          >
            <h2 className="font-semibold">
              {entity.schemaTypes.join(', ') || t('unknownType')}
            </h2>
            <p className="mt-1 font-mono text-[11px] text-muted">
              {t('reportBlockLocation', {
                block: entity.blockIndex + 1,
                path: entity.path || formatJsonPath([]),
              })}
            </p>
            {entity.results.length > 0 && (
              <div className="mt-3 space-y-2">
                {entity.results.map((result, index) => (
                  <div
                    key={`${result.type}-${index}`}
                    className="border-l-2 border-border bg-gray-50 px-3 py-2 text-xs leading-5"
                  >
                    <strong>{result.title}</strong>
                    <p className="text-muted">{result.message}</p>
                    {result.suggestion && <p>{result.suggestion}</p>}
                  </div>
                ))}
              </div>
            )}
            <pre className="mt-3 overflow-auto rounded bg-[#0d1117] p-3 font-mono text-[11px] leading-5 text-[#e6edf3]">
              {JSON.stringify(entity.data, null, 2)}
            </pre>
          </section>
        ))}
      </main>
    </div>
  );
}
