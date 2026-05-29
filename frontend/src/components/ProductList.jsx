import { useState, useEffect, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import ProductModal from './ProductModal';
import './ProductList.css';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (search.trim()) params.q = search.trim();
      const res = await getProducts(params);
      setProducts(res.data);
      setTotal(res.total);
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleCreate = async (data) => {
    await createProduct(data);
    setPage(1);
    await fetchProducts();
  };

  const handleUpdate = async (data) => {
    await updateProduct(editingProduct.id, data);
    setEditingProduct(null);
    await fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch {
      setError('Error al eliminar producto');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="product-list">
      <div className="list-header">
        <h2>Productos</h2>
        <button className="btn-primary" onClick={() => { setEditingProduct(null); setModalOpen(true); }}>
          + Nuevo Producto
        </button>
      </div>
      <input
        className="search-input"
        placeholder="Buscar productos..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />
      {loading && <div className="loading">Cargando...</div>}
      {error && <div className="error-msg">{error}</div>}
      {!loading && !error && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={4} className="empty">No hay productos</td></tr>
              ) : products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td className="actions">
                    <button className="btn-edit" onClick={() => { setEditingProduct(p); setModalOpen(true); }}>Editar</button>
                    <button className="btn-delete" onClick={() => handleDelete(p.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</button>
            </div>
          )}
        </>
      )}
      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
          onSave={editingProduct ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
}
