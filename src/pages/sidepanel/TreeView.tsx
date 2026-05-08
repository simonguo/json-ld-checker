import React, { useState, useCallback } from 'react';
import { JSONTree } from 'react-json-tree';
import { Search, X, Code2, TreePine, Copy, Check, Edit3, Download, ArrowUpDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { validator } from '@/lib/validator';

interface TreeViewProps {
  data: any;
}

// Custom theme for react-json-tree with modern colors
const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#ffffff',
  base01: '#f6f8fa',
  base02: '#e1e4e8',
  base03: '#959da5',
  base04: '#6a737d',
  base05: '#24292e',
  base06: '#1b1f23',
  base07: '#0d1117',
  base08: '#d73a49', // Red for null/undefined
  base09: '#f97583', // Orange for boolean
  base0A: '#ffd33d', // Yellow
  base0B: '#22863a', // Green for strings
  base0C: '#39c5cf', // Cyan
  base0D: '#005cc5', // Blue for numbers
  base0E: '#6f42c1', // Purple for functions
  base0F: '#b31d28', // Error
};

export const TreeView: React.FC<TreeViewProps> = ({ data }) => {
  const { t, lang } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [sortKeys, setSortKeys] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editText, setEditText] = useState<string>(() => JSON.stringify(data, null, 2));
  const [editParseError, setEditParseError] = useState<string | null>(null);
  const [editValidation, setEditValidation] = useState<{ errors: number; warnings: number } | null>(null);
  const [editCopied, setEditCopied] = useState(false);

  const handleCopyRaw = async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEditCopy = async () => {
    try {
      await navigator.clipboard.writeText(editText);
      setEditCopied(true);
      setTimeout(() => setEditCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEditChange = useCallback((value: string) => {
    setEditText(value);
    try {
      const parsed = JSON.parse(value);
      setEditParseError(null);
      const results = validator.validate(parsed, lang);
      setEditValidation({ errors: results.errors.length, warnings: results.warnings.length });
    } catch (e: any) {
      setEditParseError(e.message);
      setEditValidation(null);
    }
  }, [lang]);

  const resetEditState = useCallback(() => {
    setEditText(JSON.stringify(data, null, 2));
    setEditParseError(null);
    setEditValidation(null);
  }, [data]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleExport = () => {
    const content = viewMode === 'raw' ? editText : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const schemaType = data?.['@type']
      ? (Array.isArray(data['@type']) ? data['@type'][0] : data['@type'])
      : 'json-ld';
    a.download = `${schemaType}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Filter function to search through JSON data
  const shouldExpandNode = (keyPath: (string | number)[], data: any, level: number): boolean => {
    if (!searchTerm) {
      // Expand first level by default
      return level === 0;
    }
    
    // If searching, expand all nodes to show matches
    return true;
  };
  
  // Check if a key matches the search term
  const keyMatchesSearch = (key: string | number): boolean => {
    if (!searchTerm) return false;
    const searchLower = searchTerm.toLowerCase();
    const keyStr = String(key).toLowerCase();
    return keyStr.includes(searchLower);
  };
  
  if (!data) {
    return <div className="text-gray-500">No data to display</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with search and view toggle */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-3 z-10 space-y-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
              viewMode === 'tree'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TreePine className="w-4 h-4" />
            {t('treeView')}
          </button>
          <button
            onClick={() => {
              setViewMode('raw');
              resetEditState();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
              viewMode === 'raw'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            {t('rawData')}
          </button>

          {viewMode === 'raw' && (
            <button
              onClick={handleEditCopy}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
                editCopied
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {editCopied ? (
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
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            title={t('exportJson')}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search bar - only show in tree mode */}
        {viewMode === 'tree' && (
          <div className="relative flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white hover:border-primary-500 hover:shadow-sm focus-within:bg-white focus-within:border-primary-500 focus-within:shadow-sm focus-within:ring-2 focus-within:ring-primary-100">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0 mr-2" />
            <input 
              type="text" 
              className="flex-1 border-0 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              placeholder={t('searchPlaceholder')} 
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button 
                className="bg-transparent border-0 p-1 cursor-pointer text-gray-400 flex items-center justify-center rounded transition-all duration-200 flex-shrink-0 ml-1 hover:bg-red-50 hover:text-red-600"
                title={t('clearSearch')} 
                onClick={handleClearSearch}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="max-h-[calc(100vh-320px)] overflow-auto">
        {viewMode === 'tree' ? (
          <div className="font-mono text-xs p-3 bg-white relative">
            <button
              onClick={() => setSortKeys(!sortKeys)}
              className={`absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-all ${
                sortKeys
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
              title={sortKeys ? t('sourceOrder') : t('sortKeys')}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortKeys ? t('sortKeys') : t('sourceOrder')}
            </button>
            <JSONTree
              data={data}
              theme={theme}
              invertTheme={false}
              sortObjectKeys={sortKeys}
              shouldExpandNodeInitially={shouldExpandNode}
              hideRoot={false}
              getItemString={(type, data, itemType, itemString) => {
                return (
                  <span className="text-gray-400 text-[11px] ml-1.5">
                    {itemType === 'Array' ? `Array[${(data as any[]).length}]` : `Object{${Object.keys(data as object).length}}`}
                  </span>
                );
              }}
              labelRenderer={(keyPath) => {
                const key = keyPath[0];
                const keyStr = String(key);
                const isMatch = keyMatchesSearch(key);
                
                // Highlight matching keys
                if (isMatch && searchTerm) {
                  const parts = keyStr.split(new RegExp(`(${searchTerm})`, 'gi'));
                  return (
                    <span className="text-blue-600 font-medium">
                      {parts.map((part, i) => 
                        part.toLowerCase() === searchTerm.toLowerCase() ? 
                          <mark key={i} className="bg-yellow-100 px-0.5 rounded">{part}</mark> : 
                          part
                      )}
                    </span>
                  );
                }
                
                return (
                  <span className="text-blue-600 font-medium">
                    {keyStr}
                  </span>
                );
              }}
              valueRenderer={(raw, value) => {
                if (value === null) {
                  return <span className="text-purple-600">null</span>;
                }
                if (typeof value === 'string') {
                  // Highlight search term in values
                  if (searchTerm && value.toLowerCase().includes(searchTerm.toLowerCase())) {
                    const parts = value.split(new RegExp(`(${searchTerm})`, 'gi'));
                    return (
                      <span className="text-green-700">
                        "
                        {parts.map((part, i) => 
                          part.toLowerCase() === searchTerm.toLowerCase() ? 
                            <mark key={i} className="bg-yellow-100 px-0.5">{part}</mark> : 
                            part
                        )}
                        "
                      </span>
                    );
                  }
                  return <span className="text-green-700">"{value}"</span>;
                }
                if (typeof value === 'number') {
                  return <span className="text-blue-600">{value}</span>;
                }
                if (typeof value === 'boolean') {
                  return <span className="text-red-600">{value.toString()}</span>;
                }
                return <span>{String(value)}</span>;
              }}
            />
          </div>
        ) : (
          <div className="bg-gray-50">
            {/* Live validation status bar */}
            <div className={`flex items-center gap-2 px-3 py-1.5 text-xs border-b ${
              editParseError
                ? 'bg-red-50 border-red-200 text-red-700'
                : editValidation && editValidation.errors > 0
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <Edit3 className="w-3 h-3 flex-shrink-0" />
              {editParseError ? (
                <span>{t('jsonParseError')}: {editParseError}</span>
              ) : editValidation ? (
                <span>
                  {editValidation.errors > 0
                    ? `${editValidation.errors} ${t('errors')}${editValidation.warnings > 0 ? `, ${editValidation.warnings} ${t('warnings')}` : ''}`
                    : editValidation.warnings > 0
                    ? `${editValidation.warnings} ${t('warnings')}`
                    : t('validationPassed')}
                </span>
              ) : (
                <span>{t('editToValidate')}</span>
              )}
            </div>
            <textarea
              value={editText}
              onChange={(e) => handleEditChange(e.target.value)}
              className="w-full text-sm text-gray-800 font-mono p-4 bg-gray-50 border-0 outline-none resize-none"
              style={{ minHeight: 'calc(100vh - 380px)', tabSize: 2 }}
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
