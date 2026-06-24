import './UI.css';

type Status = 'Chưa bắt đầu' | 'Đang thực hiện' | 'Chờ duyệt' | 'Hoàn thành' | 'Tạm dừng' | 'Kết thúc';

interface BadgeProps {
  status: Status | string;
}

export function Badge({ status }: BadgeProps) {
  const getStatusClass = (s: string) => {
    switch (s) {
      case 'Hoàn thành':
      case 'Kết thúc':
        return 'badge-success';
      case 'Quá hạn':
        return 'badge-danger';
      case 'Đang thực hiện':
      case 'Đang trong thời gian thực hiện':
        return 'badge-primary';
      case 'Chờ duyệt':
      case 'Sắp đến hạn':
        return 'badge-warning';
      case 'Tạm dừng':
      case 'Chưa bắt đầu':
      default:
        return 'badge-secondary';
    }
  };

  return (
    <span className={`badge ${getStatusClass(status)}`}>
      {status}
    </span>
  );
}
