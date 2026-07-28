import { formatJsonPath } from './json-path';
import type { JsonLdParseError, JsonLdScanResult } from './json-ld';
import type { SupportedLanguage } from './i18n';
import { validator, type ValidationResult } from './validator';

export interface JsonLdReportEntity {
  id: string;
  blockIndex: number;
  path: string;
  schemaTypes: string[];
  data: unknown;
  results: ValidationResult[];
}

export interface JsonLdReportBlock {
  index: number;
  raw: string;
  parseError?: JsonLdParseError;
}

export interface JsonLdReport {
  url: string;
  createdAt: string;
  language: SupportedLanguage;
  summary: {
    blocks: number;
    entities: number;
    parseErrors: number;
    errors: number;
    warnings: number;
    suggestions: number;
  };
  blocks: JsonLdReportBlock[];
  entities: JsonLdReportEntity[];
}

const allResults = (data: unknown, language: SupportedLanguage) => {
  const results = validator.validate(data, language);
  return [...results.errors, ...results.warnings, ...results.suggestions, ...results.info];
};

export function createJsonLdReport(
  scanResult: JsonLdScanResult,
  url: string,
  language: SupportedLanguage,
): JsonLdReport {
  const entities = scanResult.entities.map((entity) => ({
    id: entity.id,
    blockIndex: entity.blockIndex,
    path: formatJsonPath(entity.path),
    schemaTypes: entity.schemaTypes,
    data: entity.data,
    results: allResults(entity.data, language),
  }));
  const results = entities.flatMap((entity) => entity.results);

  return {
    url,
    createdAt: new Date().toISOString(),
    language,
    summary: {
      blocks: scanResult.blockCount,
      entities: scanResult.count,
      parseErrors: scanResult.blocks.filter((block) => block.parseError).length,
      errors: results.filter((result) => result.type === 'error').length,
      warnings: results.filter((result) => result.type === 'warning').length,
      suggestions: results.filter((result) => result.type === 'suggestion').length,
    },
    blocks: scanResult.blocks.map((block) => ({
      index: block.index,
      raw: block.raw,
      parseError: block.parseError,
    })),
    entities,
  };
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const reportLabels = {
  en: {
    title: 'JSON-LD inspection report',
    generated: 'Generated',
    blocks: 'JSON-LD blocks',
    entities: 'Entities',
    parseErrors: 'Parse errors',
    errors: 'Errors',
    warnings: 'Warnings',
    suggestions: 'Suggestions',
    source: 'Source block',
    location: 'Location',
    unknownType: 'Unknown type',
    noLocalIssues: 'No local issues found.',
    line: 'Line',
    column: 'column',
    localNotice:
      'Schema.org structure checks and recommendations are produced locally. Google rich-result eligibility must be confirmed with Google Rich Results Test.',
  },
  'zh-CN': {
    title: 'JSON-LD 检查报告',
    generated: '生成时间',
    blocks: 'JSON-LD 代码块',
    entities: '实体',
    parseErrors: '解析错误',
    errors: '错误',
    warnings: '警告',
    suggestions: '建议',
    source: '源码块',
    location: '位置',
    unknownType: '未知类型',
    noLocalIssues: '未发现本地问题。',
    line: '行',
    column: '列',
    localNotice:
      'Schema.org 结构检查与建议在本地生成。是否符合 Google 富媒体结果资格，仍需使用 Google 富媒体结果测试确认。',
  },
} satisfies Record<SupportedLanguage, Record<string, string>>;

export function serializeJsonLdReport(report: JsonLdReport) {
  const labels = reportLabels[report.language] || reportLabels.en;
  const summary = [
    [labels.blocks, report.summary.blocks],
    [labels.entities, report.summary.entities],
    [labels.parseErrors, report.summary.parseErrors],
    [labels.errors, report.summary.errors],
    [labels.warnings, report.summary.warnings],
    [labels.suggestions, report.summary.suggestions],
  ];
  const entitySections = report.entities
    .map(
      (entity) => `
        <section class="card">
          <h2>${escapeHtml(entity.schemaTypes.join(', ') || labels.unknownType)}</h2>
          <p class="meta">${labels.source} ${entity.blockIndex + 1} · ${labels.location} ${escapeHtml(entity.path)}</p>
          ${
            entity.results.length
              ? `<ul class="issues">${entity.results
                  .map(
                    (result) =>
                      `<li class="${result.type}"><strong>${escapeHtml(result.title)}</strong><br>${escapeHtml(result.message)}${result.suggestion ? `<br><span>${escapeHtml(result.suggestion)}</span>` : ''}</li>`,
                  )
                  .join('')}</ul>`
              : `<p class="success">${labels.noLocalIssues}</p>`
          }
          <pre>${escapeHtml(JSON.stringify(entity.data, null, 2))}</pre>
        </section>`,
    )
    .join('');
  const blockSections = report.blocks
    .filter((block) => block.parseError)
    .map(
      (block) => `
        <section class="card parse-error">
          <h2>${labels.source} ${block.index + 1} · ${labels.parseErrors}</h2>
          <p>${escapeHtml(block.parseError?.message)}</p>
          <p class="meta">${labels.line} ${block.parseError?.line}, ${labels.column} ${block.parseError?.column}</p>
          <pre>${escapeHtml(block.raw)}</pre>
        </section>`,
    )
    .join('');

  return `<!doctype html>
<html lang="${report.language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(labels.title)}</title>
  <style>
    :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1f2328;background:#f6f8fa}
    *{box-sizing:border-box}body{margin:0}.report{max-width:980px;margin:0 auto;padding:40px 24px 64px}
    h1{font-size:28px;margin:0}.url{margin:10px 0 4px;overflow-wrap:anywhere;color:#0969da}.meta{color:#59636e;font-size:12px}
    .summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:24px 0}
    .metric,.card,.notice{border:1px solid #d0d7de;border-radius:8px;background:white}.metric{padding:14px}.metric strong{display:block;font-size:24px}.metric span{font-size:12px;color:#59636e}
    .notice{padding:12px 14px;background:#ddf4ff;font-size:13px;line-height:1.5}
    .card{margin-top:16px;padding:18px}.card h2{margin:0 0 4px;font-size:17px}.parse-error{border-color:#ff8182}
    .issues{padding:0;list-style:none}.issues li{border-left:3px solid #afb8c1;margin:8px 0;padding:8px 10px;background:#f6f8fa;font-size:13px;line-height:1.45}.issues .error{border-color:#cf222e}.issues .warning{border-color:#bf8700}.issues .suggestion{border-color:#0969da}
    .issues span{color:#59636e}.success{color:#1a7f37}pre{overflow:auto;background:#0d1117;color:#e6edf3;border-radius:6px;padding:14px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
    @media(max-width:640px){.summary{grid-template-columns:repeat(2,minmax(0,1fr))}.report{padding:24px 14px}}
    @media print{body{background:white}.report{max-width:none;padding:0}.card,.metric,.notice{break-inside:avoid}.card{box-shadow:none}pre{white-space:pre-wrap}}
  </style>
</head>
<body>
  <main class="report">
    <h1>${escapeHtml(labels.title)}</h1>
    <p class="url">${escapeHtml(report.url || 'Local page')}</p>
    <p class="meta">${labels.generated}: ${escapeHtml(new Date(report.createdAt).toLocaleString(report.language))}</p>
    <div class="summary">${summary
      .map(
        ([label, value]) =>
          `<div class="metric"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`,
      )
      .join('')}</div>
    <p class="notice">${escapeHtml(labels.localNotice)}</p>
    ${blockSections}
    ${entitySections}
  </main>
</body>
</html>`;
}

export async function openJsonLdReport(report: JsonLdReport) {
  const reportId = crypto.randomUUID();
  await chrome.storage.session.set({ [`json_ld_report_${reportId}`]: report });
  await chrome.tabs.create({
    url: `${chrome.runtime.getURL('src/pages/report/index.html')}?id=${encodeURIComponent(reportId)}`,
  });
  return reportId;
}
