import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Bot, Workflow, BookOpen } from 'lucide-react';
import './Layout.css';

export function Sidebar() {
  const links = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/activities', icon: <ListTodo size={20} />, label: 'Hoạt động' },
    { to: '/ai-assistant', icon: <Bot size={20} />, label: 'AI Assistant' },
    { to: '/workflow', icon: <Workflow size={20} />, label: 'Workflow' },
    { to: '/library', icon: <BookOpen size={20} />, label: 'Thư viện' },
  ];

  return (
    <aside className="sidebar glass">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">EX</div>
          <h2>Hub</h2>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
