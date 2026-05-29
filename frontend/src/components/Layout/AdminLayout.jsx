import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
          <span className="sidebar-role">{isAdmin ? 'Admin' : 'Vendedor'}</span>
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
              <NavLink to="/pos/customers">Clientes</NavLink>
              <NavLink to="/pos/sales">Ventas</NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.name}</span>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
