import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import { getDeadlineIndicator, type Activity } from '../data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

type FocusItem = {
  id: string;
  type: 'activity' | 'content';
  title: string;
  context: string;
  owner: string;
  due: string;
  reason: string;
  tone: 'danger' | 'warning' | 'review' | 'muted' | 'success';
};

function isDone(activity: Activity) {
  return activity.status === 'Hoàn thành' || activity.status === 'Kết thúc';
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
}

function focusToneClass(tone: FocusItem['tone']) {
  if (tone === 'danger') return 'focus-tone-danger';
  if (tone === 'warning') return 'focus-tone-warning';
  if (tone === 'review') return 'focus-tone-review';
  if (tone === 'success') return 'focus-tone-success';
  return 'focus-tone-muted';
}

export function Dashboard() {
  const navigate = useNavigate();
  const { activities, projects, contents, loading } = useData();

  const total = activities.length;
  const completed = activities.filter(isDone).length;
  const inProgress = activities.filter(a => a.status === 'Đang thực hiện').length;
  const waiting = activities.filter(a => a.status === 'Chờ duyệt').length;
  const notStarted = activities.filter(a => a.status === 'Chưa bắt đầu').length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const today = new Date().toISOString().split('T')[0];
  const twoDaysLater = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const threeDaysLater = new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const overdue = activities.filter(a => getDeadlineIndicator(a).isOverdue).length;
  const dueSoon = activities.filter(a => a.deadline && a.deadline >= today && a.deadline <= threeDaysLater && !isDone(a)).length;
  const approvedUnpublished = contents.filter(c => (c.status || 'Draft') === 'Approved' && !c.publishedAt).length;

  // 4 KPI cards — súc tích, đủ thông tin
  const stats = [
    { label: 'Tổng hoạt động', value: total, caption: `${projects.length} dự án`, tone: '#101828', accent: '#64748b' },
    { label: 'Đang thực hiện', value: inProgress, caption: `${completionRate}% hoàn thành`, tone: '#2563eb', accent: '#3b82f6' },
    { label: 'Sắp / Quá hạn', value: dueSoon + overdue, caption: `${overdue} quá hạn`, tone: overdue > 0 ? '#be123c' : '#b45309', accent: overdue > 0 ? '#e11d48' : '#f59e0b' },
    { label: 'Chờ duyệt', value: waiting, caption: `${approvedUnpublished} approved chưa đăng`, tone: '#c2410c', accent: '#ea580c' },
  ];

  const getProjectName = (projectId: string) =>
    projects.find(p => p.id === projectId)?.name || 'Không có dự án';

  const activityFocusItems: FocusItem[] = activities
    .filter(activity => !isDone(activity))
    .flatMap(activity => {
      const items: FocusItem[] = [];
      const indicator = getDeadlineIndicator(activity);
      const base = {
        id: activity.id,
        type: 'activity' as const,
        title: activity.name,
        context: getProjectName(activity.projectId),
        owner: activity.assignee || 'Chưa gán',
        due: formatDate(activity.deadline),
      };

      if (indicator.isOverdue) {
        items.push({ ...base, reason: 'Quá hạn', tone: 'danger' });
      } else if (activity.deadline && activity.deadline >= today && activity.deadline <= twoDaysLater) {
        items.push({ ...base, reason: 'Sắp đến hạn', tone: 'warning' });
      }
      if (activity.status === 'Chờ duyệt') {
        items.push({ ...base, reason: activity.approver ? `Chờ: ${activity.approver}` : 'Chờ duyệt', tone: 'review' });
      }
      if (!activity.assignee) {
        items.push({ ...base, reason: 'Chưa có owner', tone: 'muted' });
      }
      return items;
    });

  const contentFocusItems: FocusItem[] = contents
    .filter(content => {
      const status = content.status || 'Draft';
      return status === 'In review' || (status === 'Approved' && !content.publishedAt);
    })
    .map(content => ({
      id: content.id,
      type: 'content' as const,
      title: content.title,
      context: content.projectName || 'Nội dung độc lập',
      owner: content.approver || 'Chưa gán người duyệt',
      due: content.publishedAt ? formatDate(content.publishedAt) : '—',
      reason: (content.status || 'Draft') === 'Approved' ? 'Approved, chưa publish' : 'Đang review',
      tone: (content.status || 'Draft') === 'Approved' ? 'success' : 'review',
    }));

  const focusItems = [...activityFocusItems, ...contentFocusItems].slice(0, 7);

  const pieData = [
    { name: 'Chưa bắt đầu', value: notStarted, color: '#94a3b8' },
    { name: 'Đang thực hiện', value: inProgress, color: '#3b82f6' },
    { name: 'Chờ duyệt', value: waiting, color: '#f59e0b' },
    { name: 'Hoàn thành', value: completed, color: '#10b981' },
  ].filter(d => d.value > 0);

  const projectChartData = projects.map(p => {
    const pActs = activities.filter(a => a.projectId === p.id);
    const done = pActs.filter(isDone).length;
    return { name: p.name, total: pActs.length, done };
  });

  if (loading) {
    return (
      <div className="page-shell">
        <div className="dashboard-loading-state panel-card">
          <div className="dashboard-loading-spinner" />
          <div>
            <h2>Đang tải dữ liệu Dashboard</h2>
            <p>Đang đồng bộ Projects, Activities và Content từ Google Sheets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      {/* KPI Row */}
      <section className="kpi-grid" aria-label="Chỉ số tổng quan">
        {stats.map(stat => (
          <article
            key={stat.label}
            className="panel-card kpi-card"
            style={{ '--tone': stat.tone, '--accent': stat.accent } as CSSProperties}
          >
            <div className="kpi-label">{stat.label}</div>
            <div className="kpi-value">{stat.value}</div>
            <div className="kpi-caption">{stat.caption}</div>
          </article>
        ))}
      </section>

      {/* Main 2-col layout */}
      <section className="db-main-grid">

        {/* Left col: Today Focus */}
        <div className="db-left-col">
          <article className="today-focus panel-card">
            <div className="today-focus-head">
              <h2 className="panel-card-title">Cần xử lý hôm nay</h2>
              <div className="today-focus-chips">
                {overdue > 0 && <span className="focus-chip focus-chip-danger">{overdue} quá hạn</span>}
                {dueSoon > 0 && <span className="focus-chip focus-chip-warning">{dueSoon} sắp hạn</span>}
                {waiting > 0 && <span className="focus-chip focus-chip-review">{waiting} chờ duyệt</span>}
              </div>
            </div>

            {focusItems.length === 0 ? (
              <div className="empty-state">Không có việc ưu tiên ngay lúc này. 🎉</div>
            ) : (
              <div className="focus-list">
                {focusItems.map(item => (
                  <button
                    key={`${item.type}-${item.id}-${item.reason}`}
                    className="focus-row"
                    onClick={() => navigate(item.type === 'activity' ? '/activities' : '/library')}
                  >
                    <span className={`focus-reason ${focusToneClass(item.tone)}`}>{item.reason}</span>
                    <span className="focus-main">
                      <strong>{item.title}</strong>
                      <small>{item.context}</small>
                    </span>
                    <span className="focus-date">{item.due}</span>
                  </button>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* Right col: Charts stacked */}
        <div className="db-right-col">
          {/* Pie chart */}
          <article className="panel-card db-chart-card">
            <h2 className="panel-card-title">Phân bổ trạng thái</h2>
            {pieData.length > 0 ? (
              <>
                <div className="db-chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={4} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #dfe5ef', borderRadius: 10, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="status-legend">
                  {pieData.map(item => (
                    <div key={item.name} className="legend-item">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        {item.name}
                      </span>
                      <span className="legend-count">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">Chưa có dữ liệu.</div>
            )}
          </article>

          {/* Bar chart */}
          <article className="panel-card db-chart-card">
            <h2 className="panel-card-title">Tiến độ theo dự án</h2>
            {projectChartData.length > 0 ? (
              <div className="db-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectChartData} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf1f7" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #dfe5ef', borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="total" fill="#d8e0ee" radius={[6, 6, 0, 0]} name="Tổng" maxBarSize={56} />
                    <Bar dataKey="done" fill="#ea580c" radius={[6, 6, 0, 0]} name="Hoàn thành" maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">Chưa có dự án nào.</div>
            )}
          </article>
        </div>
      </section>

      {/* Active activities table — compact */}
      <article className="panel-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="panel-card-title">Hoạt động đang triển khai</h2>
          <button
            className="db-see-all-btn"
            onClick={() => navigate('/activities')}
          >
            Xem tất cả →
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên hoạt động</th>
                <th>Dự án</th>
                <th>Phụ trách</th>
                <th>Deadline</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {activities.filter(a => a.status === 'Đang thực hiện').slice(0, 5).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-text-tertiary">Không có hoạt động nào đang triển khai.</td></tr>
              ) : activities.filter(a => a.status === 'Đang thực hiện').slice(0, 5).map(activity => (
                <tr key={activity.id}>
                  <td><span className="font-bold text-text-primary">{activity.name}</span></td>
                  <td>{getProjectName(activity.projectId)}</td>
                  <td>{activity.assignee || <span style={{ color: '#94a3b8' }}>Chưa gán</span>}</td>
                  <td><span className="font-bold text-text-primary">{formatDate(activity.deadline)}</span></td>
                  <td><Badge status={activity.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
