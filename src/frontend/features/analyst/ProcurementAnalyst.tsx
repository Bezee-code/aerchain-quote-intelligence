import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  Download,
  Trash2,
  Bot,
  User,
  CheckCircle2,
  TrendingDown,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  scenario?: {
    type: string;
    totalSpend: number;
    savingsAmount?: number;
    vendors: { id: string; name: string; allocatedLines: number; subtotal: number }[];
    unallocatedCount: number;
    details?: any;
  };
  toolCalls?: { name: string; args: any; id: string }[];
  timestamp: string;
}

interface ProcurementAnalystProps {
  rfxId: string;
}

const PRESET_QUESTIONS = [
  {
    label: "🎯 The VP's Split Award Question",
    prompt: "What if we split it, cheapest per line, but only among vendors who cleared the quality questionnaire?",
    description: "Evaluates compliant split-award savings vs single-sourcing",
  },
  {
    label: "📊 Compare Total Spend Across Vendors",
    prompt: "Compare total spend if we single-source to each vendor across all 30 line items.",
    description: "Ranks all suppliers by cumulative quotation cost",
  },
  {
    label: "⚠️ Audit Missing Items & Exceptions",
    prompt: "Show me which vendors have missing unquoted line items and commercial exceptions.",
    description: "Finds PackRight's omitted lines and non-standard terms",
  },
  {
    label: "📝 Executive Award Decision Memo",
    prompt: "Draft an executive award recommendation memo for the VP explaining the optimal dual-sourcing strategy.",
    description: "Generates board-ready procurement justification",
  },
];

export function ProcurementAnalyst({ rfxId }: ProcurementAnalystProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I am your **Procurement Analyst Co-Pilot** for RFx \`${rfxId}\`.\n\nI have continuous visibility into the complete 30-item comparison matrix, vendor quotations, document evidence snippets, and supplier qualification statuses.\n\nYou can interrogate the comparison in natural language, model split-award scenarios, or test the VP's question using the quick prompts below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyst/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfxId,
          sessionId: `sess-${rfxId}`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'Analysis completed with no additional details.',
        scenario: data.scenario,
        toolCalls: data.toolCalls,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Analyst Query Error**: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExportMemo = () => {
    const markdownContent = messages
      .map(m => `### ${m.role === 'user' ? '👤 Buyer Query' : '🤖 Analyst Decision'} (${m.timestamp})\n\n${m.content}\n\n---\n`)
      .join('\n');

    const header = `# AERCHAIN QUOTE INTELLIGENCE — EXECUTIVE SOURCING MEMO\nRFx: ${rfxId}\nGenerated: ${new Date().toLocaleString()}\n\n---\n\n`;
    const fullText = header + markdownContent;

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aerchain_Award_Decision_Memo_${rfxId}_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    if (confirm('Clear the current conversation history?')) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: `Conversation reset. How can I assist with your sourcing decision for RFx \`${rfxId}\`?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-6xl mx-auto space-y-4">
      {/* Top Header Card */}
      <Card className="border shadow-xs shrink-0">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">Procurement Analyst Co-Pilot</CardTitle>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Google Gemini Intelligence
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Natural-language interrogation over 30 line items, 5 vendors, and supplier qualification audits.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMemo}
              className="text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export Decision Memo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Preset Question Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-xs font-medium text-muted-foreground shrink-0 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Suggestions:
        </span>
        {PRESET_QUESTIONS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSend(preset.prompt)}
            className="text-xs px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted border text-foreground/80 hover:text-foreground whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            title={preset.description}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Main Conversation Stream */}
      <Card className="flex-1 overflow-hidden flex flex-col border shadow-xs">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted/40 border text-foreground rounded-bl-none'
                }`}
              >
                {/* Scenario Metric Tiles */}
                {msg.scenario && (
                  <div className="mb-3 p-3 bg-background rounded-lg border space-y-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                      Scenario Optimization Metrics
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded bg-muted/40 border">
                        <span className="text-[10px] text-muted-foreground block">Total Compliant Spend</span>
                        <span className="font-bold text-sm text-foreground">
                          ₹{msg.scenario.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-600 font-medium block">Projected Savings</span>
                        <span className="font-bold text-sm text-emerald-600">
                          ₹{(msg.scenario.savingsAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-muted/40 border">
                        <span className="text-[10px] text-muted-foreground block">Suppliers Awarded</span>
                        <span className="font-bold text-sm text-foreground">
                          {msg.scenario.vendors.length} Vendors
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formatted Markdown Content */}
                <div className="space-y-2 whitespace-pre-wrap font-sans">
                  <MarkdownRenderer content={msg.content} />
                </div>

                <div
                  className={`text-[10px] mt-2 pt-1 border-t flex items-center justify-between opacity-70 ${
                    msg.role === 'user' ? 'border-primary-foreground/20' : 'border-border'
                  }`}
                >
                  <span>{msg.role === 'user' ? 'Category Buyer' : 'Procurement Analyst'}</span>
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted/40 border rounded-xl rounded-bl-none px-4 py-3 text-xs flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Interrogating comparison workspace and evaluating supplier models...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Bar */}
        <div className="p-3 bg-card border-t shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question... (e.g. 'What if we split it among vendors who cleared the quality questionnaire?')"
                rows={2}
                disabled={isLoading}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-10 px-4 flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </>
              )}
            </Button>
          </form>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>💡 Pro-tip: Press Enter to send, Shift+Enter for new line</span>
            <span>Real-time sourcing analysis powered by Aerchain Quote Intelligence</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Lightweight, robust markdown-to-HTML parser for tabular data, bullet points, headers, and citations.
 */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="my-2 overflow-x-auto rounded border">
          <table className="w-full text-left text-[11px] border-collapse">
            <tbody>
              {tableRows.map((r, rIdx) => {
                const isHeader = rIdx === 0;
                const isDivider = r.includes('---');
                if (isDivider) return null;

                const cells = r.split('|').filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1);

                return (
                  <tr
                    key={rIdx}
                    className={isHeader ? 'bg-muted/70 font-semibold border-b' : 'border-b last:border-b-0 hover:bg-muted/20'}
                  >
                    {cells.map((cell, cIdx) => {
                      const clean = cell.trim();
                      if (isHeader) {
                        return (
                          <th key={cIdx} className="p-2 border-r last:border-r-0">
                            {formatInline(clean)}
                          </th>
                        );
                      }
                      return (
                        <td key={cIdx} className="p-2 border-r last:border-r-0">
                          {formatInline(clean)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
    inTable = false;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|')) {
      inTable = true;
      tableRows.push(trimmed);
      return;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="font-bold text-sm text-foreground mt-3 mb-1">
          {formatInline(trimmed.replace('### ', ''))}
        </h3>
      );
    } else if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={idx} className="font-semibold text-xs text-foreground mt-2 mb-0.5">
          {formatInline(trimmed.replace('#### ', ''))}
        </h4>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5">
          <span className="text-primary mt-0.5">•</span>
          <span>{formatInline(trimmed.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5">
          <span className="font-semibold text-foreground/80">{trimmed.match(/^\d+\./)?.[0]}</span>
          <span>{formatInline(trimmed.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-1" />);
    } else {
      elements.push(
        <p key={idx} className="my-0.5 leading-relaxed">
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  if (inTable) flushTable();

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  // Bold formatting **text**
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded text-foreground">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
