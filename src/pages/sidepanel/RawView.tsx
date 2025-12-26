import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface RawViewProps {
  data: any;
}

export const RawView: React.FC<RawViewProps> = ({ data }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  if (!data) {
    return <div className="text-gray-500">No data to display</div>;
  }

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Copy Button */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between z-10">
        <span className="text-sm font-medium text-gray-700">JSON Data</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            copied
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              {t('copied')}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      {/* JSON Content */}
      <div className="bg-gray-50 overflow-auto max-h-[calc(100vh-280px)]">
        <pre className="p-4 text-sm text-gray-800 font-mono whitespace-pre-wrap break-words">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};
