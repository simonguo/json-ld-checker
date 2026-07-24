import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Braces, FilePlus2, RefreshCw } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { resolveExistingJsonPath } from '@/lib/json-path';
import { validator } from '@/lib/validator';
import { AssistView } from './AssistView';
import { HistoryView } from './HistoryView';
import { InspectorView } from './InspectorView';
import { IssuesView } from './IssuesView';
import {
  PrimaryNav,
  SchemaPicker,
  SidePanelHeader,
} from './components/SidePanelChrome';
import { useJsonLdSession } from './hooks/useJsonLdSession';
import type { FocusRequest, SidePanelView } from './types';

export default function SidePanelPage() {
  const { t, lang } = useI18n();
  const { state, actions } = useJsonLdSession(t('unableToGetCurrentTab'));
  const [currentView, setCurrentView] = useState<SidePanelView>('inspector');
  const [returnView, setReturnView] = useState<SidePanelView>('inspector');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const focusToken = useRef(0);

  const selectedData = state.jsonData?.data[selectedIndex];
  const validationResults = useMemo(
    () => (selectedData ? validator.validate(selectedData, lang) : null),
    [selectedData, lang],
  );
  const summary = useMemo(
    () => (validationResults ? validator.getSummary(validationResults) : undefined),
    [validationResults],
  );
  const issueCount = (summary?.errors || 0) + (summary?.warnings || 0);

  useEffect(() => {
    const count = state.jsonData?.data.length || 0;
    if (selectedIndex >= count) setSelectedIndex(0);
  }, [selectedIndex, state.jsonData]);

  useEffect(() => {
    setFocusRequest(null);
  }, [selectedIndex]);

  const hostname = useMemo(() => {
    if (!state.currentTabUrl) return t('currentPage');
    try {
      return new URL(state.currentTabUrl).hostname || state.currentTabUrl;
    } catch {
      return state.currentTabUrl;
    }
  }, [state.currentTabUrl, t]);

  const openAssist = () => {
    if (currentView !== 'assist') setReturnView(currentView);
    setCurrentView('assist');
  };

  const navigateToIssue = (requestedPath: readonly (string | number)[]) => {
    if (!selectedData) return;
    const resolved = resolveExistingJsonPath(selectedData, requestedPath);
    focusToken.current += 1;
    setFocusRequest({
      requestedPath,
      resolvedPath: resolved.path,
      exact: resolved.exact,
      token: focusToken.current,
    });
    setCurrentView('inspector');
  };

  const getIssueCount = (data: any) => {
    const result = validator.getSummary(validator.validate(data, lang));
    return result.errors + result.warnings;
  };

  const renderEmptyData = () => (
    <EmptyState
      icon={<Braces size={22} />}
      title={t('noJsonLdFound')}
      description={t('noJsonLdOnPage')}
      actions={
        <>
          <Button
            variant="primary"
            icon={<FilePlus2 size={15} />}
            onClick={openAssist}
          >
            {t('generateDraft')}
          </Button>
          <Button
            variant="secondary"
            icon={<RefreshCw size={15} />}
            onClick={actions.refresh}
            disabled={state.refreshing}
          >
            {t('refresh')}
          </Button>
        </>
      }
    />
  );

  const renderContent = () => {
    if (state.loading) {
      return (
        <div className="flex h-full flex-col items-center justify-center" aria-live="polite">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent-500" />
          <p className="mt-3 text-xs text-muted">{t('loading')}</p>
        </div>
      );
    }

    if (state.error) {
      return (
        <EmptyState
          icon={<AlertCircle size={22} />}
          title={t('loadFailed')}
          description={state.error}
          actions={
            <Button variant="primary" icon={<RefreshCw size={15} />} onClick={actions.refresh}>
              {t('retry')}
            </Button>
          }
        />
      );
    }

    if (currentView === 'history') return <HistoryView />;
    if (currentView === 'assist') {
      return (
        <AssistView
          data={selectedData}
          cacheKey={`${state.currentTabUrl}-${selectedIndex}`}
          onClose={() => setCurrentView(returnView === 'assist' ? 'inspector' : returnView)}
        />
      );
    }

    if (!selectedData) return renderEmptyData();
    if (currentView === 'issues') {
      return (
        <IssuesView
          data={selectedData}
          pageUrl={state.currentTabUrl}
          onNavigate={navigateToIssue}
        />
      );
    }

    return <InspectorView data={selectedData} focusRequest={focusRequest} />;
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-canvas text-ink">
      <SidePanelHeader
        hostname={hostname}
        schemaCount={state.jsonData?.count || 0}
        summary={summary}
        refreshing={state.refreshing}
        aiActive={currentView === 'assist'}
        onRefresh={actions.refresh}
        onAiTools={openAssist}
        onSettings={() => chrome.runtime.openOptionsPage()}
        labels={{
          product: t('extensionName'),
          refresh: t('refresh'),
          aiTools: t('aiTools'),
          settings: t('settings'),
          schemas: t('schemas'),
          noSchema: t('noSchema'),
          valid: t('valid'),
          issues: t('issues'),
        }}
      />

      {currentView !== 'assist' && (
        <PrimaryNav
          value={currentView}
          issueCount={issueCount}
          onChange={(view) => setCurrentView(view)}
          labels={{
            inspector: t('inspector'),
            issues: t('issues'),
            history: t('history'),
          }}
        />
      )}

      {(currentView === 'inspector' || currentView === 'issues') && state.jsonData && (
        <SchemaPicker
          data={state.jsonData.data}
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
          getIssueCount={getIssueCount}
          unknownType={t('unknownType')}
          schemaLabel={t('schema')}
        />
      )}

      <main className="min-h-0 flex-1 bg-canvas">{renderContent()}</main>
    </div>
  );
}
