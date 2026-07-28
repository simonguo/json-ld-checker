import { useMemo, useState } from 'react';
import { AlertCircle, Check, Clipboard, Download, FileCode2, FileText } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { JsonLdInspectionItem } from '@/lib/json-ld';

export function ParseErrorView({
  item,
  onReport,
}: {
  item: Extract<JsonLdInspectionItem, { kind: 'parse-error' }>;
  onReport: () => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState<'raw' | 'script' | null>(null);
  const sourceLineNumbers = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, item.raw.split('\n').length) },
        (_, index) => index + 1,
      ).join('\n'),
    [item.raw],
  );

  const copy = async (value: string, type: 'raw' | 'script') => {
    const script = `<script type="application/ld+json">\n${value}\n</script>`;
    await navigator.clipboard.writeText(type === 'script' ? script : value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const download = () => {
    const blob = new Blob([item.raw], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `json-ld-block-${item.blockIndex + 1}-invalid.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex flex-none items-start gap-2.5 border-b border-[#f6aea9] bg-[#fce8e6] px-3 py-2.5">
        <AlertCircle size={16} className="mt-0.5 flex-none text-[#c5221f]" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[12px] font-semibold text-[#c5221f]">
            {t('invalidJsonLdBlock', { index: item.blockIndex + 1 })}
          </h2>
          <p className="mt-0.5 text-[10px] leading-4 text-[#8c2f28]">
            {t('parseErrorAt', {
              line: item.parseError.line,
              column: item.parseError.column,
            })}
          </p>
        </div>
        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[3px] text-[#8c2f28] hover:bg-white/60"
            onClick={() => copy(item.raw, 'raw')}
            aria-label={t('copyRawBlock')}
            title={t('copyRawBlock')}
          >
            {copied === 'raw' ? <Check size={14} /> : <Clipboard size={14} />}
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[3px] text-[#8c2f28] hover:bg-white/60"
            onClick={() => copy(item.raw, 'script')}
            aria-label={t('copyScriptTag')}
            title={t('copyScriptTag')}
          >
            {copied === 'script' ? <Check size={14} /> : <FileCode2 size={14} />}
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[3px] text-[#8c2f28] hover:bg-white/60"
            onClick={download}
            aria-label={t('downloadRawBlock')}
            title={t('downloadRawBlock')}
          >
            <Download size={14} />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[3px] text-[#8c2f28] hover:bg-white/60"
            onClick={onReport}
            aria-label={t('openInspectionReport')}
            title={t('openInspectionReport')}
          >
            <FileText size={14} />
          </button>
        </div>
      </div>

      <div className="flex-none border-b border-[#f6aea9] bg-[#fff8f7] px-3 py-2 font-mono text-[10px] leading-4 text-[#8c2f28]">
        <p>{item.parseError.message}</p>
        <pre className="mt-1 overflow-x-auto whitespace-pre">
          {item.parseError.excerpt}
          {'\n'}
          {item.parseError.pointer}
        </pre>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className="w-10 flex-none overflow-hidden border-r border-[#e1e5ea] bg-[#f8f9fa] py-2 text-right font-mono text-[11px] leading-5 text-[#9aa0a6]"
          aria-hidden="true"
        >
          <pre className="pr-2">{sourceLineNumbers}</pre>
        </div>
        <pre className="min-h-0 min-w-0 flex-1 overflow-auto whitespace-pre px-2 py-2 font-mono text-[11px] leading-5 text-[#202124]">
          {item.raw}
        </pre>
      </div>

      <div className="flex-none border-t border-[#d6deeb] bg-[#f3f6fc] px-3 py-2 text-[10px] leading-4 text-[#5f6368]">
        {t('localParserDisclosure')}
      </div>
    </section>
  );
}
