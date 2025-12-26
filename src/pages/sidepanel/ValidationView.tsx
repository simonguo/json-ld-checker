import React from 'react';
import { validator } from '@/lib/validator';
import { useI18n } from '@/lib/i18n';

interface ValidationViewProps {
  data: any;
}

export const ValidationView: React.FC<ValidationViewProps> = ({ data }) => {
  const { t, lang } = useI18n();
  
  if (!data) {
    return <div className="text-gray-500">{t('noJsonLdData')}</div>;
  }

  const results = validator.validate(data, lang);
  const summary = validator.getSummary(results);

  const getResultClass = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'suggestion': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <h3 className="font-medium">
          {summary.isValid ? t('validationPassed') : t('validationFailed')}
        </h3>
        <div className="flex gap-4 text-sm">
          <span className="text-red-600">{summary.errors} {t('errors')}</span>
          <span className="text-yellow-600">{summary.warnings} {t('warnings')}</span>
          <span className="text-blue-600">{summary.suggestions} {t('suggestions')}</span>
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
