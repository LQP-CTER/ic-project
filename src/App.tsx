import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Activities } from './pages/Activities';
import { AIStudio } from './pages/AIStudio';
import { WorkflowAssistant } from './pages/WorkflowAssistant';
import { ContentLibrary } from './pages/ContentLibrary';
import { UsersPage } from './pages/Users';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <LoginPage />;
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="activities" element={<Activities />} />
          <Route path="ai-assistant" element={<AIStudio />} />
          <Route path="workflow" element={<WorkflowAssistant />} />
          <Route path="library" element={<ContentLibrary />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="ai" element={<Navigate to="/ai-assistant" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
