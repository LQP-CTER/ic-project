export type Status = 'Chưa bắt đầu' | 'Đang thực hiện' | 'Chờ duyệt' | 'Hoàn thành' | 'Tạm dừng' | 'Kết thúc';

export interface Project {
  id: string;
  name: string;
  description: string;
  assignee: string;
  startDate: string;
  deadline: string;
  status: Status;
  notes: string;
  objective?: string;
  audience?: string;
  keyMessage?: string;
  cta?: string;
  channels?: string;
  toneOfVoice?: string;
  stakeholder?: string;
  successMetric?: string;
  mandatoryInfo?: string;
}

export interface Activity {
  id: string;
  projectId: string;
  name: string;
  description: string;
  assignee: string;
  startDate: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  status: Status;
  channel: string;
  attachmentLink: string;
  notes: string;
  approver?: string;
  reviewDueDate?: string;
  reviewNotes?: string;
  checklist?: string;
}

export interface Content {
  id: string;
  title: string;
  contentType: string;
  projectId: string;
  projectName: string;
  activityId: string;
  activityName: string;
  prompt: string;
  content: string;
  createdAt: string;
  status?: 'Draft' | 'In review' | 'Approved' | 'Published' | 'Archived';
  approver?: string;
  reviewNotes?: string;
  publishedAt?: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
}

export const initialProjects: Project[] = [
  {
    id: 'p1',
    name: 'EES 2026',
    description: 'Chiến dịch Khảo sát mức độ gắn kết nhân viên 2026',
    assignee: 'Minh Tuấn',
    startDate: '2026-06-01',
    deadline: '2026-07-30',
    status: 'Đang thực hiện',
    notes: 'Ưu tiên hàng đầu',
    objective: 'Tăng tỷ lệ tham gia khảo sát và giúp nhân viên hiểu giá trị của EES.',
    audience: 'Toàn bộ nhân viên',
    keyMessage: 'Ý kiến của nhân viên là cơ sở để cải thiện môi trường làm việc.',
    cta: 'Hoàn thành khảo sát trước deadline',
    channels: 'GTalk, Email, Offline poster',
    toneOfVoice: 'Rõ ràng, gần gũi, khuyến khích tham gia',
    stakeholder: 'HR Lead',
    successMetric: 'Tỷ lệ tham gia đạt trên 85%',
    mandatoryInfo: 'Link khảo sát, deadline, cam kết bảo mật phản hồi'
  },
  {
    id: 'p2',
    name: 'GTalk Mail',
    description: 'Chuyển đổi hệ thống email nội bộ sang GTalk Mail',
    assignee: 'Hà Nguyễn',
    startDate: '2026-06-10',
    deadline: '2026-08-15',
    status: 'Chưa bắt đầu',
    notes: '',
    objective: 'Thông báo và hỗ trợ nhân viên chuyển đổi sang GTalk Mail đúng tiến độ.',
    audience: 'Toàn bộ nhân viên dùng email nội bộ',
    keyMessage: 'GTalk Mail là hệ thống email mới, cần chuyển đổi theo hướng dẫn để không gián đoạn công việc.',
    cta: 'Đọc hướng dẫn và hoàn tất chuyển đổi trước deadline',
    channels: 'Email, GTalk, FAQ',
    toneOfVoice: 'Chuyên nghiệp, hướng dẫn rõ từng bước',
    stakeholder: 'IT / Operation',
    successMetric: 'Tỷ lệ chuyển đổi thành công trên 95%',
    mandatoryInfo: 'Link hướng dẫn, timeline chuyển đổi, kênh hỗ trợ'
  }
];

