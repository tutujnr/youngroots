/**
 * YoungRoots — App Router
 */
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import Layout from './components/layout/Layout';

// Pages (lazy-loaded for performance on low-bandwidth)
import { lazy, Suspense } from 'react';
const Home          = lazy(() => import('./pages/Home'));
const Login         = lazy(() => import('./pages/Login'));
const ServiceLocator= lazy(() => import('./pages/ServiceLocator'));
const AIAssistant   = lazy(() => import('./pages/AIAssistant'));
const ReportForm    = lazy(() => import('./pages/ReportForm'));
const CaseTracker   = lazy(() => import('./pages/CaseTracker'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const AdminPanel    = lazy(() => import('./pages/AdminPanel'));
const NotFound      = lazy(() => import('./pages/NotFound'));

// Route guards
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAnonymous } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const LoadingScreen = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif', color:'#1D9E75' }}>
    Loading YoungRoots...
  </div>
);

export default function App() {
  const { user, startAnonymousSession } = useAuthStore();

  // Auto-start anonymous session on first visit
  useEffect(() => {
    if (!user && !localStorage.getItem('anon_token') && !localStorage.getItem('access_token')) {
      startAnonymousSession();
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index                         element={<Home />} />
            <Route path="login"                  element={<Login />} />
            <Route path="services"               element={<ServiceLocator />} />
            <Route path="ai-guide"               element={<AIAssistant />} />
            <Route path="report"                 element={<ReportForm />} />
            <Route path="cases"                  element={<CaseTracker />} />
            <Route path="cases/:caseId"          element={<CaseTracker />} />

            <Route path="dashboard" element={
              <ProtectedRoute roles={['advocate', 'admin', 'super_admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="admin/*" element={
              <ProtectedRoute roles={['admin', 'super_admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
