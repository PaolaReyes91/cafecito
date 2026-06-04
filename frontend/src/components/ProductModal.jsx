import { useState, useEffect } from 'react';
import './ProductModal.css';

export default function ProductModal({ product, onClose, onSave }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(String(product.price));
      setStock(String(product.stock));
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) { setError('El precio debe ser mayor a 0'); return; }
    const s = parseInt(stock, 10);
    if (isNaN(s) || s < 0) { setError('El stock no puede ser negativo'); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), price: p, stock: s });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
        {error && <div className="modal-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Precio
            <input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </label>
          <label>
            Stock
            <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
