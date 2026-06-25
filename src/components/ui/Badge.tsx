type Status = 'Chưa bắt đầu' | 'Đang thực hiện' | 'Chờ duyệt' | 'Hoàn thành' | 'Tạm dừng' | 'Kết thúc';

interface BadgeProps {
  status: Status | string;
}

const statusStyles: Record<string, string> = {
  'Hoàn thành': 'bg-success-light text-success border-emerald-200',
  'Kết thúc': 'bg-success-light text-success border-emerald-200',
  'Đang thực hiện': 'bg-primary-light text-primary border-indigo-200',
  'Đang trong thời gian thực hiện': 'bg-primary-light text-primary border-indigo-200',
  'Chờ duyệt': 'bg-warning-light text-warning border-amber-200',
  'Sắp đến hạn': 'bg-warning-light text-warning border-amber-200',
  'Quá hạn': 'bg-danger-light text-danger border-rose-200',
  'Tạm dừng': 'bg-slate-100 text-slate-500 border-slate-200',
  'Chưa bắt đầu': 'bg-slate-100 text-slate-600 border-slate-200',
};

export function Badge({ status }: BadgeProps) {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${style}`}>
      {status}
    </span>
  );
}