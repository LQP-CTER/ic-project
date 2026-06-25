import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { chatCompletion } from '../lib/cerebras';
import { type Project } from '../data/mockData';
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
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'gtalk', title: 'Viết GTalk', description: '3 phiên bản ngắn, sẵn sàng gửi', prompt: 'Viết GTalk nội bộ cho ' },
  { id: 'email', title: 'Soạn Email', description: 'Email rõ ý, đúng vai trò IC', prompt: 'Soạn email thông báo nội bộ về ' },
  { id: 'poster', title: 'Tạo Poster', description: 'Concept, headline, body copy', prompt: 'Tạo concept và nội dung poster truyền thông nội bộ cho ' },
  { id: 'plan', title: 'Kế hoạch truyền thông', description: 'Plan gọn theo timeline', prompt: 'Lập kế hoạch truyền thông chi tiết cho ' },
  { id: 'survey', title: 'Khảo sát nhân viên', description: 'Câu hỏi và lời dẫn khảo sát', prompt: 'Xây dựng bộ câu hỏi khảo sát nhân viên về ' },
  { id: 'townhall', title: 'Town Hall', description: 'Agenda và key message', prompt: 'Lên agenda và nội dung chương trình Town Hall về ' },
];

const SYSTEM_PROMPT = `Bạn là IC Copy Assistant cho team EX tại một công ty Việt Nam.
Mục tiêu: tạo nội dung truyền thông nội bộ có thể copy dùng ngay.

Quy tắc bắt buộc:
- Trả lời bằng tiếng Việt.
- Ngắn gọn, thực tế, đúng yêu cầu. Không viết lan man.
- Không dùng emoji, trừ khi người dùng yêu cầu rõ.
- Không dùng bảng markdown, không code block, không gạch ngang phân cách, không phần "Kết luận", không phần "Hướng dẫn sử dụng" nếu người dùng không hỏi.
- Không tự bịa email, SharePoint, deadline, tên phòng ban, link hoặc thông tin cụ thể nếu người dùng chưa cung cấp. Dùng placeholder ngắn như [link], [deadline], [người gửi] khi cần.
- Nếu tạo nội dung GTalk/Slack/Teams: tối đa 3 phiên bản, mỗi phiên bản 2-4 câu, có CTA rõ, không giải thích ưu điểm.
- Nếu tạo email: gồm Subject và Body, tối đa 2 phiên bản.
- Nếu tạo poster: gồm Concept, Headline, Subline, Body copy, CTA; tối đa 2 concept.
- Nếu tạo kế hoạch: tối đa 5 bước, mỗi bước 1-2 dòng.
- Nếu thiếu thông tin quan trọng, vẫn tạo bản nháp dùng placeholder; chỉ hỏi lại khi thật sự không thể làm.

Định dạng ưu tiên: tiêu đề ngắn + nội dung copy-ready. Không trang trí quá mức.`;

