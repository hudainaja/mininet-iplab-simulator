'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const executeTerminalCommand = useNetworkStore(state => state.executeTerminalCommand);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse inline bold and code
  const renderInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline code `...`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] border border-slate-200 dark:border-slate-700 font-medium"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold **...**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-slate-900 dark:text-slate-100">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Plain text up to next special character
      const nextSpecial = remaining.search(/[`*]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  // Parse markdown into distinct structured blocks
  const blocks: Array<{
    type: 'h1' | 'h3' | 'h4' | 'hr' | 'p' | 'list' | 'code' | 'table';
    content?: string;
    lang?: string;
    items?: string[];
    tableData?: { headers: string[]; rows: string[][] };
  }> = [];

  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3) || 'bash';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'code',
        content: codeLines.join('\n'),
        lang
      });
      i++;
      continue;
    }

    // Markdown Table | ... |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) =>
          rowStr
            .split('|')
            .slice(1, -1)
            .map(c => c.trim());

        const headers = parseRow(tableLines[0]);
        // skip tableLines[1] if divider row (e.g. |:---|:---|)
        const startRowIdx = tableLines[1].includes('---') ? 2 : 1;
        const rows = tableLines.slice(startRowIdx).map(parseRow);

        blocks.push({
          type: 'table',
          tableData: { headers, rows }
        });
      }
      continue;
    }

    // Horizontal rule ---
    if (line.trim() === '---' || line.trim() === '***') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', content: line.slice(2).trim() });
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.slice(4).trim() });
      i++;
      continue;
    }

    if (line.startsWith('#### ')) {
      blocks.push({ type: 'h4', content: line.slice(5).trim() });
      i++;
      continue;
    }

    // Bullet list items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: 'list', items: listItems });
      continue;
    }

    // Paragraph
    if (line.trim().length > 0) {
      blocks.push({ type: 'p', content: line.trim() });
    }

    i++;
  }

  return (
    <div className="space-y-3 font-sans text-xs leading-relaxed text-slate-700 dark:text-slate-300 select-text">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1
                key={idx}
                className="text-base font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 mb-2"
              >
                {block.content}
              </h1>
            );

          case 'h3':
            return (
              <h3
                key={idx}
                className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 rounded-md mt-4 mb-2 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                <span>{block.content}</span>
              </h3>
            );

          case 'h4':
            return (
              <h4
                key={idx}
                className="text-xs font-semibold text-blue-700 dark:text-blue-400 mt-3 mb-1 flex items-center gap-1"
              >
                {block.content}
              </h4>
            );

          case 'hr':
            return <hr key={idx} className="border-slate-200 dark:border-slate-800 my-3" />;

          case 'p':
            return (
              <p key={idx} className="text-slate-600 dark:text-slate-300 leading-normal">
                {renderInline(block.content || '')}
              </p>
            );

          case 'list':
            return (
              <ul key={idx} className="space-y-1.5 my-2 pl-1">
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5 shrink-0" />
                    <span className="leading-normal">{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'code':
            return (
              <div
                key={idx}
                className="relative group my-2.5 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-sm"
              >
                {/* Header with language tag and copy button */}
                <div className="flex items-center justify-between px-3 py-1 bg-slate-950/80 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                  <span>{block.lang}</span>
                  <button
                    onClick={() => copyToClipboard(block.content || '', idx)}
                    className="flex items-center gap-1 hover:text-slate-200 text-slate-400 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-800 cursor-pointer"
                    title="Copy commands"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code body */}
                <pre className="p-3 text-[11px] font-mono text-slate-100 overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
                  {block.content}
                </pre>
              </div>
            );

          case 'table':
            return (
              <div
                key={idx}
                className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      {block.tableData?.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {block.tableData?.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 0 ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/50' : 'bg-slate-50/40 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800'}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 text-[11px] font-mono align-top"
                          >
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
