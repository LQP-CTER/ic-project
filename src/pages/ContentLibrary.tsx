import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { type Content } from '../data/mockData';
import { 
  Search, Copy, Trash2, CheckCircle2, 
  FileText, Image as ImageIcon, MessageSquare, Mail, 
  Bell, ClipboardList, Users, Plus, LayoutTemplate, Eye
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

const CATEGORIES = [
  'All',
  'Poster',
  'GTalk',
  'Email',
  'Reminder',
  'Communication Plan',
  'Survey',
  'Town Hall'
];

export function ContentLibrary() {
  const { contents, deleteContent } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewContent, setViewContent] = useState<Content | null>(null);

  const filteredContents = contents.filter(c => {
    const searchTarget = `${c.title} ${c.projectName} ${c.activityName} ${c.content}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || (c.contentType || '').toLowerCase().includes(filterType.toLowerCase()); 
    return matchesSearch && matchesType;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIconForType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('poster')) return <ImageIcon size={18} />;
    if (t.includes('gtalk')) return <MessageSquare size={18} />;
    if (t.includes('email')) return <Mail size={18} />;
    if (t.includes('reminder')) return <Bell size={18} />;
    if (t.includes('survey')) return <ClipboardList size={18} />;
    if (t.includes('town hall')) return <Users size={18} />;
    return <FileText size={18} />;
  };

  const stats = [
    { label: 'Total Content', value: contents.length, icon: <LayoutTemplate size={20} />, color: 'text-indigo-400' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - var(--topbar-height) - 4rem)', minHeight: 0 }}>
      
      {/* SECTION 1: HEADER */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Thư viện nội dung</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Lưu trữ và tái sử dụng các nội dung truyền thông đã được tạo bởi AI.
        </p>
      </div>

      {/* SECTION 2: STATISTICS */}
      <div style={{ maxWidth: '320px', width: '100%' }}>
        {stats.map((stat, i) => (
          <Card key={i} className="flex-col gap-3" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{stat.label}</h3>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} className={stat.color}>
                {stat.icon}
              </div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* SECTION 3: CATEGORY FILTER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterType(cat)}
            style={{
              padding: '6px 14px', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 500,
              transition: 'all 0.2s', cursor: 'pointer',
              background: filterType === cat ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
              color: filterType === cat ? '#818cf8' : 'var(--text-secondary)',
              border: `1px solid ${filterType === cat ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`
            }}
            onMouseEnter={e => {
              if (filterType !== cat) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={e => {
              if (filterType !== cat) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            {cat === 'All' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* SECTION 4: SEARCH BAR */}
      <div style={{ position: 'relative', maxWidth: '420px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Tìm kiếm nội dung..." 
          style={{
            width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '10px 12px 10px 36px', color: 'var(--text-primary)',
            fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s'
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>

      {/* SECTION 5 & 6: CONTENT GRID & EMPTY STATE */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem', minHeight: 0, display: 'flex', flexDirection: 'column' }} className="hide-scrollbar">
        {contents.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Chưa có nội dung nào</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '300px', marginBottom: '24px' }}>
              Các nội dung được tạo từ AI Assistant sẽ được lưu tại đây để tái sử dụng.
            </p>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/ai-assistant')}>
              Tạo nội dung đầu tiên
            </Button>
          </div>
        ) : filteredContents.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textAlign: 'center' }}>
            <Search size={32} style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Không tìm thấy nội dung phù hợp</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredContents.map(content => (
              <div key={content.id} style={{
                background: 'rgba(22,32,52,0.6)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.35)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                {/* Header info */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(99,102,241,0.2)'
                  }}>
                    {getIconForType(content.contentType || '')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {content.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Dự án: {content.projectName}
                      </span>
                      <span>•</span>
                      <span>{new Date(content.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                {/* Content preview */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '12px',
                  fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.6',
                  height: '80px', overflow: 'hidden', position: 'relative',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {content.content}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px',
                    background: 'linear-gradient(transparent, rgba(15,23,42,0.9))'
                  }} />
                </div>

                {/* Footer actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {content.contentType}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" icon={<Eye size={14} />} onClick={() => setViewContent(content)}>
                      View
                    </Button>
                    <Button variant="ghost" icon={copiedId === content.id ? <CheckCircle2 size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />} onClick={() => handleCopy(content.id, content.content)}>
                      {copiedId === content.id ? 'Copied' : 'Copy'}
                    </Button>
                    <button 
                      onClick={() => deleteContent(content.id)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: '1px solid transparent', color: 'var(--text-secondary)',
                        transition: 'all 0.15s', cursor: 'pointer'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'transparent'; }}
                      title="Xóa nội dung"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      <Modal
        isOpen={!!viewContent}
        onClose={() => setViewContent(null)}
        title={viewContent?.title || 'Chi tiết nội dung'}
      >
        {viewContent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                {viewContent.contentType}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '3px 0' }}>
                Dự án: {viewContent.projectName}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '3px 0' }}>
                • {new Date(viewContent.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            
            <div style={{
              background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '1rem',
              fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.7',
              maxHeight: '50vh', overflowY: 'auto', whiteSpace: 'pre-wrap'
            }} className="hide-scrollbar">
              {viewContent.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setViewContent(null)}>Đóng</Button>
              <Button 
                variant="primary" 
                icon={copiedId === viewContent.id ? <CheckCircle2 size={15} /> : <Copy size={15} />} 
                onClick={() => handleCopy(viewContent.id, viewContent.content)}
              >
                {copiedId === viewContent.id ? 'Đã copy' : 'Copy nội dung'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
