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
import { ParseErrorView } from './ParseErrorView';
import { ReviewPrompt } from './components/ReviewPrompt';
import {
  PrimaryNav,
  SchemaPicker,
  SidePanelHeader,
} from './components/SidePanelChrome';
import { useJsonLdSession } from './hooks/useJsonLdSession';
import type { FocusRequest, SidePanelView } from './types';
import type { JsonLdInspectionItem } from '@/lib/json-ld';
import type { ValidationSummary } from '@/lib/validator';
import { createJsonLdReport, openJsonLdReport } from '@/lib/report';
import { useReviewPrompt } from './hooks/useReviewPrompt';

export default function SidePanelPage() {
  const { t, lang } = useI18n();
  const { state, actions } = useJsonLdSession(t('unableToGetCurrentTab'));
  const [currentView, setCurrentView] = useState<SidePanelView>('inspector');
  const [returnView, setReturnView] = useState<SidePanelView>('inspector');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const focusToken = useRef(0);
  const reviewPrompt = useReviewPrompt(
    state.currentTabUrl,
    Boolean(state.jsonData?.entities.length),
  );

  const selectedItem = state.jsonData?.items[selectedIndex];
  const selectedData = selectedItem?.kind === 'entity' ? selectedItem.data : undefined;
  const validationResults = useMemo(
    () => (selectedData ? validator.validate(selectedData, lang) : null),
    [selectedData, lang],
  );
  const summary = useMemo<ValidationSummary | undefined>(() => {
    if (selectedItem?.kind === 'parse-error') {
      return { total: 1, errors: 1, warnings: 0, suggestions: 0, isValid: false };
    }
    return validationResults ? validator.getSummary(validationResults) : undefined;
  }, [selectedItem, validationResults]);
  const issueCount = (summary?.errors || 0) + (summary?.warnings || 0);

  useEffect(() => {
    const count = state.jsonData?.items.length || 0;
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

  const getIssueCount = (item: JsonLdInspectionItem) => {
    if (!item || item.kind === 'parse-error') return 1;
    const result = validator.getSummary(validator.validate(item.data, lang));
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

    if (!selectedItem) return renderEmptyData();
    if (selectedItem.kind === 'parse-error') {
      return (
        <ParseErrorView
          item={selectedItem}
          onReport={() =>
            state.jsonData &&
            openJsonLdReport(
              createJsonLdReport(state.jsonData, state.currentTabUrl, lang),
            ).then(() => reviewPrompt.actions.reportExported())
          }
        />
      );
    }
    if (currentView === 'issues') {
      return (
        <IssuesView
          data={selectedItem.data}
          pageUrl={state.currentTabUrl}
          scanResult={state.jsonData!}
          onReportOpened={reviewPrompt.actions.reportExported}
          onNavigate={navigateToIssue}
        />
      );
    }

    const block = state.jsonData?.blocks[selectedItem.blockIndex];
    return (
      <InspectorView
        data={selectedItem.data}
        raw={block?.raw}
        script={block?.script}
        focusRequest={focusRequest}
      />
    );
  };

  return (
    <div className="relative flex h-screen min-h-0 flex-col overflow-hidden bg-canvas text-ink">
      <SidePanelHeader
        hostname={hostname}
        schemaCount={state.jsonData?.blockCount || 0}
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
          items={state.jsonData.items}
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
          getIssueCount={getIssueCount}
          unknownType={t('unknownType')}
          schemaLabel={t('schema')}
        />
      )}

      <main className="min-h-0 flex-1 bg-canvas">{renderContent()}</main>

      {reviewPrompt.state.visible && (
        <ReviewPrompt
          title={t('reviewPromptTitle')}
          description={t('reviewPromptDescription')}
          reviewLabel={t('reviewExtension')}
          dismissLabel={t('notNow')}
          onReview={reviewPrompt.actions.review}
          onDismiss={reviewPrompt.actions.dismiss}
        />
      )}
    </div>
  );
}
