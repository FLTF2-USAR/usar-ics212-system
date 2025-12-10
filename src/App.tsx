import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load route components for code splitting
const LoginScreen = lazy(() => import('./components/LoginScreen').then(m => ({ default: m.LoginScreen })));
const InspectionWizard = lazy(() => import('./components/InspectionWizard').then(m => ({ default: m.InspectionWizard })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

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
    <BrowserRouter basename="/mbfd-checkout-system">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/inspection" element={<InspectionWizard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
