import { Card } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import { getDeadlineIndicator } from '../data/mockData';
import { BarChart3, CheckCircle, Clock, AlertTriangle, ListTodo } from 'lucide-react';

export function Dashboard() {
  const { activities, projects } = useData();
  
  const total = activities.length;
  const completed = activities.filter(a => a.status === 'Hoàn thành' || a.status === 'Kết thúc').length;
  const inProgress = activities.filter(a => a.status === 'Đang thực hiện').length;
  
  const today = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const overdue = activities.filter(a => getDeadlineIndicator(a).isOverdue).length;
  const dueSoon = activities.filter(a => a.deadline && a.deadline >= today && a.deadline <= threeDaysLater && a.status !== 'Hoàn thành' && a.status !== 'Kết thúc').length;

  const stats = [
    { label: 'Tổng số hoạt động', value: total, icon: <ListTodo size={24} />, color: 'text-primary-color' },
    { label: 'Hoạt động sắp đến hạn', value: dueSoon, icon: <Clock size={24} />, color: 'text-warning-color' },
    { label: 'Đang thực hiện', value: inProgress, icon: <AlertTriangle size={24} />, color: 'text-indigo-400' },
    { label: 'Hoạt động quá hạn', value: overdue, icon: <AlertTriangle size={24} />, color: 'text-danger-color' },
    { label: 'Hoạt động đã hoàn thành', value: completed, icon: <CheckCircle size={24} />, color: 'text-success-color' },
  ];

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-secondary">Tổng quan các hoạt động truyền thông nội bộ</p>
        </div>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <Card key={i} className="flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-secondary">{stat.label}</h3>
              <div className={`p-2 rounded-lg bg-opacity-10 bg-white ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <Card title="Tiến độ dự án">
          <div className="flex items-center justify-center h-64 text-secondary flex-col gap-4">
            <BarChart3 size={48} className="opacity-50" />
            <p>Biểu đồ thống kê sẽ hiển thị ở đây (Cần tích hợp thư viện Chart)</p>
          </div>
        </Card>
        
        <Card title="Hoạt động đang triển khai (Top)">
          <div className="flex-col gap-4 mt-2">
            {activities.filter(a => a.status === 'Đang thực hiện').slice(0, 5).map(a => (
              <div key={a.id} className="p-3 border border-gray-700 rounded-lg bg-black bg-opacity-20 flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{a.name}</span>
                  <span className="text-xs px-2 py-1 bg-indigo-500 bg-opacity-20 text-indigo-400 rounded-full">{getProjectName(a.projectId)}</span>
                </div>
                <div className="flex justify-between text-xs text-secondary">
                  <span>Assignee: {a.assignee}</span>
                  <span>Deadline: {a.deadline}</span>
                </div>
              </div>
            ))}
            {activities.filter(a => a.status === 'Đang thực hiện').length === 0 && (
              <div className="text-center text-secondary text-sm py-4">Không có hoạt động nào đang triển khai</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
