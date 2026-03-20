import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Menu,
  ChevronLeft,
  Sparkles,
  Database,
  FileSearch,
  Terminal,
  Search,
  Cpu,
  History,
  ShieldCheck
} from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import useChatStore from '../store/useChatStore';
import ollamaService from '../api/ollamaService';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const messagesEndRef = useRef(null);

  const {
    conversations,
    currentConversationId,
    selectedModel,
    isStreaming,
    ollamaConnected,
    availableModels,
    setOllamaConnected,
    setAvailableModels,
    setSelectedModel,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    addMessage,
    updateLastMessage,
    setStreaming,
    getCurrentConversation
  } = useChatStore();

  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkOllamaConnection();
  }, []);

  const checkOllamaConnection = async () => {
    setConnectionStatus('checking');
    const result = await ollamaService.checkConnection();
    setOllamaConnected(result.connected);
    setConnectionStatus(result.connected ? 'connected' : 'disconnected');
    if (result.connected) {
      setAvailableModels(result.models);
      if (result.models.length > 0 && !selectedModel) {
        setSelectedModel(result.models[0].name);
      }
    } else {
      toast.error('NEXUS Engine offline. Connectivity protocol failed.');
    }
  };

  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [getCurrentConversation()?.messages]);

  const currentConversation = getCurrentConversation();

  const handleNewChat = () => {
    const id = createConversation();
    navigate(`/chat/${id}`);
    toast.success('New intelligence thread initialized');
  };

  const handleSendMessage = async (content) => {
    if (!ollamaConnected) {
      toast.error('NEXUS connection required for query execution');
      return;
    }

    let activeId = currentConversationId;
    if (!activeId) {
      activeId = createConversation('New Query');
      navigate(`/chat/${activeId}`);
      selectConversation(activeId);
    }

    addMessage(activeId, 'user', content);
    const assistantMsg = addMessage(activeId, 'assistant', '');
    setStreaming(true);

    try {
      const conversation = useChatStore.getState().getCurrentConversation();
      const messages = conversation.messages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      await ollamaService.chat(
        selectedModel,
        messages,
        (chunk, full, done) => {
          updateLastMessage(activeId, full);
        }
      );

      setStreaming(false);
      if (conversation.messages.length <= 2) {
        const title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
        renameConversation(activeId, title);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Query execution failed. System alert raised.');
      setStreaming(false);
    }
  };

  const handleDeleteConversation = (id, e) => {
    e?.stopPropagation();
    deleteConversation(id);
    if (id === currentConversationId) navigate('/chat');
    toast.success('Query history purged');
  };

  const handleRenameSave = (id) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
      toast.success('Thread designation updated');
    }
    setEditingId(null);
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0e14] text-slate-200 font-sans relative overflow-hidden">
      
      {/* ── Background Gradients ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-[100px]" />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-80 h-full glass-sidebar border-r border-white/5 flex flex-col z-50 relative"
          >
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <History size={16} className="text-indigo-400" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Intelligence Archive</h2>
              </div>
              
              <button
                onClick={handleNewChat}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-indigo-500/30 transition-all text-indigo-400"
              >
                <Plus size={14} /> Initialize Query
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    selectConversation(conv.id);
                    navigate(`/chat/${conv.id}`);
                  }}
                  className={`group relative p-4 rounded-xl cursor-pointer border transition-all ${
                    conv.id === currentConversationId
                      ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold truncate ${conv.id === currentConversationId ? 'text-white' : 'text-slate-400'}`}>
                        {conv.title}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1 font-mono uppercase tracking-tighter">
                        {conv.messages.length} Records Detected
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-all text-slate-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/5">
               <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <div className={`size-1.5 rounded-full animate-pulse ${ollamaConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">
                    NEXUS Core: {ollamaConnected ? 'Operational' : 'Isolated'}
                  </span>
               </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0b0e14]/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
            >
              <Menu size={18} />
            </button>
            {currentConversation && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Active Thread</span>
                <h1 className="text-xs font-black text-white uppercase tracking-wider truncate max-w-xs">{currentConversation.title}</h1>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 opacity-60">
                <Cpu size={14} className="text-indigo-400" />
                <span className="text-[10px] font-mono tracking-tighter text-slate-400 uppercase">Engine: {selectedModel}</span>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all">
              <Settings size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {!currentConversation || currentConversation.messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center text-center mt-20">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/10">
                  <Database size={32} className="text-indigo-400" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight mb-3">Enterprise Search Engine</h1>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-12">
                  Access departmental intelligence and secure document vaults with RAG-accelerated precision.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                  {[
                    { label: "Internal Protocols", query: "Retrieve latest HR and security protocols", icon: ShieldCheck },
                    { label: "Q4 Performance", query: "Analyze department metrics for Q4", icon: Terminal },
                    { label: "Enterprise Docs", query: "Search vault for active vendor contracts", icon: FileSearch },
                    { label: "System Analysis", query: "Execute deep scan on architecture docs", icon: Cpu }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(item.query)}
                      className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all group"
                    >
                      <item.icon size={16} className="text-indigo-500/50 mb-3 group-hover:text-indigo-400 transition-colors" />
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{item.label}</div>
                      <div className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors truncate">{item.query}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-8 pb-12">
                {currentConversation.messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isStreaming={isStreaming && idx === currentConversation.messages.length - 1}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gradient-to-t from-[#0b0e14] to-transparent">
          <div className="max-w-4xl mx-auto backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isStreaming || !ollamaConnected}
              placeholder={ollamaConnected ? "Transmit query to NEXUS..." : "System restricted. Re-establishing link..."}
            />
          </div>
        </div>
      </main>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Engine Configuration">
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-3">Model Selection</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-indigo-500/50 outline-none transition-all"
            >
              {availableModels.map((model) => (
                <option key={model.name} value={model.name} className="bg-[#1a1b2e]">
                  {model.name.toUpperCase()} ({(model.size / 1e9).toFixed(1)} GB)
                </option>
              ))}
            </select>
          </div>
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Node Status</span>
              <span className={`text-[9px] font-mono ${ollamaConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ollamaConnected ? 'LINKED' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
              Intelligence node synchronized at 127.0.0.1:8000. All transmissions encrypted via RSA-4096.
            </p>
          </div>
        </div>
      </Modal>

      <style>{`
        .glass-sidebar {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(24px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.2);
        }
      `}</style>
    </div>
  );
}
