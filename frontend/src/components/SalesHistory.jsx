import { useState, useEffect, useCallback } from 'react';
import { getSales, getSaleById } from '../services/saleService';
import './SalesHistory.css';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSales({ page, limit });
      setSales(res.data);
      setTotal(res.total);
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handleSelectSale = async (id) => {
    setDetailLoading(true);
    setDetailError('');
    setSelectedSale(null);
    try {
      const res = await getSaleById(id);
      setSelectedSale(res);
    } catch (err) {
      if (err.response?.status === 404) {
        setDetailError('Venta no encontrada');
      } else {
        setDetailError('Error al obtener detalle');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const discountLabel = (d) => {
    if (!d) return '0%';
    const pct = Math.round(d.percentage * 100);
    return `${pct}% (-$${d.amount.toFixed(2)})`;
  };

  return (
    <div className="sales-history">
      <h2>Historial de Ventas</h2>
      {loading && <div className="loading">Cargando...</div>}
      {error && <div className="error-msg">{error}</div>}
      {!loading && !error && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Descuento</th>
                <th>Método</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={6} className="empty">No hay ventas</td></tr>
              ) : sales.map((s) => (
                <tr key={s.id} className="clickable" onClick={() => handleSelectSale(s.id)}>
                  <td className="sale-id">{s.id.slice(-6)}</td>
                  <td>{s.customerName || '—'}</td>
                  <td>${s.total?.toFixed(2)}</td>
                  <td>{discountLabel(s.discount)}</td>
                  <td>{s.paymentMethod}</td>
                  <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</td>
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

      {detailLoading && <div className="loading">Cargando detalle...</div>}
      {detailError && <div className="error-msg">{detailError}</div>}
      {selectedSale && (
        <div className="sale-detail">
          <h3>Detalle de Venta</h3>
          <button className="close-detail" onClick={() => setSelectedSale(null)}>Cerrar</button>
          <div className="detail-grid">
            <div><strong>ID:</strong> {selectedSale.id}</div>
            <div><strong>Cliente:</strong> {selectedSale.customerName || '—'}</div>
            <div><strong>Total:</strong> ${selectedSale.total?.toFixed(2)}</div>
            <div><strong>Descuento:</strong> {discountLabel(selectedSale.discount)}</div>
            <div><strong>Método:</strong> {selectedSale.paymentMethod}</div>
            <div><strong>Fecha:</strong> {selectedSale.createdAt ? new Date(selectedSale.createdAt).toLocaleString() : ''}</div>
          </div>
          <h4>Artículos</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedSale.items?.map((item, i) => (
                <tr key={i}>
                  <td>{item.productName || item.productId}</td>
                  <td>{item.quantity}</td>
                  <td>${item.unitPrice?.toFixed(2)}</td>
                  <td>${item.lineTotal?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedSale.ticket && (
            <div className="ticket-info">
              <h4>Ticket</h4>
              <p><strong>Folio:</strong> {selectedSale.ticket.saleId?.slice(-6) || selectedSale.id?.slice(-6)}</p>
              {selectedSale.ticket.timestamp && (
                <p><strong>Emitido:</strong> {new Date(selectedSale.ticket.timestamp).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
