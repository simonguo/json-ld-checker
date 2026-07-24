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
    <div className="group relative my-3 overflow-hidden rounded-tool border border-border">
      <div className="flex items-center justify-between border-b border-gray-700 bg-[#24292f] px-3 py-1.5 font-mono text-[10px] text-gray-300">
        <span>{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 rounded px-2 py-0.5 transition-colors ${
            copied
              ? 'bg-success-600/20 text-green-300'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
      <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words bg-[#24292f] p-3 font-mono text-xs leading-5 text-gray-100">
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
    <div className={`text-xs leading-5 text-ink ${className || ''}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-4 text-sm font-semibold first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1.5 mt-3 text-xs font-semibold first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="my-2 leading-5 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-accent-600 hover:underline">{children}</a>,
          blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-border pl-3 text-muted">{children}</blockquote>,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            const codeContent = String(children).replace(/\n$/, '');

            if (isInline) {
              return (
                <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px] text-danger-600" {...props}>
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
