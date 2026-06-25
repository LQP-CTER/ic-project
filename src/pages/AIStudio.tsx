import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { chatCompletion } from '../lib/cerebras';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actionId?: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  prompt: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'poster', title: 'Tạo Poster', description: 'Tạo concept và nội dung poster truyền thông', prompt: 'Tạo concept và nội dung poster truyền thông nội bộ cho ', color: 'bg-primary-light text-primary border-primary/20' },
  { id: 'gtalk', title: 'Viết GTalk', description: 'Soạn tin nhắn GTalk ngắn gọn, thu hút', prompt: 'Viết nội dung GTalk nội bộ cho ', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'email', title: 'Soạn Email', description: 'Soạn email thông báo chuyên nghiệp', prompt: 'Soạn email thông báo nội bộ về ', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 'plan', title: 'Kế hoạch truyền thông', description: 'Lập kế hoạch truyền thông chi tiết', prompt: 'Lập kế hoạch truyền thông chi tiết cho ', color: 'bg-warning-light text-warning border-warning/20' },
  { id: 'survey', title: 'Khảo sát nhân viên', description: 'Xây dựng câu hỏi và kịch bản khảo sát', prompt: 'Xây dựng bộ câu hỏi khảo sát nhân viên về ', color: 'bg-success-light text-success border-success/20' },
  { id: 'townhall', title: 'Town Hall', description: 'Lên agenda và nội dung Town Hall', prompt: 'Lên agenda và nội dung chương trình Town Hall về ', color: 'bg-pink-50 text-pink-600 border-pink-200' },
];

const SYSTEM_PROMPT = `Bạn là AI Assistant chuyên về truyền thông nội bộ và gắn kết nhân viên cho một công ty Việt Nam. Bạn giúp:
- Tạo nội dung poster, GTalk, email truyền thông
- Lập kế hoạch truyền thông chi tiết
- Xây dựng khảo sát nhân viên
- Lên agenda Town Hall
Trả lời bằng tiếng Việt, format markdown, chuyên nghiệp và thực tế. Khi tạo nội dung, đưa ra nhiều phiên bản để lựa chọn.`;

