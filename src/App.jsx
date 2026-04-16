import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { getMe } from './store/slices/authSlice';
import { fetchSettings } from './store/slices/settingSlice';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import TimetablePage from './pages/Timetable';
import Messages from './pages/Messages';
import TeacherPayments from './pages/TeacherPayments';
import Fees from './pages/Fees';
import Setup from './pages/Setup';


import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import GlobalLoader from './components/GlobalLoader';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const { school } = useSelector((state) => state.settings);

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchSettings());
    }
  }, [isAuthenticated, dispatch]);

  // Update Favicon and Title dynamically
  useEffect(() => {
    if (school) {
      if (school.name) {
        document.title = school.name;
      }
      if (school.logo) {
        const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'icon';
        link.href = school.logo;
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    }
  }, [school]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <GlobalLoader />
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#101831',
            color: '#ffffff',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="fees" element={<Fees />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="messages" element={<Messages />} />
          <Route path="teacher-payments" element={<TeacherPayments />} />
          <Route path="setup" element={<Setup />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
