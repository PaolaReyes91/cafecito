import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, CupSoda, Leaf, LogOut, Cake, Salad, Sandwich } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProducts } from '../services/productService';
import './DigitalMenu.css';

const productIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('pie') || lower.includes('pastel') || lower.includes('torta') || lower.includes('cake')) return Cake;
  if (lower.includes('sandwich') || lower.includes('sándwich') || lower.includes('sanduche')) return Sandwich;
  if (lower.includes('ensalada') || lower.includes('salad')) return Salad;
  if (lower.includes('frap') || lower.includes('frapp')) return CupSoda;
  if (lower.includes('té') || lower.includes('tea')) return Leaf;
  return Coffee;
};

export default function DigitalMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getProducts({ limit: 100 })
      .then((res) => setProducts(res.data))
      .catch(() => setError('Error al cargar el menú'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBackRoute = () => {
    if (user?.role === 'admin') return '/admin/products';
    if (user?.role === 'seller') return '/pos';
    return '/login';
  };

  if (loading) {
    return (
      <div className="menu-container">
        <div className="menu-loading">Cargando menú...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-container">
        <div className="menu-error">{error}</div>
      </div>
    );
  }

  const isCustomer = user?.role === 'customer';

  return (
    <div className="menu-container">
      <header className="menu-header">
        <div className="menu-header-left">
          {!isCustomer && (
            <button className="menu-back-btn" onClick={() => navigate(getBackRoute())}>
              ← Volver
            </button>
          )}
        </div>
        <div className="menu-header-center">
          <h1>Cafecito</h1>
          <p>Menú Digital</p>
        </div>
        <div className="menu-header-right">
          {isCustomer && (
            <button className="menu-logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>
      <div className="menu-grid">
        {products.length === 0 ? (
          <p className="menu-empty">No hay productos disponibles</p>
        ) : products.map((p) => {
          const Icon = productIcon(p.name);
          return (
            <div key={p.id} className="menu-item">
              <div className="menu-item-image">
                <Icon size={48} strokeWidth={1.5} />
              </div>
              <div className="menu-item-body">
                <h3>{p.name}</h3>
                <p className="menu-item-price">${p.price.toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
