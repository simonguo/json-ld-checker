import { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../../src/index.css';
import { AssistView } from '../../src/pages/sidepanel/AssistView';
import { HistoryView } from '../../src/pages/sidepanel/HistoryView';
import { InspectorView } from '../../src/pages/sidepanel/InspectorView';
import { IssuesView } from '../../src/pages/sidepanel/IssuesView';
import {
  PrimaryNav,
  SchemaPicker,
  SidePanelHeader,
} from '../../src/pages/sidepanel/components/SidePanelChrome';
import type { FocusRequest, SidePanelView } from '../../src/pages/sidepanel/types';
import { resolveExistingJsonPath } from '../../src/lib/json-path';
import { validator } from '../../src/lib/validator';

(globalThis as any).chrome = {
  runtime: {
    openOptionsPage: () => undefined,
    sendMessage: async () => null,
  },
  tabs: {
    create: () => undefined,
    query: async () => [{ id: 1, url: 'https://developer.example/keyboards/dev-75' }],
  },
  storage: {
    local: {
      get: async () => ({
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
      }),
      set: async () => undefined,
      remove: async () => undefined,
    },
    session: {
      get: (_keys: string[], callback: (result: Record<string, unknown>) => void) => callback({}),
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

function SidePanelVisualFixture() {
  const [currentView, setCurrentView] = useState<SidePanelView>('inspector');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const focusToken = useRef(0);
  const data = schemas[selectedIndex];
  const results = useMemo(() => validator.validate(data, 'en'), [data]);
  const summary = useMemo(() => validator.getSummary(results), [results]);
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
        schemaCount={schemas.length}
        summary={summary}
        refreshing={false}
        aiActive={currentView === 'assist'}
        onRefresh={() => undefined}
        onAiTools={() => setCurrentView('assist')}
        onSettings={() => undefined}
        labels={{
          product: 'JSON-LD Checker',
          refresh: 'Refresh',
          aiTools: 'AI tools',
          settings: 'Settings',
          schemas: 'schemas',
          noSchema: 'No schema',
          valid: 'Valid',
          issues: 'issues',
        }}
      />
      {currentView !== 'assist' && (
        <PrimaryNav
          value={currentView}
          issueCount={issueCount}
          onChange={setCurrentView}
          labels={{ inspector: 'Inspector', issues: 'Issues', history: 'History' }}
        />
      )}
      {(currentView === 'inspector' || currentView === 'issues') && (
        <SchemaPicker
          data={schemas}
          selectedIndex={selectedIndex}
          onChange={(index) => {
            setSelectedIndex(index);
            setFocusRequest(null);
          }}
          getIssueCount={(item) => {
            const itemSummary = validator.getSummary(validator.validate(item, 'en'));
            return itemSummary.errors + itemSummary.warnings;
          }}
          unknownType="Unknown type"
          schemaLabel="Schema"
        />
      )}
      <main className="min-h-0 flex-1">
        {currentView === 'assist' ? (
          <AssistView
            data={data}
            cacheKey="visual-fixture"
            onClose={() => setCurrentView('inspector')}
          />
        ) : currentView === 'history' ? (
          <HistoryView />
        ) : currentView === 'issues' ? (
          <IssuesView
            data={data}
            pageUrl="https://developer.example/keyboards/dev-75"
            onNavigate={navigateToIssue}
          />
        ) : (
          <InspectorView data={data} focusRequest={focusRequest} />
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<SidePanelVisualFixture />);
