import { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, ImageIcon, MessageSquare, Mail, ClipboardList,
  BarChart2, Mic, ChevronDown, RotateCcw, Copy,
  CheckCircle2, Save, Sparkles, User, ChevronRight,
  FolderOpen, Pin, Calendar, Hash, Wand2, Download, Image,
} from 'lucide-react';
import { useData } from '../context/DataContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  prompt?: string;
  actionId?: string;
  isPoster?: boolean;          // Phase 2: marks poster content messages
  posterPrompt?: string;       // extracted image-gen prompt for Phase 3
  timestamp: Date;
}

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
  color: string;
  glow: string;
}

// ─── Phase 4: Poster Image Service (architecture placeholder) ──────────────────
// Replace the body of this function to integrate a real image generation API:
//   - OpenAI Images API  → openai.images.generate({ prompt, model: 'dall-e-3', ... })
//   - Gemini Imagen      → generativeAI.getGenerativeModel('imagen-3').generateImage(...)
//   - Stability AI       → stabilityAI.textToImage({ text_prompts: [{ text: prompt }], ... })
async function generatePosterImage(prompt: string): Promise<MockImageResult> {
  // TODO: replace with real API call
  await new Promise(r => setTimeout(r, 2200 + Math.random() * 800)); // simulate latency
  return {
    url:       null,          // will be a real image URL when connected
    prompt,
    createdAt: new Date().toISOString(),
    mock:      true,
  };
}

interface MockImageResult {
  url:       string | null;
  prompt:    string;
  createdAt: string;
  mock:      boolean;
}

// ─── Library Metadata Structure (ready for Phase 4 library integration) ────────
interface ContentMetadata {
  projectId?:       string;
  activityId?:      string;
  contentType:      'poster' | 'gtalk' | 'email' | 'plan' | 'survey' | 'townhall' | 'generic';
  prompt:           string;
  generatedContent: string;
  createdAt:        string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildContentMetadata(
  type: ContentMetadata['contentType'],
  prompt: string,
  content: string,
  projectId?: string,
  activityId?: string,
): ContentMetadata {
  return { projectId, activityId, contentType: type, prompt, generatedContent: content, createdAt: new Date().toISOString() };
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'poster',
    icon: <ImageIcon size={18} />,
    title: 'Tạo Poster',
    description: 'Tạo concept và nội dung poster truyền thông',
    prompt: 'Tạo concept và nội dung poster truyền thông nội bộ cho ',
    color: 'rgba(99,102,241,0.12)',
    glow: '#6366f1',
  },
  {
    id: 'gtalk',
    icon: <MessageSquare size={18} />,
    title: 'Viết GTalk',
    description: 'Soạn tin nhắn GTalk ngắn gọn, thu hút',
    prompt: 'Viết nội dung GTalk nội bộ cho ',
    color: 'rgba(14,165,233,0.12)',
    glow: '#0ea5e9',
  },
  {
    id: 'email',
    icon: <Mail size={18} />,
    title: 'Soạn Email',
    description: 'Soạn email thông báo chuyên nghiệp',
    prompt: 'Soạn email thông báo nội bộ về ',
    color: 'rgba(139,92,246,0.12)',
    glow: '#8b5cf6',
  },
  {
    id: 'plan',
    icon: <ClipboardList size={18} />,
    title: 'Kế hoạch truyền thông',
    description: 'Lập kế hoạch truyền thông chi tiết',
    prompt: 'Lập kế hoạch truyền thông chi tiết cho ',
    color: 'rgba(245,158,11,0.12)',
    glow: '#f59e0b',
  },
  {
    id: 'survey',
    icon: <BarChart2 size={18} />,
    title: 'Khảo sát nhân viên',
    description: 'Xây dựng câu hỏi và kịch bản khảo sát',
    prompt: 'Xây dựng bộ câu hỏi khảo sát nhân viên về ',
    color: 'rgba(16,185,129,0.12)',
    glow: '#10b981',
  },
  {
    id: 'townhall',
    icon: <Mic size={18} />,
    title: 'Town Hall',
    description: 'Lên agenda và nội dung Town Hall',
    prompt: 'Lên agenda và nội dung chương trình Town Hall về ',
    color: 'rgba(236,72,153,0.12)',
    glow: '#ec4899',
  },
];

// ─── Mock Response Generator ───────────────────────────────────────────────────

/** Detects whether a prompt / content is poster-related */
export function isPosterContent(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes('poster') || t.includes('concept') || t.includes('ấn phẩm');
}