const INTENT_GUIDES: Record<string, { instruction: string; maxTokens: number; temperature: number }> = {
  gtalk: {
    maxTokens: 650,
    temperature: 0.45,
    instruction: `
Yêu cầu định dạng cho GTalk:
- Chỉ trả về 3 phiên bản: "Phiên bản 1", "Phiên bản 2", "Phiên bản 3".
- Mỗi phiên bản gồm một đoạn GTalk hoàn chỉnh, 2-4 câu.
- Không tiêu đề phụ dài, không ưu điểm, không hướng dẫn, không bảng, không emoji.
- Nội dung phải copy gửi được ngay.
- Nếu thiếu thông tin, dùng placeholder [deadline], [link], [đối tượng].`,
  },
  email: {
    maxTokens: 900,
    temperature: 0.45,
    instruction: `
Yêu cầu định dạng cho Email:
- Tối đa 2 phiên bản.
- Mỗi phiên bản gồm Subject và Body.
- Body ngắn, rõ bối cảnh, hành động cần làm, deadline nếu có.
- Không bảng, không emoji, không giải thích ngoài nội dung email.`,
  },
  poster: {
    maxTokens: 900,
    temperature: 0.55,
    instruction: `
Yêu cầu định dạng cho Poster:
- Tối đa 2 concept.
- Mỗi concept gồm: Concept, Headline, Subline, Body copy, CTA.
- Copy ngắn, sắc, phù hợp truyền thông nội bộ.
- Không giải thích dài, không bảng.`,
  },
  plan: {
    maxTokens: 1200,
    temperature: 0.45,
    instruction: `
Yêu cầu định dạng cho kế hoạch:
- Tối đa 5 giai đoạn/bước.
- Mỗi bước có Mục tiêu, Kênh, Nội dung chính, Deadline gợi ý nếu có.
- Không bảng markdown; dùng bullet ngắn.`,
  },
  survey: {
    maxTokens: 1000,
    temperature: 0.45,
    instruction: `
Yêu cầu định dạng cho khảo sát:
- Gồm lời dẫn ngắn và tối đa 8 câu hỏi.
- Câu hỏi rõ, dễ hiểu, phù hợp nhân viên.
- Không bảng, không emoji.`,
  },
  townhall: {
    maxTokens: 1000,
    temperature: 0.5,
    instruction: `
Yêu cầu định dạng cho Town Hall:
- Gồm theme, key message, agenda tối đa 5 mục, lời dẫn MC ngắn.
- Không bảng, không emoji, không giải thích dài.`,
  },
  generic: {
    maxTokens: 850,
    temperature: 0.5,
    instruction: `
Yêu cầu định dạng chung:
- Trả lời gọn, copy-ready.
- Nếu đưa nhiều lựa chọn, tối đa 3 lựa chọn.
- Không bảng, không emoji, không code block, không phần hướng dẫn/kết luận không cần thiết.`,
  },
};

function detectIntent(text: string, selectedTool: string | null): keyof typeof INTENT_GUIDES {
  if (selectedTool && selectedTool in INTENT_GUIDES) return selectedTool as keyof typeof INTENT_GUIDES;
  const lower = text.toLowerCase();
  if (lower.includes('gtalk') || lower.includes('slack') || lower.includes('teams') || lower.includes('tin nhắn')) return 'gtalk';
  if (lower.includes('email') || lower.includes('mail')) return 'email';
  if (lower.includes('poster') || lower.includes('banner')) return 'poster';
  if (lower.includes('kế hoạch') || lower.includes('plan') || lower.includes('timeline')) return 'plan';
  if (lower.includes('khảo sát') || lower.includes('survey')) return 'survey';
  if (lower.includes('town hall') || lower.includes('townhall')) return 'townhall';
  return 'generic';
}

