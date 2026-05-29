import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, CupSoda, Leaf } from 'lucide-react';
import { getProducts } from '../services/productService';
import './DigitalMenu.css';

const productIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('té') || lower.includes('te') || lower.includes('tea')) return Leaf;
  if (lower.includes('frap') || lower.includes('frapp')) return CupSoda;
  return Coffee;
};

export default function DigitalMenu() {
  const navigate = useNavigate();
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

  return (
    <div className="menu-container">
      <header className="menu-header">
        <button className="menu-back-btn" onClick={() => navigate('/pos')}>
          ← Volver al POS
        </button>
        <h1>Cafecito</h1>
        <p>Menú Digital</p>
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
