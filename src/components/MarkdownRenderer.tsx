import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-t-lg">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
            copied
              ? 'text-green-400 bg-green-900/30'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-800 text-gray-100 text-xs p-3 rounded-b-lg overflow-x-auto whitespace-pre-wrap break-words m-0">
        <code>{children}</code>
      </pre>
    </div>
  );
};

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className }) => {
  return (
    <div className={`prose max-w-none prose-sm ${className || ''}`}>
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            const codeContent = String(children).replace(/\n$/, '');

            if (isInline) {
              return (
                <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                  {codeContent}
                </code>
              );
            }

            return (
              <CodeBlock language={match ? match[1] : undefined}>
                {codeContent}
              </CodeBlock>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
