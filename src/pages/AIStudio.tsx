import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { chatCompletion } from '../lib/cerebras';
import { type Project, type StyleReference } from '../data/mockData';
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

const AI_MESSAGES_STORAGE_KEY = 'ic-ai-studio-messages-v1';
const MEMORY_WINDOW_SIZE = 12;
const MAX_PERSISTED_MESSAGES = 40;

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'gtalk', title: 'Viết GTalk', description: 'Bài truyền thông chỉn chu, văn phòng', prompt: 'Viết bài GTalk truyền thông nội bộ theo văn phong chuyên nghiệp cho ' },
  { id: 'email', title: 'Soạn Email', description: 'Email văn phòng, mạch lạc, có chiều sâu', prompt: 'Soạn email truyền thông nội bộ theo văn phong chuyên nghiệp về ' },
  { id: 'visualBrief', title: 'Visual Brief', description: 'Brief thiết kế theo kiểu Open Design-lite', prompt: 'Tạo Visual Brief/Design Prompt Studio cho visual truyền thông nội bộ về ' },
  { id: 'poster', title: 'Tạo Poster', description: 'Concept và thông điệp có insight', prompt: 'Tạo concept và nội dung poster truyền thông nội bộ theo hướng Senior Content cho ' },
  { id: 'plan', title: 'Kế hoạch truyền thông', description: 'Plan bài bản theo mục tiêu và timeline', prompt: 'Lập kế hoạch truyền thông nội bộ chuyên nghiệp cho ' },
  { id: 'survey', title: 'Khảo sát nhân viên', description: 'Lời dẫn và câu hỏi rõ insight', prompt: 'Xây dựng nội dung khảo sát nhân viên theo văn phong chuyên nghiệp về ' },
  { id: 'townhall', title: 'Town Hall', description: 'Key message và flow chương trình chỉn chu', prompt: 'Lên agenda và nội dung chương trình Town Hall theo hướng Senior Internal Communications về ' },
];

const SYSTEM_PROMPT = `Bạn là Senior Internal Communications Strategist kiêm Senior Content Marketing Writer cho team EX tại một công ty Việt Nam.
Bạn viết như một người làm truyền thông nội bộ nhiều kinh nghiệm: hiểu mục tiêu truyền thông, biết dẫn dắt bối cảnh, tạo cảm xúc vừa đủ, diễn đạt văn phòng chỉn chu và chuyển ý mượt.

Mục tiêu: tạo nội dung truyền thông nội bộ có thể copy dùng ngay, có chất lượng tốt hơn bản nháp thông thường.

Phong cách mặc định:
- Trả lời bằng tiếng Việt.
- Văn phong chuyên nghiệp, văn phòng, lịch sự, tự nhiên; ưu tiên xưng hô Anh/Chị hoặc Anh/Chị/Em tùy ngữ cảnh.
- Viết có mở bài, bối cảnh, ý chính, CTA và câu kết. Không viết cụt lủn nếu người dùng không yêu cầu ngắn.
- Độ dài mặc định ở mức vừa-dài: đủ ý, có nhịp văn và cảm xúc, nhưng không lan man.
- Câu văn nên có chiều sâu hơn: giải thích vì sao thông tin quan trọng, nhân viên cần làm gì, việc đó đóng góp gì cho tập thể.
- Không dùng emoji mặc định, trừ khi người dùng yêu cầu rõ hoặc Team Voice cho thấy chiến dịch đó thường dùng emoji.
- Không dùng bảng markdown, không code block, không gạch ngang phân cách, không phần "Kết luận", không phần "Hướng dẫn sử dụng" nếu người dùng không hỏi.
- Không tự bịa email, SharePoint, deadline, tên phòng ban, link hoặc thông tin cụ thể nếu người dùng chưa cung cấp. Dùng placeholder ngắn như [link], [deadline], [người gửi] khi cần.
- Không copy nguyên văn Team Voice references; chỉ học giọng văn, nhịp viết, cấu trúc và cách CTA.

Quy tắc theo loại nội dung:
- Nếu tạo GTalk/Slack/Teams: ưu tiên 1 bản chính hoàn chỉnh, văn phòng và có thể gửi ngay. Nếu phù hợp, thêm 1 phiên bản thay thế ngắn hơn. Không đưa 3 phiên bản rời rạc mặc định.
- Nếu tạo email: gồm Subject và Body. Body có lời chào, bối cảnh, nội dung chính, hành động cần làm, deadline nếu có, câu cảm ơn/kết phù hợp.
- Nếu tạo Visual Brief: đóng vai Senior IC Strategist kiêm Creative Director. Trả về brief thiết kế dùng được cho designer/Canva/Figma/image model, gồm mục tiêu visual, audience, key message, layout, hierarchy chữ, copy trên visual, màu sắc, mood, prompt tạo ảnh, negative prompt và checklist review.
- Nếu tạo poster: gồm Concept, Headline, Subline, Body copy, CTA; copy phải sắc nhưng vẫn đúng văn hóa nội bộ.
- Nếu tạo kế hoạch: có mục tiêu, insight/ngữ cảnh, thông điệp chính, kênh, timeline và checklist triển khai.
- Nếu người dùng chỉ chào hỏi hoặc nhập quá ngắn như "hi", "hello", "chào": không tạo nhiều phiên bản; chỉ chào lại một câu và hỏi họ muốn viết nội dung gì.
- Nếu yêu cầu chưa phải một task truyền thông rõ ràng, hỏi lại tối đa 2 thông tin cần thiết thay vì tự tạo nội dung lan man.
- Nếu thiếu vài thông tin phụ nhưng vẫn hiểu task chính, tạo bản nháp dùng placeholder ngắn như [deadline], [link], [người gửi].

Định dạng ưu tiên: nội dung copy-ready, có tiêu đề rõ khi cần, trình bày bằng đoạn văn và bullet ngắn vừa đủ. Không trang trí quá mức.`;

