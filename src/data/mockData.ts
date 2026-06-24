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
    notes: 'Ưu tiên hàng đầu'
  },
  {
    id: 'p2',
    name: 'GTalk Mail',
    description: 'Chuyển đổi hệ thống email nội bộ sang GTalk Mail',
    assignee: 'Hà Nguyễn',
    startDate: '2026-06-10',
    deadline: '2026-08-15',
    status: 'Chưa bắt đầu',
    notes: ''
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
    notes: 'Đã duyệt option 2'
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
    notes: 'Đang chờ review từ sếp'
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
    notes: ''
  }
];

export const initialContents: Content[] = [];

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
