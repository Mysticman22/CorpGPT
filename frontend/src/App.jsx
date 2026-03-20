import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './layout/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import AdminDashboard from './pages/AdminDashboard';
import AdminPanel from './pages/AdminPanel';
import ChatPage from './pages/ChatPage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import { ToastProvider } from './components/ui/Toast';

function App() {
  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public Routes ── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ── Protected: any authenticated user ── */}
            <Route element={<PrivateRoute />}>

              {/* Dashboard layout shared between employees, dept admins, super admins */}
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="chat" element={<ChatPage />} />

                {/* Admin panel: SUPER_ADMIN + DEPARTMENT_ADMIN */}
                <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'DEPARTMENT_ADMIN']} />}>
                  <Route path="admin" element={<AdminDashboard />} />
                </Route>

                {/* Admin panel operations: SUPER_ADMIN only */}
                <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN']} />}>
                  <Route path="admin/panel/*" element={<AdminPanel />} />
                </Route>
              </Route>

              {/* Chat as full-page (no sidebar) */}
              <Route path="/chat/:conversationId" element={<ChatPage />} />

              {/* Super Admin Console: SUPER_ADMIN only, standalone layout */}
              <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/super-admin" element={<SuperAdminDashboard />} />
              </Route>

            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </div>
  );
}

export default App;
