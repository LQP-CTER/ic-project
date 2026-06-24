import React from 'react';
import { type Activity } from '../data/mockData';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Edit2, Trash2, ExternalLink, Calendar, User, Tag, Radio, Paperclip } from 'lucide-react';
import { useData } from '../context/DataContext';

interface ActivityDetailProps {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  'High': { background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.25)' },
  'Medium': { background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.25)' },
  'Low': { background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.25)' },
};

function InfoRow({ icon, label, value, isLink }: { icon: React.ReactNode; label: string; value?: string; isLink?: boolean }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ color: 'var(--text-secondary)', marginTop: '1px', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>{label}</p>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.8125rem', color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}>
            {value} <ExternalLink size={12} style={{ flexShrink: 0 }} />
          </a>
        ) : (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: '1.5' }}>{value}</p>
        )}
      </div>
    </div>
  );
}

export function ActivityDetail({ activity, onEdit, onDelete, onClose }: ActivityDetailProps) {
  const { projects } = useData();
  const projectName = projects.find(p => p.id === activity.projectId)?.name || 'Unknown Project';
  const priorityStyle = PRIORITY_STYLE[activity.priority] || PRIORITY_STYLE['Medium'];

  const handleDelete = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa hoạt động "${activity.name}"?`)) {
      onDelete();
      onClose();
    }
  };

  const hasNoDetails = !activity.assignee && !activity.startDate && !activity.deadline
    && !activity.channel && !activity.attachmentLink && !activity.notes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

      {/* ── META BADGES ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
          background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)',
        }}>
          {projectName}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', ...priorityStyle }}>
          {activity.priority} Priority
        </span>
      </div>

      {/* ── TITLE ── */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.4', marginBottom: activity.description ? '8px' : 0 }}>
          {activity.name}
        </h2>
        {activity.description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {activity.description}
          </p>
        )}
      </div>

      {/* ── STATUS ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Trạng thái:</span>
        <Badge status={activity.status} />
      </div>

      {/* ── DETAILS ── */}
      <div style={{
        borderRadius: '10px', background: 'rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.07)', padding: '0 14px',
      }}>
        <InfoRow icon={<User size={14} />} label="Người phụ trách" value={activity.assignee} />
        <InfoRow icon={<Calendar size={14} />} label="Ngày bắt đầu" value={activity.startDate} />
        <InfoRow icon={<Calendar size={14} />} label="Deadline" value={activity.deadline} />
        <InfoRow icon={<Radio size={14} />} label="Kênh truyền thông" value={activity.channel} />
        <InfoRow icon={<Paperclip size={14} />} label="Tài liệu đính kèm" value={activity.attachmentLink} isLink />
        <div style={{ borderBottom: 'none' }}>
          <InfoRow icon={<Tag size={14} />} label="Ghi chú" value={activity.notes} />
        </div>
        {hasNoDetails && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '14px 0', textAlign: 'center' }}>
            Chưa có thông tin chi tiết
          </p>
        )}
      </div>

      {/* ── ACTIONS ── */}
      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
        <Button variant="secondary" icon={<Edit2 size={15} />} onClick={onEdit} style={{ flex: 1 }}>
          Chỉnh sửa
        </Button>
        <Button
          variant="ghost"
          icon={<Trash2 size={15} />}
          onClick={handleDelete}
          style={{ flex: 1, color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          Xóa
        </Button>
      </div>
    </div>
  );
}
