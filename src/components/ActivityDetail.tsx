import { type Activity } from '../data/mockData';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useData } from '../context/DataContext';

interface ActivityDetailProps {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const PRIORITY_STYLE: Record<string, string> = {
  'High': 'bg-danger-light text-danger border-danger/20',
  'Medium': 'bg-warning-light text-warning border-warning/20',
  'Low': 'bg-success-light text-success border-success/20',
};

function InfoRow({ label, value, isLink }: { label: string; value?: string; isLink?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border last:border-b-0">
      <span className="text-xs text-text-tertiary font-medium">{label}</span>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
          {value}
        </a>
      ) : (
        <span className="text-sm text-text-primary break-words leading-relaxed">{value}</span>
      )}
    </div>
  );
}

export function ActivityDetail({ activity, onEdit, onDelete, onClose }: ActivityDetailProps) {
  const { projects } = useData();
  const projectName = projects.find(p => p.id === activity.projectId)?.name || 'Unknown Project';
  const priorityStyle = PRIORITY_STYLE[activity.priority] || PRIORITY_STYLE['Medium'];

  const handleDelete = () => {
    if (confirm(`Xóa hoạt động "${activity.name}"?`)) {
      onDelete();
      onClose();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-light text-primary border border-primary/20">
          {projectName}
        </span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${priorityStyle}`}>
          {activity.priority}
        </span>
      </div>

      <div>
        <h2 className="text-lg font-bold text-text-primary mb-2">{activity.name}</h2>
        {activity.description && (
          <p className="text-sm text-text-secondary leading-relaxed">{activity.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary border border-border">
        <span className="text-sm text-text-secondary">Trạng thái:</span>
        <Badge status={activity.status} />
      </div>

      <div className="rounded-lg bg-surface-secondary border border-border px-4">
        <InfoRow label="Người phụ trách" value={activity.assignee} />
        <InfoRow label="Ngày bắt đầu" value={activity.startDate} />
        <InfoRow label="Deadline" value={activity.deadline} />
        <InfoRow label="Kênh truyền thông" value={activity.channel} />
        <InfoRow label="Tài liệu đính kèm" value={activity.attachmentLink} isLink />
        <InfoRow label="Ghi chú" value={activity.notes} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onEdit} className="flex-1">Chỉnh sửa</Button>
        <Button variant="danger" onClick={handleDelete} className="flex-1">Xóa</Button>
      </div>
    </div>
  );
}