export const initialActivities: Activity[] = [
  {
    id: 'a1',
    projectId: 'p1',
    name: 'Thiết kế poster khảo sát',
    description: 'Thiết kế 3 options poster để treo tại các văn phòng.',
    assignee: 'Linh Trần',
    startDate: '2026-06-10',
    deadline: '2026-06-15',
    priority: 'High',
    status: 'Hoàn thành',
    channel: 'Offline',
    attachmentLink: 'https://figma.com/example-link',
    notes: 'Đã duyệt option 2',
    approver: 'HR Lead',
    reviewDueDate: '2026-06-14',
    reviewNotes: 'Chốt option 2, cần export bản final',
    checklist: '[{"id":"poster-copy","title":"Chốt copy poster","done":true},{"id":"poster-export","title":"Export file final","done":false}]'
  },
  {
    id: 'a2',
    projectId: 'p1',
    name: 'Viết bài truyền thông launch khảo sát',
    description: 'Bài viết công bố khởi động khảo sát EES 2026 trên GTalk.',
    assignee: 'Minh Tuấn',
    startDate: '2026-06-16',
    deadline: '2026-06-18',
    priority: 'High',
    status: 'Đang thực hiện',
    channel: 'GTalk',
    attachmentLink: 'https://docs.google.com/example-link',
    notes: 'Đang chờ review từ sếp',
    approver: 'IC Lead',
    reviewDueDate: '2026-06-18',
    reviewNotes: 'Chờ góp ý về CTA và deadline',
    checklist: '[{"id":"draft","title":"Viết bản nháp GTalk","done":true},{"id":"review","title":"Gửi IC Lead review","done":false},{"id":"final","title":"Chốt bản đăng","done":false}]'
  },
  {
    id: 'a3',
    projectId: 'p1',
    name: 'Viết bài reminder tham gia khảo sát',
    description: 'Nhắc nhở nhân viên chưa tham gia điền khảo sát.',
    assignee: 'Minh Tuấn',
    startDate: '2026-06-25',
    deadline: '2026-06-26',
    priority: 'Medium',
    status: 'Chưa bắt đầu',
    channel: 'GTalk',
    attachmentLink: '',
    notes: ''
  },
  {
    id: 'a4',
    projectId: 'p2',
    name: 'Thiết kế poster thông báo',
    description: 'Poster thông báo chuyển đổi hệ thống email.',
    assignee: 'Linh Trần',
    startDate: '2026-06-10',
    deadline: '2026-06-20',
    priority: 'High',
    status: 'Chờ duyệt',
    channel: 'Offline',
    attachmentLink: '',
    notes: '',
    approver: 'IT Lead',
    reviewDueDate: '2026-06-19',
    reviewNotes: 'Cần xác nhận thông tin kỹ thuật trước khi đăng',
    checklist: '[{"id":"tech-info","title":"Xác nhận thông tin kỹ thuật","done":false},{"id":"design","title":"Hoàn thiện poster","done":false}]'
  }
];

export const initialContents: Content[] = [];

export const initialUsers: UserRecord[] = [
  {
    id: 'admin@example.com',
    email: 'admin@example.com',
    name: 'EX Admin',
    role: 'admin'
  }
];

export function getDeadlineIndicator(act?: Activity) {
  if (!act) return { isOverdue: false, indicator: '' };

  const { startDate, deadline, status } = act;
  if (status === 'Hoàn thành' || status === 'Kết thúc') {
    return { isOverdue: false, indicator: '' };
  }

  const today = new Date().toISOString().split('T')[0];
  let isOverdue = false;
  let indicator = '';

  if (deadline) {
    if (today > deadline) {
      isOverdue = true;
      indicator = 'Quá hạn';
    } else {
      const todayDate = new Date(today);
      const deadlineDate = new Date(deadline);
      const diffDays = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 2) {
        indicator = 'Sắp đến hạn';
      } else if (startDate && today >= startDate) {
        indicator = 'Đang trong thời gian thực hiện';
      } else if (startDate && today < startDate) {
        indicator = 'Chưa bắt đầu';
      }
    }
  } else if (startDate) {
    if (today >= startDate) {
      indicator = 'Đang trong thời gian thực hiện';
    } else {
      indicator = 'Chưa bắt đầu';
    }
  }

  return { isOverdue, indicator };
}
