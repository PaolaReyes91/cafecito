import { useState, useEffect, useCallback } from 'react';
import { getCustomers, createCustomer } from '../services/customerService';
import './CustomerList.css';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createContact, setCreateContact] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (search.trim()) params.q = search.trim();
      const res = await getCustomers(params);
      setCustomers(res.data);
      setTotal(res.total);
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName.trim() || !createContact.trim()) {
      setCreateError('Nombre y teléfono/email son requeridos');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      await createCustomer({ name: createName.trim(), phoneOrEmail: createContact.trim() });
      setShowCreate(false);
      setCreateName('');
      setCreateContact('');
      setPage(1);
      await fetchCustomers();
    } catch (err) {
      // Optimización: Extraer el mensaje específico del backend (ej: "Name must be at least 2 characters")
      const backendError = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Error al crear cliente';
      setCreateError(backendError);
    } finally {
      setCreateLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="customer-list">
      <div className="list-header">
        <h2>Clientes</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Nuevo Cliente</button>
      </div>

      <input
        className="search-input"
        placeholder="Buscar clientes por nombre o correo..."
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
                <th>Teléfono / Email</th>
                <th>Compras</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={3} className="empty">No hay clientes</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id || c._id}>
                  <td>{c.name}</td>
                  <td>{c.phoneOrEmail}</td>
                  <td>{c.purchasesCount ?? 0}</td>
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

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo Cliente</h3>
            {createError && <div className="modal-error">{createError}</div>}
            <form onSubmit={handleCreate}>
              <label>
                Nombre
                <input value={createName} onChange={(e) => setCreateName(e.target.value)} required />
              </label>
              <label>
                Teléfono o Email
                <input value={createContact} onChange={(e) => setCreateContact(e.target.value)} required />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={createLoading}>
                  {createLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}