const INTENT_GUIDES: Record<string, { instruction: string; maxTokens: number; temperature: number }> = {
  visualBrief: {
    maxTokens: 1700,
    temperature: 0.58,
    instruction: `
Yêu cầu định dạng cho Visual Brief / Design Prompt Studio:
- Trả về một brief thiết kế hoàn chỉnh theo kiểu Open Design-lite, dùng được cho designer hoặc copy sang Canva/Figma/image generation tool.
- Không tạo ảnh thật. Không nói rằng đã tạo ảnh. Chỉ tạo visual direction và prompt.
- Cấu trúc bắt buộc:
  1. Creative objective: mục tiêu visual và cảm xúc cần tạo.
  2. Audience & context: người xem, bối cảnh tiếp nhận, điều họ cần hiểu/làm.
  3. Key message hierarchy: headline, subheadline, supporting copy, CTA, thông tin bắt buộc.
  4. Layout direction: bố cục poster/banner rõ ràng theo từng vùng: top/middle/bottom hoặc left/right.
  5. Art direction: màu sắc, typography, mood, background, hình ảnh/chất liệu nên dùng; lưu ý không dùng icon mặc định nếu user yêu cầu professional/no icon.
  6. Copy trên visual: bản chữ có thể đặt trực tiếp lên thiết kế.
  7. Prompt cho image/design tool: viết bằng tiếng Anh, giàu mô tả, chuyên nghiệp, không nhắc thông tin riêng chưa được cung cấp.
  8. Negative prompt: những thứ cần tránh như cluttered layout, childish icon, random logo, distorted text, excessive emoji.
  9. Review checklist: 5-7 tiêu chí để team EX duyệt trước khi publish.
- Ưu tiên visual cho truyền thông nội bộ: GTalk banner, email header, poster văn phòng, slide announcement.
- Nếu thiếu thông tin, dùng placeholder [deadline], [link], [logo], [brand color], [người gửi] và ghi rõ cần bổ sung.
- Không dùng bảng markdown, không code block, không emoji mặc định.`,
  },
  gtalk: {
    maxTokens: 1200,
    temperature: 0.58,
    instruction: `
Yêu cầu định dạng cho GTalk:
- Trả về 1 bản chính hoàn chỉnh, văn phòng, chỉn chu, có thể gửi ngay.
- Độ dài mặc định 5-9 đoạn ngắn hoặc bullet nhẹ nếu cần nhấn mốc thời gian/hành động.
- Cấu trúc nên có: mở đầu thu hút nhưng không phô, bối cảnh, nội dung chính, CTA rõ, câu kết có tinh thần đồng hành.
- Nếu cần thêm lựa chọn, chỉ thêm "Phiên bản ngắn hơn" sau bản chính.
- Không giải thích ưu điểm, không viết hướng dẫn ngoài nội dung gửi.
- Nếu thiếu thông tin, dùng placeholder [deadline], [link], [đối tượng], [người gửi].`,
  },
  email: {
    maxTokens: 1300,
    temperature: 0.55,
    instruction: `
Yêu cầu định dạng cho Email:
- Trả về 1 email chính. Nếu người dùng yêu cầu nhiều option thì tối đa 2 phiên bản.
- Gồm Subject và Body.
- Body viết theo văn phong văn phòng: lời chào, bối cảnh, nội dung chính, ý nghĩa/tác động, hành động cần làm, deadline nếu có, hỗ trợ/liên hệ, lời cảm ơn/kết.
- Độ dài mặc định 250-500 từ nếu brief đủ thông tin.
- Không bảng, không emoji, không giải thích ngoài nội dung email.`,
  },
  poster: {
    maxTokens: 1100,
    temperature: 0.62,
    instruction: `
Yêu cầu định dạng cho Poster:
- Trả về tối đa 2 concept.
- Mỗi concept gồm: Big idea, Headline, Subline, Body copy, CTA, Gợi ý visual direction.
- Copy cần có insight, không chỉ liệt kê thông tin.
- Văn phong sắc gọn hơn GTalk/email nhưng vẫn chuyên nghiệp và phù hợp nội bộ.
- Không bảng, không giải thích dài ngoài phần concept.`,
  },
  plan: {
    maxTokens: 1600,
    temperature: 0.5,
    instruction: `
Yêu cầu định dạng cho kế hoạch:
- Viết như Senior IC/Marketing planning note, không chỉ checklist khô.
- Gồm: Mục tiêu, Đối tượng, Insight/ngữ cảnh, Key message, Tone, Kênh triển khai, Timeline 4-6 giai đoạn, Checklist cần chuẩn bị, Rủi ro cần lưu ý.
- Mỗi giai đoạn có mục tiêu, nội dung chính, kênh, owner/deadline placeholder nếu thiếu.
- Không bảng markdown; dùng heading ngắn và bullet rõ ràng.`,
  },
  survey: {
    maxTokens: 1300,
    temperature: 0.52,
    instruction: `
Yêu cầu định dạng cho khảo sát:
- Gồm lời dẫn chuyên nghiệp, giải thích mục đích khảo sát và tối đa 10 câu hỏi.
- Câu hỏi rõ, trung lập, dễ hiểu, phù hợp nhân viên.
- Nếu phù hợp, thêm lời cảm ơn/kết để tăng động lực tham gia.
- Không bảng, không emoji mặc định.`,
  },
  townhall: {
    maxTokens: 1400,
    temperature: 0.56,
    instruction: `
Yêu cầu định dạng cho Town Hall:
- Gồm theme, communication objective, key message, agenda tối đa 6 mục, lời dẫn MC mở đầu và lời chuyển ý ngắn.
- Văn phong trang trọng vừa phải, tạo cảm giác kết nối nội bộ.
- Không bảng, không emoji mặc định, không giải thích dài ngoài nội dung cần dùng.`,
  },
  generic: {
    maxTokens: 1200,
    temperature: 0.55,
    instruction: `
Yêu cầu định dạng chung:
- Nếu input chỉ là lời chào hoặc chưa có yêu cầu truyền thông rõ ràng, trả lời đúng 1 đoạn ngắn để hỏi người dùng muốn viết gì.
- Không tự tạo nhiều câu chào, không đưa nhiều lựa chọn nếu người dùng không yêu cầu.
- Nếu là yêu cầu truyền thông rõ ràng, viết theo văn phong Senior Content/Marketing: có bối cảnh, thông điệp chính, CTA, câu kết.
- Độ dài mặc định vừa-dài, đủ ý và copy-ready.
- Không bảng, không emoji mặc định, không code block, không phần hướng dẫn/kết luận không cần thiết.`,
  },
};

