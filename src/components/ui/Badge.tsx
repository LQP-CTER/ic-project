type Status = 'Chưa bắt đầu' | 'Đang thực hiện' | 'Chờ duyệt' | 'Hoàn thành' | 'Tạm dừng' | 'Kết thúc';

interface BadgeProps {
  status: Status | string;
}

const statusStyles: Record<string, string> = {
  'Hoàn thành': 'bg-success-light text-success border-success/20',
  'Kết thúc': 'bg-success-light text-success border-success/20',
  'Đang thực hiện': 'bg-primary-light text-primary border-primary/20',
  'Đang trong thời gian thực hiện': 'bg-primary-light text-primary border-primary/20',
  'Chờ duyệt': 'bg-warning-light text-warning border-warning/20',
  'Sắp đến hạn': 'bg-warning-light text-warning border-warning/20',
  'Quá hạn': 'bg-danger-light text-danger border-danger/20',
  'Tạm dừng': 'bg-surface-tertiary text-text-tertiary border-border',
  'Chưa bắt đầu': 'bg-surface-tertiary text-text-secondary border-border',
};

export function Badge({ status }: BadgeProps) {
  const style = statusStyles[status] || 'bg-surface-tertiary text-text-secondary border-border';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {status}
    </span>
  );
}
