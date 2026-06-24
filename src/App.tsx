import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Activities } from './pages/Activities';
import { AIStudio } from './pages/AIStudio';
import { WorkflowAssistant } from './pages/WorkflowAssistant';
import { ContentLibrary } from './pages/ContentLibrary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="activities" element={<Activities />} />
          <Route path="ai-assistant" element={<AIStudio />} />
          <Route path="workflow" element={<WorkflowAssistant />} />
          <Route path="library" element={<ContentLibrary />} />
          <Route path="ai" element={<Navigate to="/ai-assistant" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
