import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import Layout from './components/layout/Layout';

const Home          = lazy(() => import('./pages/Home'));
const Login         = lazy(() => import('./pages/Login'));
const ServiceLocator= lazy(() => import('./pages/ServiceLocator'));
const AIAssistant   = lazy(() => import('./pages/AIAssistant'));
const ReportForm    = lazy(() => import('./pages/ReportForm'));
const CaseTracker   = lazy(() => import('./pages/CaseTracker'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const AdminPanel    = lazy(() => import('./pages/AdminPanel'));
const Notes         = lazy(() => import('./pages/Notes'));
const About         = lazy(() => import('./pages/About'));
const Blog          = lazy(() => import('./pages/Blog'));
const Events        = lazy(() => import('./pages/Events'));
const Contact       = lazy(() => import('./pages/Contact'));
const NotFound      = lazy(() => import('./pages/NotFound'));

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#1D9E75' }}>
    Loading YoungRoots...
  </div>
);

export default function App() {
  const { user, startAnonymousSession } = useAuthStore();

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
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="services" element={<ServiceLocator />} />
            <Route path="ai-guide" element={<AIAssistant />} />
            <Route path="report" element={<ReportForm />} />
            <Route path="cases" element={<CaseTracker />} />
            <Route path="cases/:caseId" element={<CaseTracker />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin" element={<AdminPanel />} />
            {/* New dropdown pages */}
            <Route path="notes" element={<Notes />} />
            <Route path="about" element={<About />} />
            <Route path="blog" element={<Blog />} />
            <Route path="events" element={<Events />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
