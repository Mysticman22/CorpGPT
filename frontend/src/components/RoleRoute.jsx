import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * RoleRoute — wraps protected routes that require specific roles.
 * Usage:
 *   <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN']} />}>
 *     <Route path="/admin/panel/*" element={<AdminPanel />} />
 *   </Route>
 */
const RoleRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
