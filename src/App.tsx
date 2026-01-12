import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AdminAuth } from './components/admin/AdminAuth';
import { ICS218Auth } from './components/ics218/ICS218Auth';

// Lazy load route components for code splitting
const HomePage = lazy(() => import('./components/HomePage'));
const FormsHub = lazy(() => import('./components/FormsHub'));
const ICS212Form = lazy(() => import('./components/ICS212Form'));
const ICS218Form = lazy(() => import('./components/ics218/ICS218Form'));

// Admin Components
const AdminHub = lazy(() => import('./components/admin/AdminHub').then(m => ({ default: m.AdminHub })));
const ICS212AdminDashboard = lazy(() => import('./components/admin/ICS212AdminDashboard').then(m => ({ default: m.ICS212AdminDashboard })));
const ICS218AdminDashboard = lazy(() => import('./components/admin/ICS218AdminDashboard').then(m => ({ default: m.ICS218AdminDashboard })));
const DocumentManagement = lazy(() => import('./components/admin/DocumentManagement').then(m => ({ default: m.DocumentManagement })));
const FormDetail = lazy(() => import('./components/admin/FormDetail').then(m => ({ default: m.FormDetail })));
const ICS218Detail = lazy(() => import('./components/admin/ICS218Detail').then(m => ({ default: m.ICS218Detail })));

// Wrapper components to extract URL params
function FormDetailWrapper() {
  const { id } = useParams<{ id: string }>();
  return <FormDetail formId={id || ''} />;
}

function ICS218DetailWrapper() {
  const { id } = useParams<{ id: string }>();
  return <ICS218Detail formId={id || ''} />;
}

// Create QueryClient for React Query  
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
      <p className="text-gray-600 font-semibold">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/forms" element={<FormsHub />} />
            <Route path="/form" element={<ICS212Form />} />
            <Route 
              path="/ics218" 
              element={
                <ICS218Auth>
                  <ICS218Form />
                </ICS218Auth>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <AdminAuth>
                  <AdminHub />
                </AdminAuth>
              } 
            />
            <Route 
              path="/admin/ics212" 
              element={
                <AdminAuth>
                  <ICS212AdminDashboard />
                </AdminAuth>
              } 
            />
            <Route 
              path="/admin/ics212/:id" 
              element={
                <AdminAuth>
                  <FormDetailWrapper />
                </AdminAuth>
              } 
            />
            <Route 
              path="/admin/ics218" 
              element={
                <AdminAuth>
                  <ICS218AdminDashboard />
                </AdminAuth>
              } 
            />
            <Route 
              path="/admin/ics218/:id" 
              element={
                <AdminAuth>
                  <ICS218DetailWrapper />
                </AdminAuth>
              } 
            />
            <Route 
              path="/admin/documents" 
              element={
                <AdminAuth>
                  <DocumentManagement />
                </AdminAuth>
              } 
            />
            
            {/* Redirect old routes to new structure */}
            <Route path="/inspection" element={<Navigate to="/form" replace />} />
            <Route path="/ics212" element={<Navigate to="/form" replace />} />
            <Route path="/admin/forms" element={<Navigate to="/admin/ics212" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

export default App;