/** Extracts the image-generation prompt from structured poster content */
export function extractImagePrompt(content: string): string {
  // Look for the PROMPT TẠO ẢNH section
  const match = content.match(/PROMPT TẠO ẢNH[\s\S]*?\n([^\n]+(?:\n(?!##|---)[^\n]+)*)/i);
  if (match?.[1]) return match[1].trim();
  // fallback: extract from **Prompt tạo ảnh** bold line
  const bold = content.match(/\*\*Prompt tạo ảnh[^*]*\*\*[:\s]*([^\n]+)/i);
  if (bold?.[1]) return bold[1].trim();
  return 'Internal communication poster, professional corporate design, Vietnamese workplace, blue and purple brand colors, clean layout, premium design.';
}

function isFollowUpMessage(message: string): boolean {
  const lower = message.toLowerCase();
  const followUpKeywords = [
    'chi tiết', 'cụ thể', 'mở rộng', 'triển khai', 'ví dụ', 
    'giải thích', 'làm rõ', 'detail', 'thêm'
  ];
  return followUpKeywords.some(kw => lower.includes(kw));
}

function generateFollowUpResponse({
  currentMessage,
  previousMessages,
  lastAssistantMessage,
  selectedProject,
  selectedActivity
}: {
  currentMessage: string;
  previousMessages: any[];
  lastAssistantMessage?: any;
  selectedProject?: any;
  selectedActivity?: any;
}) {
  const baseTitle = lastAssistantMessage 
    ? (lastAssistantMessage.content.match(/^##\s+(.*)/)?.[1] || 'Kế hoạch')
    : 'Nội dung chi tiết';
    
  return `## 📝 Chi tiết mở rộng: ${baseTitle}

Dựa trên yêu cầu của bạn, dưới đây là phiên bản chi tiết và cụ thể hơn:

**1. Timeline chi tiết (Tuần 1 - Tuần 4)**
- **Tuần 1:** Chuẩn bị nội dung, duyệt thiết kế, setup các kênh truyền thông.
- **Tuần 2:** Teasing, gửi email thông báo, đăng bài trên GTalk.
- **Tuần 3:** Khởi động chính thức, theo dõi tỷ lệ tham gia.
- **Tuần 4:** Báo cáo, đánh giá hiệu quả, vinh danh cá nhân/tập thể xuất sắc.

**2. Phân công trách nhiệm (Owner)**
- **Nội dung & Hình ảnh:** Nhóm thiết kế và copywriter.
- **Theo dõi KPIs:** Nhóm Data/Admin.
- **Điều phối chung:** ${selectedProject?.assignee || 'IC Team'}.

**3. Tiêu chí đánh giá (KPIs)**
- Tỷ lệ tiếp cận: > 80% nhân viên.
- Tỷ lệ tương tác: > 40% (like, comment, share nội bộ).
- Feedback tích cực: Đạt 4.5/5.0.

**4. Rủi ro & Phương án dự phòng (Risk Notes)**
- Trễ tiến độ thiết kế: Duyệt concept nhanh trong 2 ngày đầu.
- Tương tác thấp: Sử dụng Kols nội bộ (Team Leaders/Managers) để khuấy động phong trào.

Bạn có muốn tôi điều chỉnh hoặc thêm phần nào khác vào bản chi tiết này không?`;
}

function generateMockResponse(prompt: string, projectContext?: { project?: string; activity?: string; channel?: string; deadline?: string }): string {
  const lower = prompt.toLowerCase();
  const proj  = projectContext?.project  ? `"${projectContext.project}"` : 'dự án';
  const act   = projectContext?.activity ? `"${projectContext.activity}"` : 'hoạt động';
  const projName   = projectContext?.project  ?? 'Công ty';
  const actName    = projectContext?.activity ?? 'Chiến dịch truyền thông';
  const deadline   = projectContext?.deadline;
  const channel    = projectContext?.channel;

  // ── Phase 1: Structured Poster Response ──────────────────────────────────────
  if (isPosterContent(lower)) {
    const imagePrompt = `Modern corporate internal communication poster, ${
      projectContext?.project ? `${projectContext.project} employee engagement campaign, ` : ''
    }professional logistics company, diverse Vietnamese employees, blue and purple brand gradient colors, friendly team collaboration, clean minimal layout, bold Vietnamese typography, premium design, high resolution`;

    return `## 🎨 Poster Content — ${proj}

---

**📌 TIÊU ĐỀ**
${projName} – ${projectContext?.project?.toLowerCase().includes('ees') ? 'Tiếng nói của bạn tạo nên thay đổi' : 'Cùng nhau kiến tạo môi trường làm việc tốt hơn'}

---

**💬 THÔNG ĐIỆP CHÍNH**
Mỗi ý kiến đều góp phần xây dựng môi trường làm việc tốt hơn.${
  projectContext?.project ? `\nHãy tham gia ${proj} — tiếng nói của bạn được lắng nghe và trân trọng.` : ''
}

**📝 NỘI DUNG NGẮN**
${actName}${deadline ? ` diễn ra đến hết ngày **${deadline}**` : ''}. Sự tham gia của mỗi cá nhân là đóng góp thiết thực cho tổ chức.${
  channel ? `\nKênh triển khai: **${channel}**.` : ''
}

---

**🎯 CTA**
Tham gia ${projectContext?.project?.toLowerCase().includes('khảo sát') || projectContext?.project?.toLowerCase().includes('ees') ? 'khảo sát' : 'chương trình'} ngay hôm nay.

---

**🖼️ CONCEPT HÌNH ẢNH**
Nhân viên${projectContext?.project ? ` ${projName}` : ''} đa dạng phòng ban cùng tương tác${
  projectContext?.project?.toLowerCase().includes('ees') || projectContext?.project?.toLowerCase().includes('khảo sát')
    ? ' với bảng khảo sát số, nụ cười rạng rỡ, không gian văn phòng hiện đại.'
    : ' trong không gian làm việc năng động, hợp tác tích cực.'
}\nMàu sắc: Gradient xanh dương → tím (thương hiệu), điểm xuyết màu vàng năng lượng.\nTypography: Sans-serif bold cho tiêu đề, regular cho body.

---

**🤖 PROMPT TẠO ẢNH**
${imagePrompt}`;
  }

  if (lower.includes('gtalk') || lower.includes('tin nhắn')) {
    return `## 💬 Nội dung GTalk — ${act}

---

**[Bản 1 — Ngắn gọn, thân thiện]**

Chào cả nhà 👋

${projectContext?.project ? `${proj} chính thức khởi động rồi! 🚀` : 'Một thông báo quan trọng dành cho mọi người! 🚀'}

${projectContext?.activity ? `Hoạt động ${act} đang cần sự tham gia của tất cả anh chị em.` : 'Chúng tôi cần sự tham gia và phản hồi từ mọi người.'}

${projectContext?.deadline ? `⏰ **Hạn chót:** ${projectContext.deadline}` : '⏰ Thời gian có hạn, mọi người tranh thủ nhé!'}

👉 [Xem chi tiết tại đây]

Cảm ơn cả nhà! 💪

---

**[Bản 2 — Chuyên nghiệp hơn]**

📢 **Thông báo nội bộ**

Kính gửi toàn thể nhân sự,

Chúng ta đang triển khai ${projectContext?.project ? proj : 'chương trình quan trọng'}. Sự tham gia của mỗi người là đóng góp thiết thực cho tổ chức.

${projectContext?.deadline ? `📅 Deadline: **${projectContext.deadline}**` : '📅 Vui lòng hoàn thành trong thời gian sớm nhất.'}

Liên hệ team IC nếu cần hỗ trợ. Trân trọng! 🙏`;
  }

  if (lower.includes('email') || lower.includes('soạn email')) {
    return `## 📧 Email Thông Báo — ${proj}

---

**Subject:** [Thông báo] ${projectContext?.activity ?? 'Chương trình mới'} — ${projectContext?.project ?? 'Nội bộ'}

---

Kính gửi toàn thể nhân sự,

Ban Truyền thông Nội bộ xin trân trọng thông báo về việc triển khai **${projectContext?.activity ?? 'chương trình'}** thuộc **${projectContext?.project ?? 'kế hoạch nội bộ'}**.

**📋 Thông tin chính:**
- **Mục tiêu:** Tăng cường gắn kết và thu thập phản hồi từ nhân viên
- **Thời gian:** ${projectContext?.deadline ? `Đến ngày ${projectContext.deadline}` : 'Sẽ được thông báo cụ thể'}
- **Đối tượng:** Toàn thể CBNV công ty

**🎯 Kêu gọi hành động:**
Mỗi nhân viên vui lòng dành thời gian tham gia. Mọi ý kiến đóng góp đều có giá trị và sẽ được lắng nghe nghiêm túc.

**📞 Liên hệ hỗ trợ:**
Trường hợp cần hỗ trợ hoặc có thắc mắc, vui lòng liên hệ:
- Team IC: ic@company.com.vn
- Hotline nội bộ: 1234

Trân trọng cảm ơn và chúc toàn thể CBNV một tuần làm việc hiệu quả!

Trân trọng,
**Ban Truyền thông Nội bộ**
*${projectContext?.project ?? 'EX Team'}*`;
  }

  if (lower.includes('kế hoạch') || lower.includes('plan')) {
    return `## 📋 Kế Hoạch Truyền Thông — ${proj}

### 🎯 Mục tiêu chiến dịch
- Nâng cao nhận thức và tỷ lệ tham gia của nhân viên
- Truyền tải thông điệp nhất quán qua đa kênh
- Đo lường hiệu quả và điều chỉnh kịp thời

---

### 📅 Timeline & Hoạt động

| Giai đoạn | Thời gian | Hoạt động | Kênh |
|-----------|-----------|-----------|------|
| **Khởi động** | Tuần 1 | Poster, GTalk thông báo | Offline + GTalk |
| **Triển khai** | Tuần 2–3 | Email, reminder, FAQ | Email + GTalk |
| **Nhắc nhở** | Tuần 4 | Reminder đến nhóm chưa tham gia | GTalk + Direct |
| **Kết thúc** | Tuần 5 | Cảm ơn, chia sẻ kết quả | All channels |

---

### 📣 Kênh truyền thông
- **GTalk:** Tin nhắn nhóm, reminder cá nhân hoá
- **Email:** Thông báo chính thức, kết quả
- **Poster:** Treo tại văn phòng, màn hình digital
- **Town Hall:** Công bố kết quả và hành động tiếp theo

---

### 📊 KPIs đề xuất
- Tỷ lệ tham gia: ≥ 85%
- Thời gian hoàn thành: Trong 3 tuần
- NPS nội bộ sau chiến dịch: +10 điểm`;
  }

  if (lower.includes('khảo sát') || lower.includes('survey')) {
    return `## 📊 Bộ Câu Hỏi Khảo Sát — ${proj}

### 📌 Phần 1: Mức độ gắn kết tổng thể
1. Tôi cảm thấy gắn bó và tự hào khi làm việc tại công ty.
   *(1 — Hoàn toàn không đồng ý → 5 — Hoàn toàn đồng ý)*

2. Tôi sẵn sàng giới thiệu công ty là nơi làm việc tốt cho người thân/bạn bè.
   *(1 → 10 — Thang NPS)*

---

### 📌 Phần 2: Môi trường làm việc
3. Tôi nhận được sự hỗ trợ cần thiết để hoàn thành tốt công việc.
4. Ý kiến của tôi được lắng nghe và tôn trọng.
5. Tôi có cơ hội học hỏi và phát triển tại đây.

---

### 📌 Phần 3: Lãnh đạo & Giao tiếp
6. Lãnh đạo trực tiếp của tôi hỗ trợ tôi phát triển nghề nghiệp.
7. Tôi nhận được thông tin nội bộ kịp thời và rõ ràng.

---

### 📌 Phần 4: Câu hỏi mở
8. Điều bạn thích nhất khi làm việc tại công ty là gì?
9. Bạn mong muốn cải thiện điều gì trong thời gian tới?
10. Bạn có đề xuất nào để nâng cao trải nghiệm nhân viên không?

---

### 💡 Gợi ý thiết kế khảo sát
- Ẩn danh hoàn toàn để tăng tỷ lệ phản hồi trung thực
- Thời gian hoàn thành ≤ 8 phút
- Gửi reminder sau 48h cho nhóm chưa tham gia`;
  }

  if (lower.includes('town hall') || lower.includes('townhall')) {
    return `## 🎤 Agenda Town Hall — ${proj}

### 📅 Thông tin chương trình
- **Thời gian:** 60–90 phút
- **Hình thức:** Kết hợp Offline + Online
- **Đối tượng:** Toàn thể CBNV

---

### 📋 Agenda Chi Tiết

**0:00 – 0:05** | Khai mạc & Giới thiệu *(MC)*
- Chào mừng, giới thiệu chương trình

**0:05 – 0:20** | Kết quả kinh doanh & Tổng quan *(CEO / Director)*
- Highlight Q2, định hướng H2

**0:20 – 0:35** | Spotlight: ${proj} *(IC Team)*
- Chia sẻ kết quả, hành động tiếp theo
- Công nhận đóng góp của nhân viên

**0:35 – 0:50** | Q&A — Nhân viên hỏi, Lãnh đạo trả lời
- Câu hỏi từ Slido / trực tiếp

**0:50 – 1:00** | Recognition & Closing
- Vinh danh nhân viên xuất sắc
- Lời kết, chụp ảnh lưu niệm

---

### 🛠️ Chuẩn bị
- Slido / Mentimeter cho Q&A
- Slide trình bày (thiết kế theo brand)
- Video highlight nếu có
- MC script và run-of-show`;
  }

  // Generic fallback
  return `## ✨ Gợi ý nội dung

Tôi đã phân tích yêu cầu của bạn${projectContext?.project ? ` trong ngữ cảnh dự án ${proj}` : ''}.

**📝 Nội dung đề xuất:**
${prompt}

Đây là gợi ý ban đầu. Bạn có muốn tôi:
- 📄 **Chi tiết hóa** nội dung này?
- 🔄 **Tạo nhiều phiên bản** khác nhau?
- ✏️ **Điều chỉnh tone** (chuyên nghiệp hơn / thân thiện hơn)?
- 📣 **Chuyển đổi** sang định dạng khác (Email / Poster / GTalk)?

Hãy cho tôi biết bạn cần gì thêm!`;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AIStudio() {
  const { projects, activities, contents, addContent } = useData();

  const [messages, setMessages]           = useState<Message[]>([]);
  const [inputValue, setInputValue]       = useState('');
  const [isGenerating, setIsGenerating]   = useState(false);
  const [copiedId, setCopiedId]           = useState<string | null>(null);
  const [savedId, setSavedId]             = useState<string | null>(null);
  const [selectedTool, setSelectedTool]   = useState<string | null>(null);

  // Phase 2-3: poster image generation state
  const [imageGenMsgId, setImageGenMsgId]   = useState<string | null>(null); // which msg triggered gen
  const [isGenImage, setIsGenImage]         = useState(false);
  const [posterResult, setPosterResult]     = useState<MockImageResult | null>(null);

  // Project context
  const [useProject, setUseProject]           = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);

  const uniqueProjects     = Array.from(new Map(projects.map(p => [p.name.trim().toLowerCase(), p])).values());
  const filteredActivities = activities.filter(a => a.projectId === selectedProjectId);

  const selectedProject  = projects.find(p => p.id === selectedProjectId);
  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [inputValue]);

  const buildContext = () => {
    if (!useProject || !selectedProject) return undefined;
    return {
      project:  selectedProject.name,
      activity: selectedActivity?.name,
      channel:  selectedActivity?.channel,
      deadline: selectedActivity?.deadline,
    };
  };

  const handleSend = (overridePrompt?: string) => {
    const text = (overridePrompt ?? inputValue).trim();
    if (!text || isGenerating) return;

    // Reset any previous poster image result when starting a new conversation turn
    setPosterResult(null);
    setImageGenMsgId(null);

    const userMsg: Message = {
      id:        crypto.randomUUID(),
      role:      'user',
      content:   text,
      actionId:  selectedTool || undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsGenerating(true);

    const ctx = buildContext();

    setTimeout(() => {
      let responseContent = '';
      const isFollowUp = isFollowUpMessage(text);
      
      if (isFollowUp && messages.length > 0) {
        // find the last assistant message
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
        responseContent = generateFollowUpResponse({
          currentMessage: text,
          previousMessages: messages,
          lastAssistantMessage,
          selectedProject,
          selectedActivity
        });
      } else {
        responseContent = generateMockResponse(text, ctx);
      }

      const isP = isPosterContent(responseContent) || isPosterContent(text);
      const aiMsg: Message = {
        id:          crypto.randomUUID(),
        role:        'assistant',
        content:     responseContent,
        prompt:      text,
        actionId:    selectedTool || undefined,
        isPoster:    isP,
        posterPrompt: isP ? extractImagePrompt(responseContent) : undefined,
        timestamp:   new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setSelectedTool(null); // Reset after send
      setIsGenerating(false);
    }, 900 + Math.random() * 600);
  };

  // Phase 3: Mock image generation handler
  const handleGenerateImage = async (msg: Message) => {
    if (!msg.posterPrompt || isGenImage) return;
    setImageGenMsgId(msg.id);
    setIsGenImage(true);
    setPosterResult(null);
    // Scroll to bottom so the preview comes into view
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    try {
      const result = await generatePosterImage(msg.posterPrompt);
      setPosterResult(result);
    } finally {
      setIsGenImage(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setSelectedTool(action.id);
    const suffix = selectedProject ? `chiến dịch "${selectedProject.name}"` : '...';
    setInputValue(action.prompt + suffix);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (msg: Message) => {
    const isAlreadySaved = contents.some(c => c.content === msg.content);
    if (isAlreadySaved) {
      setSavedId(msg.id);
      setTimeout(() => setSavedId(null), 2500);
      return;
    }

    const inferContentType = (actionId?: string, prompt?: string, content?: string) => {
      console.log("Selected Tool:", actionId);
      
      // 1. Explicit tool mapping (Highest Priority)
      if (actionId === 'poster') return 'Poster';
      if (actionId === 'gtalk') return 'GTalk';
      if (actionId === 'email') return 'Email';
      if (actionId === 'plan') return 'Communication Plan';
      if (actionId === 'survey') return 'Survey';
      if (actionId === 'townhall') return 'Town Hall';

      const lowerPrompt = (prompt || '').toLowerCase();
      console.log("Content Type:", lowerPrompt);
      
      // 2. Prioritize mapping strictly from the prompt/intent
      if (lowerPrompt.includes('kế hoạch') || lowerPrompt.includes('plan')) return 'Communication Plan';
      if (lowerPrompt.includes('khảo sát') || lowerPrompt.includes('survey')) return 'Survey';
      if (lowerPrompt.includes('town hall') || lowerPrompt.includes('townhall')) return 'Town Hall';
      if (lowerPrompt.includes('email') || lowerPrompt.includes('mail')) return 'Email';
      if (lowerPrompt.includes('poster') || lowerPrompt.includes('ấn phẩm')) return 'Poster';
      if (lowerPrompt.includes('nhắc nhở') || lowerPrompt.includes('reminder')) return 'Reminder';
      if (lowerPrompt.includes('gtalk') || lowerPrompt.includes('bài đăng')) return 'GTalk';
      
      // 3. Fallback to scanning the generated content if prompt is vague
      const lowerContent = (content || '').toLowerCase();
      if (lowerContent.includes('kế hoạch truyền thông')) return 'Communication Plan';
      if (lowerContent.includes('khảo sát')) return 'Survey';
      if (lowerContent.includes('town hall')) return 'Town Hall';
      if (lowerContent.includes('email thông báo')) return 'Email';
      if (lowerContent.includes('poster') || lowerContent.includes('concept hình ảnh')) return 'Poster';
      
      return 'GTalk';
    };

    const cType = inferContentType(msg.actionId, msg.prompt, msg.content);
    const pName = selectedProject?.name ?? 'Không có dự án';
    const aName = selectedActivity?.name ?? 'Không có hoạt động';

    addContent({
      title: `${cType} — ${new Date().toLocaleDateString('vi-VN')}`,
      contentType: cType,
      projectId: selectedProject?.id ?? '',
      projectName: pName,
      activityId: selectedActivity?.id ?? '',
      activityName: aName,
      prompt: msg.prompt || '',
      content: msg.content,
      createdAt: new Date().toISOString()
    });

    setSavedId(msg.id);
    setTimeout(() => setSavedId(null), 2500);
  };

  const handleReset = () => {
    setMessages([]);
    setInputValue('');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flex: 1, minHeight: 0, gap: '1rem',
      maxWidth: '1400px', width: '100%', margin: '0 auto',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* ── LEFT SIDEBAR — Quick Actions ── */}
      <aside className="quick-actions-sidebar hide-scrollbar">

        {/* Header */}
        <div style={{ marginBottom: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#4f46e5,#9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={15} style={{ color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Assistant
            </h1>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.5, paddingLeft: '2px' }}>
            Trợ lý truyền thông nội bộ &amp; gắn kết nhân viên
          </p>
        </div>

        {/* Section label */}
        <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155', marginTop: '0.5rem', paddingLeft: '2px' }}>
          Hành động nhanh
        </div>

        {/* Quick Action Cards */}
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: '0.3rem', padding: '0.65rem 0.75rem', borderRadius: '12px',
                background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%',
                minHeight: '100%'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = action.color;
                e.currentTarget.style.borderColor = action.glow + '55';
                e.currentTarget.style.boxShadow = `0 0 16px ${action.glow}22`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(15,23,42,0.6)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', width: '100%' }}>
                <span style={{ color: action.glow, flexShrink: 0, marginTop: '2px' }}>{action.icon}</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>{action.title}</span>
                <ChevronRight size={12} style={{ color: '#334155', marginLeft: 'auto', flexShrink: 0, marginTop: '4px' }} />
              </div>
              <p style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.4, paddingLeft: '1.625rem', margin: 0 }}>
                {action.description}
              </p>
            </button>
          ))}
        </div>

        {/* Reset conversation */}
        {messages.length > 0 && (
          <>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.25rem 0' }} />
            <button
              onClick={handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
            >
              <RotateCcw size={13} /> Cuộc trò chuyện mới
            </button>
          </>
        )}
      </aside>

      {/* ── CENTER PANEL — Chat Workspace ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.25rem', display: 'flex', flexDirection: 'column' }} className="hide-scrollbar">

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', gap: '1rem' }}>
              {/* AI Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg,rgba(79,70,229,0.3),rgba(147,51,234,0.3))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(99,102,241,0.2)' }}>
                  <Bot size={24} style={{ color: '#818cf8' }} />
                </div>
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={8} style={{ color: '#fff' }} />
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.2rem' }}>
                  Xin chào 👋
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '340px', lineHeight: 1.5 }}>
                  Tôi là AI Assistant chuyên hỗ trợ<br />
                  <strong style={{ color: '#94a3b8' }}>truyền thông nội bộ</strong> và <strong style={{ color: '#94a3b8' }}>gắn kết nhân viên</strong>.
                </p>
              </div>

              {/* Capability list */}
              <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1rem 1.25rem', textAlign: 'left', maxWidth: '560px', width: '100%' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>
                  Tôi có thể hỗ trợ bạn
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
                  {[
                    { icon: '🎨', text: 'Tạo concept poster' },
                    { icon: '💬', text: 'Viết GTalk nội bộ' },
                    { icon: '📧', text: 'Soạn email thông báo' },
                    { icon: '📊', text: 'Khảo sát nhân viên' },
                    { icon: '📋', text: 'Kế hoạch truyền thông' },
                    { icon: '🎤', text: 'Ý tưởng Town Hall' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Example prompts */}
              <div style={{ maxWidth: '600px', width: '100%' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  Thử hỏi tôi
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  {[
                    'Tạo poster launch khảo sát EES 2026',
                    'Viết GTalk nhắc nhở nhân viên',
                    'Soạn email Town Hall tháng 7',
                    'Kế hoạch truyền thông ghi nhận NV',
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(example)}
                      style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '10px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = '#a5b4fc'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#64748b'; }}
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              copiedId={copiedId}
              savedId={savedId}
              onCopy={handleCopy}
              onSave={handleSave}
              onRetry={() => handleSend(msg.content)}
              onGenerateImage={handleGenerateImage}
              isGenImage={isGenImage && imageGenMsgId === msg.id}
            />
          ))}

          {/* Phase 3: Poster image generation progress + preview */}
          {(isGenImage || posterResult) && imageGenMsgId && (
            <PosterImageCard
              isLoading={isGenImage}
              result={posterResult}
            />
          )}

          {/* Typing indicator */}
          {isGenerating && (
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(79,70,229,0.25),rgba(147,51,234,0.25))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} style={{ color: '#818cf8' }} />
              </div>
              <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0 14px 14px 14px', padding: '0.875rem 1.1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── BOTTOM INPUT AREA ── */}
        <div style={{ flexShrink: 0, padding: '0.75rem 0 0' }}>

          {/* Project Context Section */}
          <div style={{ marginBottom: '0.6rem', background: 'rgba(13,18,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '0.7rem 1rem', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#334155', flexShrink: 0 }}>
                Ngữ cảnh dự án
              </span>

              {/* Toggle: Không sử dụng */}
              <button
                onClick={() => { setUseProject(false); setSelectedProjectId(''); setSelectedActivityId(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s', ...(!useProject ? { background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)', color: '#a5b4fc' } : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#475569' }) }}
              >
                <span style={{ fontSize: '0.7rem' }}>○</span> Không dùng
              </button>

              {/* Toggle: Chọn dự án */}
              <button
                onClick={() => setUseProject(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s', ...(useProject ? { background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)', color: '#a5b4fc' } : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#475569' }) }}
              >
                <FolderOpen size={12} /> Chọn dự án
              </button>

              {/* Project selector */}
              {useProject && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedProjectId}
                      onChange={e => { setSelectedProjectId(e.target.value); setSelectedActivityId(''); }}
                      style={{ appearance: 'none', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', padding: '0.3rem 1.8rem 0.3rem 0.75rem', color: '#c7d2fe', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                    >
                      <option value="" style={{ background: '#0f1629' }}>-- Chọn dự án --</option>
                      {uniqueProjects.map(p => <option key={p.id} value={p.id} style={{ background: '#0f1629' }}>{p.name}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#6366f1', pointerEvents: 'none' }} />
                  </div>

                  {selectedProjectId && (
                    <div style={{ position: 'relative' }}>
                      <select
                        value={selectedActivityId}
                        onChange={e => setSelectedActivityId(e.target.value)}
                        disabled={filteredActivities.length === 0}
                        style={{ appearance: 'none', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', padding: '0.3rem 1.8rem 0.3rem 0.75rem', color: '#c7d2fe', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', opacity: filteredActivities.length === 0 ? 0.4 : 1 }}
                      >
                        <option value="" style={{ background: '#0f1629' }}>-- Hoạt động (tùy chọn) --</option>
                        {filteredActivities.map(a => <option key={a.id} value={a.id} style={{ background: '#0f1629' }}>{a.name}</option>)}
                      </select>
                      <ChevronDown size={12} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#6366f1', pointerEvents: 'none' }} />
                    </div>
                  )}
                </div>
              )}

              {/* Context Chips */}
              {useProject && selectedProjectId && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.1rem', width: '100%' }}>
                  {selectedProject && <CtxChip icon={<FolderOpen size={10} />} label={selectedProject.name} color="#6366f1" />}
                  {selectedActivity && <CtxChip icon={<Pin size={10} />} label={selectedActivity.name} color="#10b981" />}
                  {selectedActivity?.channel && <CtxChip icon={<Hash size={10} />} label={selectedActivity.channel} color="#0ea5e9" />}
                  {selectedActivity?.deadline && <CtxChip icon={<Calendar size={10} />} label={`Hạn: ${selectedActivity.deadline}`} color="#f59e0b" />}
                </div>
              )}
            </div>
          </div>

          {/* Prompt Input Box */}
          <div style={{ background: 'rgba(13,18,32,0.85)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '16px', padding: '0.875rem 1rem', backdropFilter: 'blur(16px)', boxShadow: '0 0 30px rgba(99,102,241,0.08)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hãy mô tả nội dung bạn muốn tạo..."
              rows={1}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.65, fontFamily: 'Inter, sans-serif', resize: 'none', overflow: 'hidden', minHeight: '24px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', color: '#334155' }}>
                Shift+Enter để xuống dòng · Enter để gửi
              </span>
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isGenerating}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '10px', background: inputValue.trim() && !isGenerating ? 'linear-gradient(135deg,#4f46e5,#9333ea)' : 'rgba(30,41,59,0.5)', border: 'none', color: inputValue.trim() && !isGenerating ? '#fff' : '#334155', fontSize: '0.8125rem', fontWeight: 700, cursor: inputValue.trim() && !isGenerating ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: inputValue.trim() && !isGenerating ? '0 0 18px rgba(99,102,241,0.35)' : 'none' }}
              >
                <Send size={14} /> Gửi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global styles */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .quick-actions-sidebar {
          width: 320px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow-y: auto;
          padding-bottom: 1rem;
        }
        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        @media (max-width: 1024px) {
          .quick-actions-grid {
            grid-template-columns: 1fr;
          }
          .quick-actions-sidebar {
            width: 230px;
          }
        }
        @media (max-width: 768px) {
          .quick-actions-sidebar {
            width: 100%;
          }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .ai-msg-content h2 { font-size: 0.9375rem; font-weight: 700; color: #e2e8f0; margin: 0.875rem 0 0.4rem; }
        .ai-msg-content h3 { font-size: 0.875rem; font-weight: 700; color: #cbd5e1; margin: 0.75rem 0 0.35rem; }
        .ai-msg-content p  { font-size: 0.875rem; color: #94a3b8; line-height: 1.75; margin: 0.25rem 0; }
        .ai-msg-content ul, .ai-msg-content ol { padding-left: 1.25rem; margin: 0.35rem 0; }
        .ai-msg-content li { font-size: 0.875rem; color: #94a3b8; line-height: 1.75; margin: 0.1rem 0; }
        .ai-msg-content strong { color: #c7d2fe; font-weight: 600; }
        .ai-msg-content em { color: #818cf8; font-style: italic; }
        .ai-msg-content code { background: rgba(99,102,241,0.12); color: #a5b4fc; padding: 0.1em 0.4em; border-radius: 4px; font-size: 0.8125rem; font-family: 'JetBrains Mono', 'Courier New', monospace; }
        .ai-msg-content pre { background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.875rem 1rem; margin: 0.5rem 0; overflow-x: auto; }
        .ai-msg-content pre code { background: none; padding: 0; color: #94a3b8; font-size: 0.8rem; }
        .ai-msg-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 0.75rem 0; }
        .ai-msg-content table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; margin: 0.5rem 0; }
        .ai-msg-content th { background: rgba(99,102,241,0.1); color: #a5b4fc; font-weight: 700; padding: 0.45rem 0.75rem; text-align: left; border: 1px solid rgba(99,102,241,0.2); }
        .ai-msg-content td { color: #94a3b8; padding: 0.4rem 0.75rem; border: 1px solid rgba(255,255,255,0.06); }
        .ai-msg-content blockquote { border-left: 3px solid #6366f1; padding-left: 0.875rem; margin: 0.5rem 0; color: #64748b; font-style: italic; }
      `}</style>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MessageBubble({ msg, copiedId, savedId, onCopy, onSave, onRetry, onGenerateImage, isGenImage }: {
  msg: Message;
  copiedId: string | null;
  savedId: string | null;
  onCopy: (m: Message) => void;
  onSave: (m: Message) => void;
  onRetry: () => void;
  onGenerateImage: (m: Message) => void;
  isGenImage: boolean;
}) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.875rem', animation: 'fadeSlideIn 0.3s ease', gap: '0.65rem', alignItems: 'flex-end' }}>
        <div style={{ maxWidth: '72%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '14px 14px 4px 14px', padding: '0.75rem 1rem', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }}>
          <p style={{ fontSize: '0.875rem', color: '#fff', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>
        </div>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={14} style={{ color: '#fff' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', animation: 'fadeSlideIn 0.35s ease', alignItems: 'flex-start' }}>
      {/* AI avatar */}
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(79,70,229,0.25),rgba(147,51,234,0.25))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
        <Bot size={16} style={{ color: '#818cf8' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Message bubble */}
        <div style={{ background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0 14px 14px 14px', padding: '1rem 1.1rem', backdropFilter: 'blur(8px)' }}>
          <MarkdownContent content={msg.content} />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', paddingLeft: '0.1rem', flexWrap: 'wrap' }}>
          <ActionBtn icon={copiedId === msg.id ? <CheckCircle2 size={12} /> : <Copy size={12} />} label={copiedId === msg.id ? 'Đã chép' : 'Sao chép'} active={copiedId === msg.id} color="#10b981" onClick={() => onCopy(msg)} />
          <ActionBtn icon={savedId === msg.id ? <CheckCircle2 size={12} /> : <Save size={12} />} label={savedId === msg.id ? 'Đã lưu vào Thư viện' : 'Lưu vào Thư viện'} active={savedId === msg.id} color="#10b981" onClick={() => onSave(msg)} />
          <ActionBtn icon={<RotateCcw size={12} />} label="Thử lại" onClick={onRetry} />
          {/* Phase 2: Poster image button — only shown for poster messages */}
          {msg.isPoster && (
            <ActionBtn
              icon={isGenImage ? <Wand2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={12} />}
              label={isGenImage ? 'Đang tạo ảnh...' : '🎨 Tạo ảnh Poster'}
              onClick={() => onGenerateImage(msg)}
              active={isGenImage}
              color="#6366f1"
              disabled={isGenImage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Phase 3: Poster Image Preview Card ──────────────────────────────────────
function PosterImageCard({ isLoading, result }: { isLoading: boolean; result: MockImageResult | null }) {
  const ts = result ? new Date(result.createdAt).toLocaleString('vi-VN') : '';

  return (
    <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', animation: 'fadeSlideIn 0.4s ease', alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(236,72,153,0.3))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
        <Image size={16} style={{ color: '#a78bfa' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '0 14px 14px 14px', padding: '1rem 1.1rem', backdropFilter: 'blur(8px)' }}>

          {/* Loading state */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem 0' }}>
              <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(99,102,241,0.15)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', inset: 0, border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
                <Wand2 size={18} style={{ position: 'absolute', inset: 0, margin: 'auto', color: '#818cf8' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem', marginBottom: '0.25rem' }}>AI đang tạo ảnh poster...</p>
                <p style={{ fontSize: '0.75rem', color: '#475569' }}>Đang áp dụng brand guidelines và tối ưu bố cục</p>
              </div>
              {/* Animated progress bar */}
              <div style={{ width: '200px', height: '3px', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#a78bfa,#6366f1)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite', borderRadius: '999px' }} />
              </div>
            </div>
          )}

          {/* Result state */}
          {!isLoading && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#e2e8f0' }}>Poster đã được tạo</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#475569' }}>{ts}</span>
              </div>

              {/* Mock thumbnail */}
              <div style={{
                width: '100%', aspectRatio: '16/9', maxHeight: '220px',
                background: 'linear-gradient(135deg,rgba(79,70,229,0.2) 0%,rgba(147,51,234,0.15) 40%,rgba(236,72,153,0.12) 100%)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', position: 'relative', overflow: 'hidden',
              }}>
                {/* Decorative grid */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,rgba(99,102,241,0.04) 0,rgba(99,102,241,0.04) 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,rgba(99,102,241,0.04) 0,rgba(99,102,241,0.04) 1px,transparent 1px,transparent 40px)' }} />
                <ImageIcon size={36} style={{ color: 'rgba(99,102,241,0.3)', position: 'relative' }} />
                <p style={{ fontSize: '0.75rem', color: '#475569', position: 'relative', textAlign: 'center', maxWidth: '240px', lineHeight: 1.5 }}>
                  Xem trước poster sẽ hiển thị tại đây<br />khi kết nối Image Generation API
                </p>
              </div>

              {/* Notice */}
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: '8px', padding: '0.6rem 0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>ℹ️</span>
                <p style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.55, margin: 0, color: '#fbbf24' }}>
                  Tính năng tạo ảnh thực tế sẽ được kích hoạt khi kết nối Image Generation API.
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.875rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(30,41,59,0.4)', color: '#334155', cursor: 'not-allowed', opacity: 0.5 }}
                >
                  <Download size={12} /> Tải xuống
                </button>
                <button
                  disabled
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.875rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.08)', color: '#6366f1', cursor: 'not-allowed', opacity: 0.5 }}
                >
                  <Save size={12} /> Lưu vào thư viện
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, active, color, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; color?: string; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.28rem 0.6rem', borderRadius: '7px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', opacity: disabled && !active ? 0.5 : 1, ...(active ? { background: `${color ?? '#6366f1'}15`, borderColor: `${color ?? '#6366f1'}40`, color: color ?? '#6366f1' } : { background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(255,255,255,0.06)', color: '#475569' }) }}
      onMouseEnter={e => { if (!active && !disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; } }}
      onMouseLeave={e => { if (!active && !disabled) { e.currentTarget.style.background = 'rgba(15,23,42,0.5)'; e.currentTarget.style.color = '#475569'; } }}
    >
      {icon} {label}
    </button>
  );
}

function CtxChip({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: `${color}12`, border: `1px solid ${color}35`, color: color }}>
      {icon} {label}
    </span>
  );
}

// ─── Simple Markdown Renderer ──────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  const html = content
    // headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // horizontal rule
    .replace(/^---+$/gm, '<hr/>')
    // bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // code blocks
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // tables (simplified)
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim() !== '');
      if (cells.every(c => /^[-:\s]+$/.test(c))) return '<tr-sep/>';
      return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`;
    })
    // wrap table rows
    .replace(/(<tr>.*<\/tr>\n?)+/gs, (match) => {
      const rows = match.trim().split('\n').filter(r => r.trim() && r !== '<tr-sep/>');
      if (rows.length === 0) return '';
      const [header, ...body] = rows;
      const headerHtml = header.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
      return `<table><thead>${headerHtml}</thead><tbody>${body.join('')}</tbody></table>`;
    })
    .replace(/<tr-sep\/>/g, '')
    // unordered list items
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    // ordered list items
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // wrap consecutive <li> tags
    .replace(/(<li>.*<\/li>\n?)+/gs, match => `<ul>${match}</ul>`)
    // blockquote
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    // paragraph: remaining lines
    .replace(/^(?!<[a-z]).+$/gm, line => line.trim() ? `<p>${line}</p>` : '')
    // clean double blank lines
    .replace(/\n{3,}/g, '\n\n');

  return (
    <div
      className="ai-msg-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