function detectIntent(text: string, selectedTool: string | null): keyof typeof INTENT_GUIDES {
  if (selectedTool && selectedTool in INTENT_GUIDES) return selectedTool as keyof typeof INTENT_GUIDES;
  const lower = text.toLowerCase();
  if (lower.includes('gtalk') || lower.includes('slack') || lower.includes('teams') || lower.includes('tin nhắn')) return 'gtalk';
  if (lower.includes('email') || lower.includes('mail')) return 'email';
  if (lower.includes('visual brief') || lower.includes('design prompt') || lower.includes('key visual') || lower.includes('creative direction') || lower.includes('art direction') || lower.includes('thiết kế') || lower.includes('hình ảnh')) return 'visualBrief';
  if (lower.includes('poster') || lower.includes('banner')) return 'poster';
  if (lower.includes('kế hoạch') || lower.includes('plan') || lower.includes('timeline')) return 'plan';
  if (lower.includes('khảo sát') || lower.includes('survey')) return 'survey';
  if (lower.includes('town hall') || lower.includes('townhall')) return 'townhall';
  return 'generic';
}

function isLowSignalPrompt(text: string) {
  const normalized = text.trim().toLowerCase().replace(/[!?.。！？]+$/g, '');
  const greetings = new Set(['hi', 'hello', 'hey', 'chào', 'xin chào', 'alo', 'hola']);
  if (greetings.has(normalized)) return true;
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const hasCommunicationIntent = /(viết|soạn|tạo|lập|sửa|rewrite|email|gtalk|slack|teams|poster|banner|visual|brief|design|thiết kế|hình ảnh|key visual|kế hoạch|plan|khảo sát|survey|town hall|thông báo|nhắc|reminder)/i.test(text);
  return wordCount <= 2 && !hasCommunicationIntent;
}

