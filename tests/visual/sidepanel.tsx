import { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../../src/index.css';
import { AssistView } from '../../src/pages/sidepanel/AssistView';
import { HistoryView } from '../../src/pages/sidepanel/HistoryView';
import { InspectorView } from '../../src/pages/sidepanel/InspectorView';
import { IssuesView } from '../../src/pages/sidepanel/IssuesView';
import { ParseErrorView } from '../../src/pages/sidepanel/ParseErrorView';
import {
  PrimaryNav,
  SchemaPicker,
  SidePanelHeader,
} from '../../src/pages/sidepanel/components/SidePanelChrome';
import type { FocusRequest, SidePanelView } from '../../src/pages/sidepanel/types';
import { resolveExistingJsonPath } from '../../src/lib/json-path';
import {
  buildJsonLdScanResult,
  type JsonLdInspectionItem,
} from '../../src/lib/json-ld';
import { validator } from '../../src/lib/validator';

document.documentElement.style.cursor = 'none';
document.body.style.cursor = 'none';
const visualLanguage =
  new URLSearchParams(window.location.search).get('lang') === 'zh-CN'
    ? 'zh-CN'
    : 'en';

(globalThis as any).chrome = {
  runtime: {
    getURL: (path: string) => path,
    openOptionsPage: () => undefined,
    sendMessage: async () => null,
    onMessage: {
      addListener: () => undefined,
      removeListener: () => undefined,
    },
  },
  tabs: {
    create: async () => undefined,
    query: async () => [{ id: 1, url: 'https://developer.example/keyboards/dev-75' }],
  },
  storage: {
    local: {
      get: async (
        _keys: string[] | string,
        callback?: (result: Record<string, unknown>) => void,
      ) => {
        const result = {
          ai_provider: 'openai',
          ai_model: 'gpt-5.6-terra',
          api_key: 'visual-fixture-key',
          user_language: visualLanguage,
          page_history: [
            {
              url: 'https://developer.example/keyboards/dev-75',
              title: 'Developer Keyboard',
              timestamp: Date.now() - 120_000,
              jsonLdCount: 2,
              errorCount: 1,
              warningCount: 0,
              suggestionCount: 2,
              types: ['Product', 'BreadcrumbList'],
            },
            {
              url: 'https://docs.example/schema',
              title: 'Structured Data Guide',
              timestamp: Date.now() - 7_200_000,
              jsonLdCount: 1,
              errorCount: 0,
              warningCount: 0,
              suggestionCount: 0,
              types: ['TechArticle'],
            },
          ],
        };
        callback?.(result);
        return result;
      },
      set: async () => undefined,
      remove: async () => undefined,
    },
    session: {
      get: (_keys: string[], callback: (result: Record<string, unknown>) => void) => callback({
        aiCheck_visual_fixture: [
          '## Review summary',
          '',
          '**Schema quality: Good**',
          '',
          '- Product identity and offer data are valid.',
          '- Add `aggregateRating` when verified review data is available.',
          '- Keep price and availability synchronized with the page.',
        ].join('\n'),
      }),
      set: () => undefined,
    },
    onChanged: {
      addListener: () => undefined,
      removeListener: () => undefined,
    },
  },
};

const schemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Low-profile mechanical keyboard',
    description: 'A compact developer keyboard with hot-swappable switches.',
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
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Hardware',
        item: 'https://developer.example/hardware',
      },
    ],
  },
];

const scanResult = buildJsonLdScanResult([
  JSON.stringify(schemas[0], null, 2),
  JSON.stringify(schemas[1], null, 2),
  [
    '{',
    '  "@context": "https://schema.org",',
    '  "@type": "Product",',
    '  "name": "Developer Keyboard",',
    '  "offers": {',
    '    "@type": "Offer",',
    '    "price": 129',
    '    "priceCurrency": "USD"',
    '  }',
    '}',
  ].join('\n'),
]);

type VisualView = SidePanelView | 'parse-error';

function getInitialView(): VisualView {
  const requested = new URLSearchParams(window.location.search).get('view');
  return requested === 'issues' ||
    requested === 'history' ||
    requested === 'assist' ||
    requested === 'parse-error'
    ? requested
    : 'inspector';
}

