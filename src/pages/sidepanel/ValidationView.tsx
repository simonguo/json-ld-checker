import React, { useState, useEffect } from 'react';
import { ExternalLink, Download } from 'lucide-react';
import { validator } from '@/lib/validator';
import { useI18n } from '@/lib/i18n';

interface ValidationViewProps {
  data: any;
}

export const ValidationView: React.FC<ValidationViewProps> = ({ data }) => {
  const { t, lang } = useI18n();
  const [pageUrl, setPageUrl] = useState<string>('');

  useEffect(() => {
    // Get current page URL for Google test
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) {
        setPageUrl(tab.url);
      }
    });
  }, []);
  
  if (!data) {
    return <div className="text-gray-500">{t('noJsonLdData')}</div>;
  }

  const results = validator.validate(data, lang);
  const summary = validator.getSummary(results);

  // Extract schema type for schema.org link
  const schemaType = data['@type']
    ? (Array.isArray(data['@type']) ? data['@type'][0] : data['@type'])
    : null;
  const schemaOrgUrl = schemaType ? `https://schema.org/${schemaType}` : null;

  const getResultClass = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'suggestion': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleGoogleTest = () => {
    if (pageUrl) {
      const testUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`;
      window.open(testUrl, '_blank');
    }
  };

  const handleExportValidation = () => {
    const exportData = {
      url: pageUrl,
      timestamp: new Date().toISOString(),
      schema_type: schemaType,
      summary: {
        isValid: summary.isValid,
        errors: summary.errors,
        warnings: summary.warnings,
        suggestions: summary.suggestions,
      },
      errors: results.errors,
      warnings: results.warnings,
      suggestions: results.suggestions,
      info: results.info,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validation-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium">
            {summary.isValid ? t('validationPassed') : t('validationFailed')}
          </h3>
          <div className="flex gap-4 text-sm mt-1">
            <span className="text-red-600">{summary.errors} {t('errors')}</span>
            <span className="text-yellow-600">{summary.warnings} {t('warnings')}</span>
            <span className="text-blue-600">{summary.suggestions} {t('suggestions')}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <button
            onClick={handleGoogleTest}
            disabled={!pageUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('googleTestTitle')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('googleTest')}
          </button>
          {schemaOrgUrl && (
            <a
              href={schemaOrgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title={t('schemaOrgDocsTitle')}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {schemaType} {t('schemaDocs')}
            </a>
          )}
          <button
            onClick={handleExportValidation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title={t('exportValidation')}
          >
            <Download className="w-3.5 h-3.5" />
            {t('export')}
          </button>
        </div>
      </div>

      {[...results.errors, ...results.warnings, ...results.suggestions, ...results.info]
        .map((result, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${getResultClass(result.type)}`}
          >
            <h4 className="font-medium">{result.title}</h4>
            <p className="text-sm mt-1">{result.message}</p>
            {result.suggestion && (
              <p className="text-sm mt-2 italic border-t pt-2 border-gray-200">
                {t('suggestionLabel')}: {result.suggestion}
              </p>
            )}
          </div>
        ))}
    </div>
  );
};