const LOW_SIGNAL_REPLY = 'Chào bạn. Bạn muốn mình hỗ trợ viết nội dung gì cho truyền thông nội bộ? Ví dụ: GTalk reminder, email thông báo, poster copy, Visual Brief hoặc kế hoạch truyền thông.';
function scoreStyleReference(reference: StyleReference, text: string, intent: string) {
  const haystack = `${reference.title} ${reference.channel} ${reference.purpose} ${reference.tone}`.toLowerCase();
  const lowerText = text.toLowerCase();
  let score = 0;
  if (reference.channel.toLowerCase().includes(intent)) score += 4;
  if (intent === 'gtalk' && haystack.includes('gtalk')) score += 5;
  if (intent === 'email' && haystack.includes('email')) score += 5;
  if ((lowerText.includes('nhắc') || lowerText.includes('reminder')) && (haystack.includes('reminder') || haystack.includes('nhắc'))) score += 4;
  if ((lowerText.includes('cảm ơn') || lowerText.includes('tri ân') || lowerText.includes('recap')) && (haystack.includes('thank') || haystack.includes('recap') || haystack.includes('trân trọng'))) score += 4;
  if ((lowerText.includes('hướng dẫn') || lowerText.includes('guide')) && (haystack.includes('guide') || haystack.includes('hướng dẫn'))) score += 4;
  for (const token of lowerText.split(/\s+/).filter(token => token.length > 3)) {
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

function buildStyleContext(styleReferences: StyleReference[], text: string, intent: string) {
  const activeReferences = styleReferences.filter(reference => reference.isActive && reference.content.trim());
  if (activeReferences.length === 0) return '';

  const selectedReferences = [...activeReferences]
    .sort((a, b) => scoreStyleReference(b, text, intent) - scoreStyleReference(a, text, intent))
    .slice(0, 3);

  const examples = selectedReferences.map((reference, index) => {
    const content = reference.content.length > 1200 ? `${reference.content.slice(0, 1200).trim()}...` : reference.content.trim();
    return `Bài mẫu ${index + 1}: ${reference.title}\nKênh: ${reference.channel}\nMục đích: ${reference.purpose}\nTone: ${reference.tone}\nNội dung mẫu:\n${content}`;
  }).join('\n\n---\n\n');

  return `\n\nTeam Voice references:\n${examples}\n\nCách dùng bài mẫu:\n- Học giọng văn, cách mở đầu, cách CTA, cách xưng hô Anh/Chị/Anh/Chị/Em và độ dài tương tự.\n- Không sao chép nguyên văn câu chữ từ bài mẫu.\n- Không dùng lại thông tin riêng của bài mẫu nếu người dùng không cung cấp trong yêu cầu hiện tại.\n- Nếu bài mẫu có emoji nhưng yêu cầu hiện tại không yêu cầu emoji, vẫn không dùng emoji.`;
}
function readSavedMessages(): Message[] {
  try {
    const raw = localStorage.getItem(AI_MESSAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Omit<Message, 'timestamp'> & { timestamp?: string }>;
    return parsed
      .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
      .slice(-MAX_PERSISTED_MESSAGES)
      .map(item => ({ ...item, timestamp: item.timestamp ? new Date(item.timestamp) : new Date() }));
  } catch {
    return [];
  }
}

function compactText(text: string, maxLength = 720) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}...` : normalized;
}

function buildConversationMemory(history: Message[]) {
  if (history.length === 0) return '';
  const earlierUserNotes = history
    .slice(0, -MEMORY_WINDOW_SIZE)
    .filter(message => message.role === 'user')
    .slice(-8)
    .map((message, index) => `${index + 1}. ${compactText(message.content, 360)}`);

  const recentTurns = history
    .slice(-MEMORY_WINDOW_SIZE)
    .map(message => `${message.role === 'user' ? 'User' : 'Assistant'}: ${compactText(message.content, 520)}`);

  return `Conversation memory:
- Luôn duy trì các yêu cầu, ràng buộc và thông tin người dùng đã nêu trong cuộc trò chuyện hiện tại.
- Nếu yêu cầu mới dùng các từ như "tiếp", "như trên", "cái đó", "brief này", "bản trước", hãy suy luận dựa trên memory bên dưới.
- Không nhắc lại memory trong câu trả lời nếu không cần.
${earlierUserNotes.length > 0 ? `
Các yêu cầu/ngữ cảnh cũ cần nhớ:
${earlierUserNotes.join('\n')}` : ''}

Các lượt gần đây:
${recentTurns.join('\n')}`;
}
function cleanupAiOutput(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, block => block.replace(/```/g, '').trim())
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function AIStudio() {
  const { projects, activities, styleReferences, addProject, addContent } = useData();

  const [messages, setMessages] = useState<Message[]>(() => readSavedMessages());
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
    try {
      const trimmed = messages.slice(-MAX_PERSISTED_MESSAGES);
      localStorage.setItem(AI_MESSAGES_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore storage quota/privacy mode issues; AI still works with in-memory context.
    }
  }, [messages]);

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

    if (!selectedTool && isLowSignalPrompt(text)) {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: LOW_SIGNAL_REPLY,
        actionId: 'generic',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    setIsGenerating(true);

    const ctx = buildContext();
    const styleCtx = buildStyleContext(styleReferences, text, intent);
    const conversationMemory = buildConversationMemory([...messages, userMsg]);
    const fullPrompt = `${text}${ctx}${styleCtx}\n\n${guide.instruction}`;

    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...(conversationMemory ? [{ role: 'system' as const, content: conversationMemory }] : []),
      ...messages.slice(-MEMORY_WINDOW_SIZE).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
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

  const handleReset = () => {
    setMessages([]);
    setInputValue('');
    localStorage.removeItem(AI_MESSAGES_STORAGE_KEY);
  };
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
          <p className="ai-subtitle">Viết nội dung nội bộ và tạo Visual Brief/Design Prompt theo văn phong Senior Content/Marketing, chỉn chu, có chiều sâu và tham chiếu Team Voice.</p>
        </div>

        <button type="button" className="ai-visual-brief-card" onClick={() => handleQuickAction(QUICK_ACTIONS.find(action => action.id === 'visualBrief')!)}>
          <span>Visual Brief Studio</span>
          <strong>Open Design-lite cho banner, poster, key visual.</strong>
          <small>Tạo layout, copy trên visual, art direction, prompt Canva/Figma/image tool.</small>
        </button>

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
          <div className="ai-chat-note">Memory on · Visual Brief ready · Đọc {styleReferences.filter(ref => ref.isActive).length} bài mẫu</div>
        </div>

        <div className="ai-messages hide-scrollbar">
          {messages.length === 0 && (
            <div className="ai-empty-state">
              <div className="ai-empty-mark">AI</div>
              <h3>Bạn muốn viết nội dung gì?</h3>
              <p>Chọn hành động nhanh hoặc nhập yêu cầu. AI có thể viết copy-ready content hoặc tạo visual brief/prompt thiết kế để chuyển sang Canva, Figma hoặc image tool.</p>
              <div className="ai-suggestion-grid">
                {['Viết GTalk nhắc nhân viên hoàn thành khảo sát EES', 'Soạn email thông báo Town Hall tháng 7', 'Tạo Visual Brief cho banner GTalk launch chiến dịch nội bộ'].map((ex) => (
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
            placeholder="Ví dụ: Tạo Visual Brief cho banner GTalk nhắc nhân viên hoàn thành khảo sát EES trước thứ Sáu..."
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


