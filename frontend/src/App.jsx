import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Dashboard from './pages/dashboard/Dashboard';
import CabinetsList from './pages/cabinets/CabinetsList';
import CabinetDetail from './pages/cabinets/CabinetDetail';
import MyQuotes from './pages/quotes/MyQuotes';
import ReceivedQuotes from './pages/quotes/ReceivedQuotes';
import QuoteDetail from './pages/quotes/QuoteDetail';
import Profile from './pages/profile/Profile';
import Layout from './components/layout/Layout';

function QuotesRoute() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user?.role === 'cabinet' ? <ReceivedQuotes /> : <MyQuotes />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cabinets" element={<CabinetsList />} />
          <Route path="/cabinets/:id" element={<CabinetDetail />} />
          <Route path="/quotes" element={<QuotesRoute />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
