import { useState, useRef, useEffect } from 'react';
import { Terminal, Database, SendHorizonal } from 'lucide-react';
import PropTypes from 'prop-types';

export default function ChatInput({ onSend, disabled = false, placeholder = 'Initialize intelligence query...' }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white/5 border border-white/5 p-2 focus-within:border-indigo-500/30 focus-within:bg-white/[0.08] transition-all flex items-end gap-3 group/input shadow-inner">
      
      <div className="shrink-0 size-10 flex items-center justify-center text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">
        <Terminal size={18} />
      </div>

      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="
          flex-1 
          bg-transparent 
          text-slate-200 font-mono text-[13px] leading-relaxed
          placeholder-slate-600
          resize-none
          outline-none
          max-h-[200px]
          disabled:opacity-30
          py-2.5
          custom-scrollbar
        "
      />

      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className="
          size-10 rounded-xl
          bg-indigo-600/10 border border-indigo-500/20
          text-indigo-400
          hover:bg-indigo-600 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]
          transition-all duration-300
          disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:shadow-none
          active:scale-95
          shrink-0 flex items-center justify-center
        "
        title="Execute Protocol (Enter)"
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  );
}

ChatInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string
};
