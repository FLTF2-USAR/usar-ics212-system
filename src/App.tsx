import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginScreen } from './components/LoginScreen';
import { InspectionWizard } from './components/InspectionWizard';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  return (
    <BrowserRouter basename="/mbfd-checkout-system">
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/inspection" element={<InspectionWizard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
