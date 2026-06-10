import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { getCustomers, getCustomerById, createCustomer } from '../services/customerService';
import { createSale } from '../services/saleService';
import { useCart } from '../contexts/CartContext';
import SaleTicket from './SaleTicket';
import './POS.css';

const ID_REGEX = /^[a-f0-9]{24}$/i;

export default function POS() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saleResult, setSaleResult] = useState(null);
  const [saleError, setSaleError] = useState('');
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerContact, setNewCustomerContact] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [createCustomerError, setCreateCustomerError] = useState('');
  const debounceRef = useRef(null);

  const navigate = useNavigate();
  const { 
    items, 
    customer, 
    paymentMethod, 
    total, 
    addItem, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    setCustomer, 
    setPaymentMethod 
  } = useCart();

  useEffect(() => {
    setProductsLoading(true);
    getProducts({ limit: 100 })
      .then((res) => setProducts(res.data))
      .catch(() => setProductsError('Error al cargar productos'))
      .finally(() => setProductsLoading(false));
  }, []);

  const doSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); return; }

    setSearching(true);
    const combined = [];

    if (ID_REGEX.test(trimmed)) {
      try {
        const byId = await getCustomerById(trimmed);
        if (byId) combined.push({ ...byId, _matchType: 'id' });
      } catch {}
    }

    try {
      const byName = await getCustomers({ q: trimmed, limit: 10 });
      if (byName.data) {
        byName.data.forEach((c) => {
          if (!combined.find((x) => x.id === c.id)) {
            combined.push({ ...c, _matchType: 'name' });
          }
        });
      }
    } catch {}

    setResults(combined);
    setSearching(false);
  }, []);

  const handleSearchChange = (value) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const selectCustomer = (c) => {
    setCustomer(c);
    setSearch(c.name);
    setResults([]);
  };

  const clearCustomer = () => {
    setCustomer(null);
    setSearch('');
    setResults([]);
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    setSaleError('');
    setSaleResult(null);
    try {
      const payload = {
        customerId: customer?.id || undefined,
        paymentMethod,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };
      const res = await createSale(payload);
      clearCart();
      clearCustomer();
      setSaleResult(res);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Error al procesar venta';
      setSaleError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSale = () => {
    setSubmitting(false);
    setSaleResult(null);
    setSaleError('');
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerContact.trim()) {
      setCreateCustomerError('Nombre y teléfono/email son requeridos');
      return;
    }
    setCreatingCustomer(true);
    setCreateCustomerError('');
    try {
      const res = await createCustomer({ name: newCustomerName.trim(), phoneOrEmail: newCustomerContact.trim() });
      setCustomer(res);
      setSearch(res.name);
      setShowCreateCustomer(false);
      setNewCustomerName('');
      setNewCustomerContact('');
    } catch (err) {
      setCreateCustomerError(err.response?.data?.error || 'Error al crear cliente');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleAddItem = (product) => {
    if (product.stock > 0) addItem(product);
  };

  const handleIncrease = (productId, currentQuantity) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecrease = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const handleRemove = (productId) => {
    removeItem(productId);
  };

  // 1. Cálculo dinámico del subtotal bruto
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // 2. Determinar el porcentaje de descuento según las reglas de fidelización (US-06)
  const getDiscountPercentage = (purchasesCount) => {
    if (!purchasesCount || purchasesCount <= 0) return 0;
    if (purchasesCount >= 1 && purchasesCount <= 3) return 0.05; // 5% de descuento
    if (purchasesCount >= 4 && purchasesCount <= 7) return 10;   // 10% de descuento (ajusta las fronteras según tu backend)
    if (purchasesCount >= 8) return 0.15;                        // 15% de descuento
    return 0;
  };

  // 3. Calcular el monto real del descuento si hay un cliente seleccionado
  const discountPercent = customer ? getDiscountPercentage(customer.purchasesCount) : 0;
  const discountAmount = subtotal * discountPercent;

  // 4. Calcular el Total Neto definitivo que se mostrará y cobrará
  const finalTotal = subtotal - discountAmount;
  return (
    <div className="pos-layout">
      <div className="pos-header-bar">
        <h2>Punto de Venta</h2>
        <button onClick={() => navigate('/menu')} className="btn-menu-link">Menú Digital</button>
      </div>
      <div className="pos-body">
        <div className="pos-products">
          <h2>Productos</h2>
          {productsLoading && <div className="loading">Cargando productos...</div>}
          {productsError && <div className="error-msg">{productsError}</div>}
          {!productsLoading && !productsError && (
            <div className="product-grid">
              {products.map((p) => (
                <div
                  key={p.id}
                  className={`product-card ${p.stock === 0 ? 'out-of-stock' : ''}`}
                  onClick={() => handleAddItem(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAddItem(p); }}
                >
                  <div className="product-card-body">
                    <h3>{p.name}</h3>
                    <p className="product-price">${p.price.toFixed(2)}</p>
                    <span className={`stock-badge ${p.stock <= 5 ? 'low' : ''}`}>
                      {p.stock === 0 ? 'Agotado' : `${p.stock} disp.`}
                    </span>
                  </div>
                  <span className={`btn-add-indicator ${p.stock === 0 ? 'disabled' : ''}`}>+</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pos-cart">
          <h2>Carrito</h2>
          {items.length === 0 ? (
            <p className="cart-empty">Selecciona productos</p>
          ) : (
            <>
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="cart-item-controls">
                      <div className="cart-qty-group">
                        <button onClick={() => handleDecrease(item.productId, item.quantity)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleIncrease(item.productId, item.quantity)}>+</button>
                      </div>
                      <button className="btn-remove" onClick={() => handleRemove(item.productId)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-customer">
                <h3>Cliente</h3>
                <input
                  placeholder="Buscar cliente (Nombre, ID o Teléfono)..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searching && <span className="searching">Buscando...</span>}
                {results.length > 0 && (
                  <ul className="customer-suggestions">
                    {results.map((c) => (
                      <li key={c.id} onClick={() => selectCustomer(c)}>
                        {c.name} — {c.phoneOrEmail}
                      </li>
                    ))}
                  </ul>
                )}
                {customer && (
                  <div className="selected-customer">
                    Cliente: {customer.name}
                    <button className="btn-clear" onClick={clearCustomer}>×</button>
                  </div>
                )}
                {!customer && (
                  <button className="btn-link" onClick={() => setShowCreateCustomer(true)}>+ Nuevo Cliente</button>
                )}
              </div>

              {showCreateCustomer && (
                <div className="modal-overlay" onClick={() => setShowCreateCustomer(false)}>
                  <div className="modal-content pos-modal" onClick={(e) => e.stopPropagation()}>
                    <h3>Nuevo Cliente</h3>
                    {createCustomerError && <div className="modal-error">{createCustomerError}</div>}
                    <form onSubmit={handleCreateCustomer}>
                      <label>
                        Nombre
                        <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} required />
                      </label>
                      <label>
                        Teléfono o Email
                        <input value={newCustomerContact} onChange={(e) => setNewCustomerContact(e.target.value)} required />
                      </label>
                      <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => setShowCreateCustomer(false)}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={creatingCustomer}>
                          {creatingCustomer ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="cart-payment">
                <h3>Método de pago</h3>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>

             {/* Reemplaza la sección correspondiente en tu POS.jsx */}
              <div className="cart-summary-totals">
                <div className="summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
  
              {customer && (
                <div className="summary-row discount-text">
                <span>Descuento de Fidelización</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
              )}

              <div className="cart-total">
                <span>Total</span>
                <span className="total-amount">${total.toFixed(2)}</span>
              </div>
            </div>

              {saleError && <div className="error-msg">{saleError}</div>}
              <button
                className="btn-checkout"
                disabled={items.length === 0 || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Procesando...' : 'Finalizar Orden'}
              </button>
            </>
          )}
        </div>
      </div>
      {saleResult && (
        <SaleTicket sale={saleResult} onNewSale={handleNewSale} />
      )}
    </div>
  );
}
