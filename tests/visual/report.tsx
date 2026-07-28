import ReactDOM from 'react-dom/client';
import '../../src/index.css';
import { buildJsonLdScanResult } from '../../src/lib/json-ld';
import { createJsonLdReport } from '../../src/lib/report';
import { ReportPage } from '../../src/pages/report/ReportPage';

document.documentElement.style.cursor = 'none';
document.body.style.cursor = 'none';

const rawBlocks = [
  JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Low-profile mechanical keyboard',
      sku: 'DEV-75',
      brand: {
        '@type': 'Brand',
        name: 'Northstar Labs',
      },
      offers: {
        '@type': 'Offer',
        price: 129,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    null,
    2,
  ),
  [
    '{',
    '  "@context": "https://schema.org",',
    '  "@type": "BreadcrumbList",',
    '  "itemListElement": [',
    '    { "@type": "ListItem", "position": 1 }',
    '  ]',
  ].join('\n'),
];

const visualLanguage =
  new URLSearchParams(window.location.search).get('lang') === 'zh-CN'
    ? 'zh-CN'
    : 'en';
const report = createJsonLdReport(
  buildJsonLdScanResult(rawBlocks),
  'https://developer.example/keyboards/dev-75?variant=green',
  visualLanguage,
);
report.createdAt = '2026-07-28T08:30:00.000Z';

(globalThis as any).chrome = {
  storage: {
    session: {
      get: async () => ({ 'json_ld_report_visual-fixture': report }),
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(<ReportPage />);
