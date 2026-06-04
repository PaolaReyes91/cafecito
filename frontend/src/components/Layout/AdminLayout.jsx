import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Cafecito</h2>
        </div>
        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <NavLink to="/pos">Punto de Venta</NavLink>
              <NavLink to="/admin/products">Productos</NavLink>
              <NavLink to="/admin/customers">Clientes</NavLink>
              <NavLink to="/admin/sales">Ventas</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/pos">Punto de Venta</NavLink>
              <NavLink to="/pos/products">Productos</NavLink>
              <NavLink to="/pos/customers">Clientes</NavLink>
              <NavLink to="/pos/sales">Ventas</NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.name}</span>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          {location.pathname !== '/pos' && (
            <button className="admin-header-btn" onClick={() => navigate('/pos')} title="Volver al POS">
              ← Volver al POS
            </button>
          )}
          <button className="admin-logout-btn" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
