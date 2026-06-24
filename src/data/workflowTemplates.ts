// Workflow template data — add new templates here without changing the UI

export interface WorkflowStep {
  name: string;
  description: string;
  channel: string;
  daysFromStart: number; // offset from project start date
  durationDays: number;  // how many days for this step
  priority: 'High' | 'Medium' | 'Low';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedWeeks: number;
  steps: WorkflowStep[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'wf-survey',
    name: 'Khảo sát nhân viên',
    description: 'Quy trình triển khai khảo sát toàn diện: từ thiết kế đến tổng hợp và truyền thông kết quả.',
    category: 'Khảo sát & Đánh giá',
    estimatedWeeks: 2,
    steps: [
      { name: 'Nhận yêu cầu & Lên kế hoạch', description: 'Xác định mục tiêu, phạm vi và timeline của khảo sát.', channel: 'Internal', daysFromStart: 0, durationDays: 2, priority: 'High' },
      { name: 'Xây dựng nội dung khảo sát', description: 'Thiết kế bộ câu hỏi khảo sát phù hợp với mục tiêu.', channel: 'Internal', daysFromStart: 2, durationDays: 3, priority: 'High' },
      { name: 'Truyền thông launch khảo sát', description: 'Thông báo khởi động khảo sát qua GTalk và Email nội bộ.', channel: 'GTalk', daysFromStart: 5, durationDays: 1, priority: 'High' },
      { name: 'Reminder lần 1', description: 'Nhắc nhở nhân viên chưa tham gia điền khảo sát.', channel: 'GTalk', daysFromStart: 8, durationDays: 1, priority: 'Medium' },
      { name: 'Reminder lần 2 & Đóng khảo sát', description: 'Nhắc nhở lần cuối và thông báo thời hạn đóng khảo sát.', channel: 'GTalk', daysFromStart: 11, durationDays: 1, priority: 'Medium' },
      { name: 'Tổng hợp & Phân tích kết quả', description: 'Thu thập dữ liệu, phân tích và tổng hợp insight chính.', channel: 'Internal', daysFromStart: 12, durationDays: 2, priority: 'High' },
      { name: 'Truyền thông kết quả', description: 'Chia sẻ kết quả khảo sát và các hành động tiếp theo tới toàn bộ nhân viên.', channel: 'GTalk', daysFromStart: 14, durationDays: 1, priority: 'High' },
    ]
  },
  {
    id: 'wf-tool',
    name: 'Triển khai công cụ mới',
    description: 'Hỗ trợ nhân viên thích nghi với hệ thống hoặc công cụ mới thông qua truyền thông và đào tạo.',
    category: 'Chuyển đổi hệ thống',
    estimatedWeeks: 3,
    steps: [
      { name: 'Nhận yêu cầu & Phân tích', description: 'Tìm hiểu công cụ, xác định đối tượng ảnh hưởng và nhu cầu truyền thông.', channel: 'Internal', daysFromStart: 0, durationDays: 2, priority: 'High' },
      { name: 'Chuẩn bị tài liệu hướng dẫn', description: 'Soạn thảo user guide, FAQ và tài liệu đào tạo.', channel: 'Internal', daysFromStart: 2, durationDays: 4, priority: 'High' },
      { name: 'Thiết kế truyền thông', description: 'Thiết kế poster, banner và nội dung truyền thông giới thiệu công cụ.', channel: 'Offline', daysFromStart: 4, durationDays: 3, priority: 'Medium' },
      { name: 'Đăng tải thông báo chính thức', description: 'Phát hành thông báo chính thức về việc áp dụng công cụ mới.', channel: 'Email', daysFromStart: 7, durationDays: 1, priority: 'High' },
      { name: 'Reminder & Đào tạo', description: 'Tổ chức hoặc chia sẻ session đào tạo ngắn cho nhân viên.', channel: 'GTalk', daysFromStart: 10, durationDays: 2, priority: 'Medium' },
      { name: 'Hỗ trợ người dùng', description: 'Thiết lập kênh hỗ trợ và giải đáp thắc mắc trong giai đoạn chuyển đổi.', channel: 'GTalk', daysFromStart: 12, durationDays: 5, priority: 'Medium' },
      { name: 'Tổng kết & Báo cáo', description: 'Đánh giá mức độ áp dụng và tổng hợp feedback từ người dùng.', channel: 'Internal', daysFromStart: 17, durationDays: 2, priority: 'Low' },
    ]
  },
  {
    id: 'wf-townhall',
    name: 'Sự kiện Town Hall',
    description: 'Lên kế hoạch và truyền thông toàn bộ quy trình tổ chức Town Hall định kỳ.',
    category: 'Sự kiện nội bộ',
    estimatedWeeks: 2,
    steps: [
      { name: 'Lên kế hoạch & Xác nhận lịch', description: 'Xác nhận ngày tổ chức, địa điểm và chủ đề chính.', channel: 'Internal', daysFromStart: 0, durationDays: 2, priority: 'High' },
      { name: 'Thiết kế nội dung chương trình', description: 'Xây dựng agenda, câu hỏi Q&A và nội dung trình bày.', channel: 'Internal', daysFromStart: 2, durationDays: 3, priority: 'High' },
      { name: 'Truyền thông thông báo sự kiện', description: 'Phát thông báo chính thức về Town Hall tới toàn công ty.', channel: 'GTalk', daysFromStart: 5, durationDays: 1, priority: 'High' },
      { name: 'Reminder trước sự kiện', description: 'Nhắc nhở nhân viên về thời gian và cách tham gia.', channel: 'GTalk', daysFromStart: 9, durationDays: 1, priority: 'Medium' },
      { name: 'Tổ chức sự kiện', description: 'Chạy chương trình Town Hall và thu thập câu hỏi live.', channel: 'Offline', daysFromStart: 11, durationDays: 1, priority: 'High' },
      { name: 'Truyền thông sau sự kiện', description: 'Chia sẻ recording, tóm tắt nội dung và điểm chính.', channel: 'GTalk', daysFromStart: 12, durationDays: 2, priority: 'Medium' },
    ]
  },
  {
    id: 'wf-recognition',
    name: 'Chương trình ghi nhận nhân viên',
    description: 'Triển khai chiến dịch vinh danh và ghi nhận đóng góp của nhân viên theo định kỳ.',
    category: 'Gắn kết nhân viên',
    estimatedWeeks: 3,
    steps: [
      { name: 'Xác định tiêu chí ghi nhận', description: 'Thống nhất các hạng mục, tiêu chí và hình thức ghi nhận.', channel: 'Internal', daysFromStart: 0, durationDays: 3, priority: 'High' },
      { name: 'Thiết kế collateral', description: 'Thiết kế certificate, banner và vật phẩm ghi nhận.', channel: 'Offline', daysFromStart: 3, durationDays: 4, priority: 'Medium' },
      { name: 'Mở đề cử & Bình chọn', description: 'Thông báo mở cổng đề cử và hướng dẫn tham gia.', channel: 'GTalk', daysFromStart: 7, durationDays: 5, priority: 'High' },
      { name: 'Tổng hợp & Xét duyệt', description: 'Thu thập đề cử, xét duyệt và xác nhận danh sách được ghi nhận.', channel: 'Internal', daysFromStart: 12, durationDays: 3, priority: 'High' },
      { name: 'Truyền thông vinh danh', description: 'Công bố và vinh danh các cá nhân được ghi nhận trên GTalk.', channel: 'GTalk', daysFromStart: 15, durationDays: 1, priority: 'High' },
      { name: 'Tổ chức lễ trao giải', description: 'Tổ chức buổi lễ trao giải và chụp ảnh lưu niệm.', channel: 'Offline', daysFromStart: 17, durationDays: 1, priority: 'Medium' },
    ]
  },
  {
    id: 'wf-campaign',
    name: 'Chiến dịch truyền thông nội bộ',
    description: 'Quy trình triển khai một chiến dịch truyền thông nội bộ theo chủ đề từ đầu đến cuối.',
    category: 'Truyền thông nội bộ',
    estimatedWeeks: 3,
    steps: [
      { name: 'Brief & Lên ý tưởng', description: 'Xác định message chính, đối tượng và tone of voice.', channel: 'Internal', daysFromStart: 0, durationDays: 2, priority: 'High' },
      { name: 'Lên kế hoạch nội dung', description: 'Xây dựng content plan với các kênh và lịch đăng.', channel: 'Internal', daysFromStart: 2, durationDays: 2, priority: 'High' },
      { name: 'Sản xuất nội dung', description: 'Viết copy, thiết kế visual cho tất cả các kênh.', channel: 'Offline', daysFromStart: 4, durationDays: 5, priority: 'High' },
      { name: 'Duyệt nội dung', description: 'Gửi nội dung cho quản lý/stakeholder review và chỉnh sửa.', channel: 'Internal', daysFromStart: 9, durationDays: 2, priority: 'High' },
      { name: 'Launch chiến dịch', description: 'Đăng tải đồng loạt trên các kênh theo kế hoạch.', channel: 'GTalk', daysFromStart: 11, durationDays: 1, priority: 'High' },
      { name: 'Đăng tải nội dung tiếp theo', description: 'Tiếp tục đăng tải các nội dung theo lịch content plan.', channel: 'GTalk', daysFromStart: 12, durationDays: 5, priority: 'Medium' },
      { name: 'Đo lường & Báo cáo', description: 'Thu thập số liệu, đánh giá hiệu quả và tổng hợp báo cáo.', channel: 'Internal', daysFromStart: 17, durationDays: 3, priority: 'Low' },
    ]
  },
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Khảo sát & Đánh giá': { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  'Chuyển đổi hệ thống': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  'Sự kiện nội bộ': { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  'Gắn kết nhân viên': { bg: 'rgba(236,72,153,0.12)', text: '#f472b6', border: 'rgba(236,72,153,0.25)' },
  'Truyền thông nội bộ': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
};
