import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';
import AppLayout from './components/layout/AppLayout';
import { useAuthStore } from './store/authStore';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LearningCenter = lazy(() => import('./pages/LearningCenter'));
const ResourcePage = lazy(() => import('./pages/ResourcePage'));
const KnowledgeMapPage = lazy(() => import('./pages/KnowledgeMapPage'));
const TutoringPage = lazy(() => import('./pages/TutoringPage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const QuestionBank = lazy(() => import('./pages/QuestionBank'));
const LearningPath = lazy(() => import('./pages/LearningPath'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="Loading..." />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes with AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/learn" element={<LearningCenter />} />
          <Route path="/resource/:id" element={<ResourcePage />} />
          <Route path="/knowledge-map" element={<KnowledgeMapPage />} />
          <Route path="/tutoring" element={<TutoringPage />} />
          <Route path="/tutoring/:sessionId" element={<TutoringPage />} />
          <Route path="/assessments" element={<AssessmentPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/learning-path" element={<LearningPath />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
