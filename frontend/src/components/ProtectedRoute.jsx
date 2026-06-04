import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to={user.role === 'admin' ? '/admin/products' : '/pos'} replace />;
  }

  return children;
}
