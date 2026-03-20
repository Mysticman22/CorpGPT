import { motion } from 'framer-motion';
import { User, Database, Copy, Check, TerminalSquare, Cpu, Calendar } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

export default function ChatMessage({ message, isStreaming = false }) {
  const { role, content, timestamp } = message;
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col w-full ${isUser ? 'mb-4' : 'mb-8'}`}
    >
      {isUser ? (
        <div className="flex justify-end gap-3 max-w-[85%] ml-auto">
          <div className="bg-indigo-600/10 border border-indigo-500/20 px-5 py-3 rounded-2xl rounded-tr-none shadow-lg">
            <div className="flex items-center gap-2 mb-1.5 opacity-50">
              <TerminalSquare size={12} className="text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">User Query</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">{content}</p>
          </div>
          <div className="size-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <User size={16} className="text-indigo-400" />
          </div>
        </div>
      ) : (
        <div className="flex gap-4 group">
          <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/5">
            <Database size={20} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-none p-6 shadow-2xl relative overflow-hidden group/card">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/50 to-transparent opacity-30" />
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Nexus Intelligence Report</span>
                </div>
                <div className="flex items-center gap-3">
                   {timestamp && (
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                        <Calendar size={10} />
                        {format(new Date(timestamp), 'HH:mm')}
                    </div>
                  )}
                  <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-slate-500 hover:text-white"
                  >
                    {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="prose prose-invert prose-slate max-w-none prose-p:text-xs prose-p:leading-relaxed prose-p:text-slate-300 prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight prose-code:text-indigo-400 prose-code:bg-indigo-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[10px] prose-code:font-mono">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="rounded-xl overflow-hidden border border-white/10 my-6 shadow-2xl bg-[#0b0e14]">
                          <div className="bg-white/5 px-4 py-2 flex justify-between items-center border-b border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{match[1]}</span>
                          </div>
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent', fontSize: '0.8rem' }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code {...props}>{children}</code>
                      );
                    },
                    h1: ({node, ...props}) => <h1 className="text-lg mt-8 mb-4 border-b border-white/5 pb-2" {...props}/>,
                    h2: ({node, ...props}) => <h2 className="text-base mt-6 mb-3" {...props}/>,
                    h3: ({node, ...props}) => <h3 className="text-sm mt-4 mb-2" {...props}/>,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-indigo-500/50 pl-4 py-1 bg-indigo-500/5 rounded-r-lg my-4 text-slate-400 italic" {...props}/>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>

              {isStreaming && (
                <div className="flex items-center gap-2 mt-6 text-indigo-400/50">
                  <div className="flex gap-1.5">
                    <span className="size-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="size-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="size-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Analyzing neural patterns...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string
  }).isRequired,
  isStreaming: PropTypes.bool
};