export function AIStudio() {
  const { projects, activities, addContent } = useData();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [useProject, setUseProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedActivity = activities.find(a => a.id === selectedActivityId);
  const filteredActivities = activities.filter(a => a.projectId === selectedProjectId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [inputValue]);

  const buildContext = () => {
    if (!useProject || !selectedProject) return '';
    let ctx = `\n\nNgữ cảnh dự án: "${selectedProject.name}"`;
    if (selectedActivity) ctx += `, hoạt động: "${selectedActivity.name}"`;
    if (selectedActivity?.channel) ctx += `, kênh: ${selectedActivity.channel}`;
    if (selectedActivity?.deadline) ctx += `, deadline: ${selectedActivity.deadline}`;
    return ctx;
  };

  const handleSend = async (overridePrompt?: string) => {
    const text = (overridePrompt ?? inputValue).trim();
    if (!text || isGenerating) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, actionId: selectedTool || undefined, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsGenerating(true);

    const ctx = buildContext();
    const fullPrompt = text + ctx;

    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.slice(-6).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: fullPrompt },
    ];

    try {
      const response = await chatCompletion(chatMessages);
      const aiMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: response, actionId: selectedTool || undefined, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      toast.error('Không thể kết nối AI. Vui lòng kiểm tra API key.');
      const errorMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: 'Xin lỗi, tôi không thể kết nối lúc này. Vui lòng thử lại sau.', timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSelectedTool(null);
      setIsGenerating(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setSelectedTool(action.id);
    const suffix = selectedProject ? `chiến dịch "${selectedProject.name}"` : '...';
    setInputValue(action.prompt + suffix);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = (msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (msg: Message) => {
    const cType = selectedTool || 'generic';
    addContent({
      title: `${cType} — ${new Date().toLocaleDateString('vi-VN')}`,
      contentType: cType,
      projectId: selectedProject?.id ?? '',
      projectName: selectedProject?.name ?? '',
      activityId: selectedActivity?.id ?? '',
      activityName: selectedActivity?.name ?? '',
      prompt: msg.content,
      content: msg.content,
      createdAt: new Date().toISOString(),
    });
    setSavedId(msg.id);
    toast.success('Đã lưu vào thư viện');
    setTimeout(() => setSavedId(null), 2500);
  };

  const handleReset = () => { setMessages([]); setInputValue(''); };

  return (
    <div className="flex flex-1 min-h-0 gap-4 max-w-[1400px] w-full mx-auto">
      <aside className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto hide-scrollbar pb-4">
        <div className="mb-1">
          <h1 className="text-lg font-extrabold text-text-primary">AI Assistant</h1>
          <p className="text-xs text-text-tertiary mt-0.5">Trợ lý truyền thông nội bộ</p>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Hành động nhanh</p>

        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map(action => (
            <button key={action.id} onClick={() => handleQuickAction(action)}
              className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all duration-200 hover:shadow-sm ${action.color}`}>
              <span className="text-xs font-bold">{action.title}</span>
              <span className="text-[10px] opacity-70 leading-snug">{action.description}</span>
            </button>
          ))}
        </div>

        {messages.length > 0 && (
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-danger-light border border-danger/20 text-danger text-xs font-semibold hover:bg-danger/10 transition-colors">
            Cuộc trò chuyện mới
          </button>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto py-2 hide-scrollbar">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-light border border-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">AI</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">Xin chào</h2>
                <p className="text-sm text-text-secondary">Tôi là AI Assistant chuyên hỗ trợ <strong>truyền thông nội bộ</strong> và <strong>gắn kết nhân viên</strong>.</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-5 max-w-md w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-3">Tôi có thể hỗ trợ bạn</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Tạo concept poster', 'Viết GTalk nội bộ', 'Soạn email thông báo', 'Khảo sát nhân viên', 'Kế hoạch truyền thông', 'Ý tưởng Town Hall'].map((item, i) => (
                    <div key={i} className="text-xs text-text-secondary">{item}</div>
                  ))}
                </div>
              </div>
              <div className="max-w-lg w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Thử hỏi tôi</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Tạo poster launch khảo sát EES 2026', 'Viết GTalk nhắc nhở nhân viên', 'Soạn email Town Hall tháng 7', 'Kế hoạch truyền thông ghi nhận NV'].map((ex, i) => (
                    <button key={i} onClick={() => handleSend(ex)}
                      className="text-left px-3 py-2 rounded-lg bg-surface border border-border text-xs text-text-secondary hover:bg-primary-light hover:border-primary/20 hover:text-primary transition-all truncate">
                      "{ex}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`mb-4 animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[70%] bg-primary text-white rounded-2xl rounded-br-md px-4 py-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-light border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-bold text-primary">AI</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-surface border border-border rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="prose prose-sm max-w-none text-text-primary leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleCopy(msg)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${copiedId === msg.id ? 'bg-success-light text-success' : 'bg-surface-tertiary text-text-tertiary hover:text-text-primary'}`}>
                        {copiedId === msg.id ? 'Đã chép' : 'Sao chép'}
                      </button>
                      <button onClick={() => handleSave(msg)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${savedId === msg.id ? 'bg-success-light text-success' : 'bg-surface-tertiary text-text-tertiary hover:text-text-primary'}`}>
                        {savedId === msg.id ? 'Đã lưu' : 'Lưu vào thư viện'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-light border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">AI</span>
              </div>
              <div className="bg-surface border border-border rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 pt-3">
          <div className="mb-3 bg-surface border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Ngữ cảnh</span>
              <button onClick={() => { setUseProject(false); setSelectedProjectId(''); setSelectedActivityId(''); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${!useProject ? 'bg-primary-light border-primary/30 text-primary' : 'border-border text-text-tertiary'}`}>
                Không dùng
              </button>
              <button onClick={() => setUseProject(true)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${useProject ? 'bg-primary-light border-primary/30 text-primary' : 'border-border text-text-tertiary'}`}>
                Chọn dự án
              </button>
              {useProject && (
                <>
                  <select value={selectedProjectId} onChange={e => { setSelectedProjectId(e.target.value); setSelectedActivityId(''); }}
                    className="px-3 py-1 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-primary outline-none">
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {selectedProjectId && (
                    <select value={selectedActivityId} onChange={e => setSelectedActivityId(e.target.value)}
                      className="px-3 py-1 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-primary outline-none">
                      <option value="">-- Hoạt động --</option>
                      {filteredActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-surface border border-primary/30 rounded-2xl px-4 py-3 shadow-sm">
            <textarea ref={textareaRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Hãy mô tả nội dung bạn muốn tạo..." rows={1}
              className="w-full bg-transparent border-none outline-none text-sm text-text-primary leading-relaxed resize-none overflow-hidden min-h-[24px]" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-text-tertiary">Shift+Enter để xuống dòng · Enter để gửi</span>
              <button onClick={() => handleSend()} disabled={!inputValue.trim() || isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${inputValue.trim() && !isGenerating ? 'bg-primary text-white hover:bg-primary-hover shadow-sm' : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'}`}>
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