function cleanupAiOutput(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, block => block.replace(/```/g, '').trim())
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function AIStudio() {
  const { projects, activities, addProject, addContent } = useData();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [useProject, setUseProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [showQuickProject, setShowQuickProject] = useState(false);
  const [quickProject, setQuickProject] = useState({ name: '', assignee: '', deadline: '' });
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedActivity = activities.find(a => a.id === selectedActivityId);
  const filteredActivities = activities.filter(a => a.projectId === selectedProjectId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 132) + 'px';
    }
  }, [inputValue]);

  const buildContext = () => {
    if (!useProject || !selectedProject) return '';
    const briefParts = [
      selectedProject.objective && `Mục tiêu: ${selectedProject.objective}`,
      selectedProject.audience && `Đối tượng: ${selectedProject.audience}`,
      selectedProject.keyMessage && `Thông điệp chính: ${selectedProject.keyMessage}`,
      selectedProject.cta && `CTA: ${selectedProject.cta}`,
      selectedProject.channels && `Kênh dự kiến: ${selectedProject.channels}`,
      selectedProject.toneOfVoice && `Tone: ${selectedProject.toneOfVoice}`,
      selectedProject.mandatoryInfo && `Thông tin bắt buộc: ${selectedProject.mandatoryInfo}`,
    ].filter(Boolean);

    let ctx = `\n\nNgữ cảnh dự án: "${selectedProject.name}"`;
    if (briefParts.length > 0) ctx += `\nProject brief:\n- ${briefParts.join('\n- ')}`;
    if (selectedActivity) ctx += `\nHoạt động: "${selectedActivity.name}"`;
    if (selectedActivity?.channel) ctx += `\nKênh activity: ${selectedActivity.channel}`;
    if (selectedActivity?.deadline) ctx += `\nDeadline activity: ${selectedActivity.deadline}`;
    if (selectedActivity?.approver) ctx += `\nNgười duyệt: ${selectedActivity.approver}`;
    if (selectedActivity?.reviewNotes) ctx += `\nGhi chú review: ${selectedActivity.reviewNotes}`;
    return ctx;
  };

  const handleSend = async (overridePrompt?: string) => {
    const text = (overridePrompt ?? inputValue).trim();
    if (!text || isGenerating) return;

    const intent = detectIntent(text, selectedTool);
    const guide = INTENT_GUIDES[intent];
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, actionId: intent, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsGenerating(true);

    const ctx = buildContext();
    const fullPrompt = `${text}${ctx}\n\n${guide.instruction}`;

    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.slice(-4).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: fullPrompt },
    ];

    try {
      const response = await chatCompletion(chatMessages, {
        maxTokens: guide.maxTokens,
        temperature: guide.temperature,
      });
      const aiMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: cleanupAiOutput(response), actionId: intent, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      toast.error('Không thể kết nối AI hoặc model đang trả lỗi. Vui lòng thử lại.');
      const errorMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: 'Mình chưa kết nối được AI lúc này. Bạn thử gửi lại sau vài giây nhé.', timestamp: new Date() };
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

  const handleSave = async (msg: Message) => {
    const cType = msg.actionId || 'generic';
    try {
      await addContent({
        title: `${cType} — ${new Date().toLocaleDateString('vi-VN')}`,
        contentType: cType,
        projectId: selectedProject?.id ?? '',
        projectName: selectedProject?.name ?? '',
        activityId: selectedActivity?.id ?? '',
        activityName: selectedActivity?.name ?? '',
        prompt: messages.filter(m => m.role === 'user').slice(-1)[0]?.content ?? '',
        content: msg.content,
        createdAt: new Date().toISOString(),
        status: 'Draft',
      });
      setSavedId(msg.id);
      toast.success('Đã lưu vào thư viện');
      setTimeout(() => setSavedId(null), 2500);
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    }
  };

  const handleReset = () => { setMessages([]); setInputValue(''); };
  const handleQuickProjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickProject(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateQuickProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = quickProject.name.trim();
    if (!name || isCreatingProject) return;

    setIsCreatingProject(true);
    try {
      const project: Omit<Project, 'id'> = {
        name,
        description: 'Tạo nhanh từ AI Assistant',
        assignee: quickProject.assignee.trim(),
        startDate: new Date().toISOString().split('T')[0],
        deadline: quickProject.deadline,
        status: 'Chưa bắt đầu',
        notes: 'Dự án được tạo nhanh trong AI Assistant',
      };
      const projectId = await addProject(project);
      setUseProject(true);
      setSelectedProjectId(projectId);
      setSelectedActivityId('');
      setShowQuickProject(false);
      setQuickProject({ name: '', assignee: '', deadline: '' });
      toast.success('Đã tạo và chọn dự án mới');
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <div className="ai-shell page-shell">
      <aside className="ai-sidebar professional-card">
        <div>
          <p className="eyebrow">EX AI Studio</p>
          <h1 className="ai-title">AI Assistant</h1>
          <p className="ai-subtitle">Tạo nội dung nội bộ gọn, rõ, copy dùng ngay.</p>
        </div>

        <div className="ai-section-label">Hành động nhanh</div>
        <div className="ai-action-list">
          {QUICK_ACTIONS.map(action => (
            <button key={action.id} onClick={() => handleQuickAction(action)} className={`ai-action ${selectedTool === action.id ? 'ai-action-active' : ''}`}>
              <span>{action.title}</span>
              <small>{action.description}</small>
            </button>
          ))}
        </div>

        {messages.length > 0 && (
          <button onClick={handleReset} className="ai-reset-button">Cuộc trò chuyện mới</button>
        )}
      </aside>

      <section className="ai-chat-panel professional-card">
        <div className="ai-chat-header">
          <div>
            <p className="ai-chat-kicker">Copy-ready output</p>
            <h2>IC Content Assistant</h2>
          </div>
          <div className="ai-chat-note">Không bảng dài, không emoji mặc định</div>
        </div>

        <div className="ai-messages hide-scrollbar">
          {messages.length === 0 && (
            <div className="ai-empty-state">
              <div className="ai-empty-mark">AI</div>
              <h3>Bạn muốn viết nội dung gì?</h3>
              <p>Chọn hành động nhanh hoặc nhập yêu cầu. AI sẽ trả lời ngắn, đúng format và dễ copy hơn.</p>
              <div className="ai-suggestion-grid">
                {['Viết GTalk nhắc nhân viên hoàn thành khảo sát EES', 'Soạn email thông báo Town Hall tháng 7', 'Tạo poster launch chiến dịch nội bộ'].map((ex) => (
                  <button key={ex} onClick={() => handleSend(ex)}>{ex}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`ai-message-row ${msg.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'}`}>
              {msg.role === 'assistant' && <div className="ai-avatar">AI</div>}
              <div className="ai-message-stack">
                <div className="ai-message-bubble">
                  <div className="ai-message-content">{msg.content}</div>
                </div>
                {msg.role === 'assistant' && (
                  <div className="ai-message-actions">
                    <button onClick={() => handleCopy(msg)}>{copiedId === msg.id ? 'Đã sao chép' : 'Sao chép'}</button>
                    <button onClick={() => handleSave(msg)}>{savedId === msg.id ? 'Đã lưu' : 'Lưu vào thư viện'}</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="ai-message-row ai-message-assistant">
              <div className="ai-avatar">AI</div>
              <div className="ai-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-context-zone">
          <div className="ai-context-bar">
            <span>Ngữ cảnh</span>
            <button onClick={() => { setUseProject(false); setSelectedProjectId(''); setSelectedActivityId(''); }} className={!useProject ? 'active' : ''}>Không dùng</button>
            <button onClick={() => setUseProject(true)} className={useProject ? 'active' : ''}>Chọn dự án</button>
            <button onClick={() => { setUseProject(true); setShowQuickProject(prev => !prev); }} className={showQuickProject ? 'active' : ''}>Tạo dự án nhanh</button>
            {useProject && (
              <>
                <select value={selectedProjectId} onChange={e => { setSelectedProjectId(e.target.value); setSelectedActivityId(''); }}>
                  <option value="">Chọn dự án</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {selectedProjectId && (
                  <select value={selectedActivityId} onChange={e => setSelectedActivityId(e.target.value)}>
                    <option value="">Hoạt động</option>
                    {filteredActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
              </>
            )}
          </div>

          {showQuickProject && (
            <form className="ai-quick-project" onSubmit={handleCreateQuickProject}>
              <div className="ai-quick-project-head">
                <strong>Tạo dự án mới làm ngữ cảnh</strong>
                <span>Dự án sẽ được lưu vào Google Sheets và chọn ngay cho cuộc trò chuyện này.</span>
              </div>
              <div className="ai-quick-project-grid">
                <input name="name" value={quickProject.name} onChange={handleQuickProjectChange} placeholder="Tên dự án mới" required />
                <input name="assignee" value={quickProject.assignee} onChange={handleQuickProjectChange} placeholder="Người phụ trách" />
                <input name="deadline" type="date" value={quickProject.deadline} onChange={handleQuickProjectChange} />
              </div>
              <div className="ai-quick-project-actions">
                <button type="button" onClick={() => setShowQuickProject(false)}>Hủy</button>
                <button type="submit" disabled={!quickProject.name.trim() || isCreatingProject}>{isCreatingProject ? 'Đang tạo...' : 'Tạo và chọn dự án'}</button>
              </div>
            </form>
          )}
        </div>

        <div className="ai-composer">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ví dụ: Viết GTalk nhắc nhân viên hoàn thành khảo sát EES trước thứ Sáu..."
            rows={1}
          />
          <div className="ai-composer-footer">
            <span>Enter để gửi / Shift+Enter để xuống dòng</span>
            <button onClick={() => handleSend()} disabled={!inputValue.trim() || isGenerating}>Gửi</button>
          </div>
        </div>
      </section>
    </div>
  );
}