function SidePanelVisualFixture() {
  const requestedView = getInitialView();
  const [currentView, setCurrentView] = useState<SidePanelView>(
    requestedView === 'parse-error' ? 'inspector' : requestedView,
  );
  const parseErrorIndex = scanResult.items.findIndex((item) => item.kind === 'parse-error');
  const [selectedIndex, setSelectedIndex] = useState(
    requestedView === 'parse-error' ? parseErrorIndex : 0,
  );
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const focusToken = useRef(0);
  const selectedItem = scanResult.items[selectedIndex];
  const data = selectedItem?.kind === 'entity' ? selectedItem.data : schemas[0];
  const results = useMemo(
    () =>
      selectedItem?.kind === 'entity'
        ? validator.validate(selectedItem.data, visualLanguage)
        : null,
    [selectedItem],
  );
  const summary = useMemo(
    () =>
      selectedItem?.kind === 'parse-error'
        ? { total: 1, errors: 1, warnings: 0, suggestions: 0, isValid: false }
        : results
          ? validator.getSummary(results)
          : { total: 0, errors: 0, warnings: 0, suggestions: 0, isValid: true },
    [results, selectedItem],
  );
  const issueCount = summary.errors + summary.warnings;

  const navigateToIssue = (requestedPath: readonly (string | number)[]) => {
    const resolved = resolveExistingJsonPath(data, requestedPath);
    focusToken.current += 1;
    setFocusRequest({
      requestedPath,
      resolvedPath: resolved.path,
      exact: resolved.exact,
      token: focusToken.current,
    });
    setCurrentView('inspector');
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-white text-ink">
      <SidePanelHeader
        hostname="developer.example"
        schemaCount={scanResult.blockCount}
        summary={summary}
        refreshing={false}
        aiActive={currentView === 'assist'}
        onRefresh={() => undefined}
        onAiTools={() => setCurrentView('assist')}
        onSettings={() => undefined}
        labels={{
          product: 'JSON-LD Checker',
          refresh: visualLanguage === 'zh-CN' ? '重新扫描' : 'Refresh',
          aiTools: visualLanguage === 'zh-CN' ? 'AI 工具' : 'AI tools',
          settings: visualLanguage === 'zh-CN' ? '设置' : 'Settings',
          schemas: visualLanguage === 'zh-CN' ? '个代码块' : 'schemas',
          noSchema: visualLanguage === 'zh-CN' ? '无 Schema' : 'No schema',
          valid: visualLanguage === 'zh-CN' ? '有效' : 'Valid',
          issues: visualLanguage === 'zh-CN' ? '个问题' : 'issues',
        }}
      />
      {currentView !== 'assist' && (
        <PrimaryNav
          value={currentView}
          issueCount={issueCount}
          onChange={setCurrentView}
          labels={
            visualLanguage === 'zh-CN'
              ? { inspector: '检查器', issues: '问题', history: '历史记录' }
              : { inspector: 'Inspector', issues: 'Issues', history: 'History' }
          }
        />
      )}
      {(currentView === 'inspector' || currentView === 'issues') && (
        <SchemaPicker
          items={scanResult.items}
          selectedIndex={selectedIndex}
          onChange={(index) => {
            setSelectedIndex(index);
            setFocusRequest(null);
          }}
          getIssueCount={(item: JsonLdInspectionItem) => {
            if (item.kind === 'parse-error') return 1;
            const itemSummary = validator.getSummary(
              validator.validate(item.data, visualLanguage),
            );
            return itemSummary.errors + itemSummary.warnings;
          }}
          unknownType={visualLanguage === 'zh-CN' ? '未知类型' : 'Unknown type'}
          schemaLabel={visualLanguage === 'zh-CN' ? '实体' : 'Schema'}
        />
      )}
      <main className="min-h-0 flex-1">
        {selectedItem?.kind === 'parse-error' ? (
          <ParseErrorView item={selectedItem} onReport={() => undefined} />
        ) : currentView === 'assist' ? (
          <AssistView
            data={data}
            cacheKey="visual_fixture"
            onClose={() => setCurrentView('inspector')}
          />
        ) : currentView === 'history' ? (
          <HistoryView />
        ) : currentView === 'issues' ? (
          <IssuesView
            data={data}
            pageUrl="https://developer.example/keyboards/dev-75"
            scanResult={scanResult}
            defaultActionsOpen
            onNavigate={navigateToIssue}
          />
        ) : (
          <InspectorView
            data={data}
            raw={scanResult.blocks[selectedItem?.blockIndex || 0]?.raw}
            script={scanResult.blocks[selectedItem?.blockIndex || 0]?.script}
            focusRequest={focusRequest}
          />
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<SidePanelVisualFixture />);
