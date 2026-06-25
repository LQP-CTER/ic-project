import { Card } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import { getDeadlineIndicator } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const { activities, projects } = useData();

  const total = activities.length;
  const completed = activities.filter(a => a.status === 'Hoàn thành' || a.status === 'Kết thúc').length;
  const inProgress = activities.filter(a => a.status === 'Đang thực hiện').length;
  const waiting = activities.filter(a => a.status === 'Chờ duyệt').length;
  const notStarted = activities.filter(a => a.status === 'Chưa bắt đầu').length;

  const today = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const overdue = activities.filter(a => getDeadlineIndicator(a).isOverdue).length;
  const dueSoon = activities.filter(a => a.deadline && a.deadline >= today && a.deadline <= threeDaysLater && a.status !== 'Hoàn thành' && a.status !== 'Kết thúc').length;

  const stats = [
    { label: 'Tổng số hoạt động', value: total, color: 'bg-primary-light text-primary' },
    { label: 'Sắp đến hạn', value: dueSoon, color: 'bg-warning-light text-warning' },
    { label: 'Đang thực hiện', value: inProgress, color: 'bg-primary-light text-primary-600' },
    { label: 'Quá hạn', value: overdue, color: 'bg-danger-light text-danger' },
    { label: 'Hoàn thành', value: completed, color: 'bg-success-light text-success' },
  ];

  const pieData = [
    { name: 'Chưa bắt đầu', value: notStarted, color: '#94a3b8' },
    { name: 'Đang thực hiện', value: inProgress, color: '#6366f1' },
    { name: 'Chờ duyệt', value: waiting, color: '#f59e0b' },
    { name: 'Hoàn thành', value: completed, color: '#10b981' },
  ].filter(d => d.value > 0);

  const projectChartData = projects.map(p => {
    const pActs = activities.filter(a => a.projectId === p.id);
    const done = pActs.filter(a => a.status === 'Hoàn thành').length;
    return { name: p.name, total: pActs.length, done };
  });

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Dashboard</h1>
        <p className="text-sm text-text-secondary">Tổng quan các hoạt động truyền thông nội bộ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="flex flex-col gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold w-fit ${stat.color}`}>
              {stat.label}
            </span>
            <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Phân bố trạng thái" className="lg:col-span-1">
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-text-tertiary">Chưa có dữ liệu</div>
          )}
        </Card>

        <Card title="Tiến độ dự án" className="lg:col-span-2">
          {projectChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} />
                  <Bar dataKey="total" fill="#c7d2fe" radius={[4, 4, 0, 0]} name="Tổng" />
                  <Bar dataKey="done" fill="#6366f1" radius={[4, 4, 0, 0]} name="Hoàn thành" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-text-tertiary">Chưa có dự án nào</div>
          )}
        </Card>
      </div>

      <Card title="Hoạt động đang triển khai">
        <div className="flex flex-col gap-3 mt-1">
          {activities.filter(a => a.status === 'Đang thực hiện').slice(0, 5).map(a => (
            <div key={a.id} className="p-3.5 border border-border rounded-lg bg-surface-secondary flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-text-primary">{a.name}</span>
                <span className="text-xs text-text-tertiary">{getProjectName(a.projectId)}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <span>{a.assignee}</span>
                <span className="font-medium">{a.deadline}</span>
              </div>
            </div>
          ))}
          {activities.filter(a => a.status === 'Đang thực hiện').length === 0 && (
            <div className="text-center text-sm text-text-tertiary py-8">Không có hoạt động nào đang triển khai</div>
          )}
        </div>
      </Card>
    </div>
  );
}
