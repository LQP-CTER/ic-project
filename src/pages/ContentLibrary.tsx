import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { type Content } from '../data/mockData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Poster', 'GTalk', 'Email', 'Reminder', 'Communication Plan', 'Survey', 'Town Hall'];

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
    toast.success('Đã sao chép');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    deleteContent(id);
    toast.success('Đã xóa nội dung');
  };

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Thư viện nội dung</h1>
        <p className="text-sm text-text-secondary">Lưu trữ và tái sử dụng các nội dung truyền thông đã được tạo bởi AI.</p>
      </div>

      <Card className="max-w-xs">
        <p className="text-xs text-text-secondary font-medium">Total Content</p>
        <p className="text-2xl font-bold text-text-primary">{contents.length}</p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilterType(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${filterType === cat ? 'bg-primary-light border-primary/30 text-primary' : 'border-border text-text-secondary hover:bg-surface-tertiary'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <input type="text" placeholder="Tìm kiếm nội dung..."
          className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="flex-1 overflow-y-auto pb-4 min-h-0">
        {contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Chưa có nội dung nào</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-xs">Các nội dung được tạo từ AI Assistant sẽ được lưu tại đây.</p>
            <Button onClick={() => navigate('/ai-assistant')}>Tạo nội dung đầu tiên</Button>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-text-secondary">Không tìm thấy nội dung phù hợp</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredContents.map(content => (
              <div key={content.id} className="bg-surface rounded-xl border border-border p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:border-primary/30">
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-lg bg-primary-light border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{content.contentType?.charAt(0) || 'C'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{content.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                      <span className="truncate max-w-[120px]">{content.projectName}</span>
                      <span>·</span>
                      <span>{new Date(content.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-secondary rounded-lg p-3 text-xs text-text-secondary leading-relaxed h-20 overflow-hidden relative border border-border">
                  <div className="whitespace-pre-wrap line-clamp-3">{content.content}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-surface-secondary to-transparent" />
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-surface-tertiary text-text-secondary border border-border">
                    {content.contentType}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setViewContent(content)}>Xem</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(content.id, content.content)}>
                      {copiedId === content.id ? 'Đã chép' : 'Copy'}
                    </Button>
                    <button onClick={() => handleDelete(content.id)}
                      className="w-8 h-8 rounded-lg text-text-tertiary hover:bg-danger-light hover:text-danger transition-colors text-xs font-medium">
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!viewContent} onClose={() => setViewContent(null)} title={viewContent?.title || 'Chi tiết nội dung'} maxWidth="max-w-2xl">
        {viewContent && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-light text-primary border border-primary/20">{viewContent.contentType}</span>
              <span className="text-xs text-text-secondary py-1">{viewContent.projectName}</span>
              <span className="text-xs text-text-tertiary py-1">· {new Date(viewContent.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="bg-surface-secondary border border-border rounded-xl p-4 text-sm text-text-primary leading-relaxed max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
              {viewContent.content}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setViewContent(null)}>Đóng</Button>
              <Button onClick={() => handleCopy(viewContent.id, viewContent.content)}>
                {copiedId === viewContent.id ? 'Đã copy' : 'Copy nội dung'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
