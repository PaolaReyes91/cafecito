import { Printer } from 'lucide-react';
import './SaleTicket.css';

export default function SaleTicket({ sale, onNewSale }) {
  const folio = sale.ticket?.saleId?.slice(-6) || sale.id?.slice(-6);

  const handleCopyFolio = async () => {
    try {
      await navigator.clipboard.writeText(folio);
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="sale-ticket-overlay" onClick={onNewSale}>
      <div className="sale-ticket-card" onClick={(e) => e.stopPropagation()}>
        <h2>✓ Venta Registrada</h2>

        <div className="ticket-folio">
          <span className="folio-label">Folio</span>
          <span className="folio-value" onClick={handleCopyFolio} title="Copiar folio">
            {folio}
            <span className="folio-copy-hint">Copiar</span>
          </span>
        </div>

        <div className="ticket-items">
          <h3>Productos</h3>
          {sale.items?.map((item, i) => (
            <div key={i} className="ticket-item">
              <span className="ticket-item-qty">{item.quantity}x</span>
              <span className="ticket-item-name">{item.productName}</span>
              <span className="ticket-item-price">${item.lineTotal?.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="ticket-divider" />

        <div className="ticket-totals">
          <div className="ticket-total-row">
            <span>Subtotal</span>
            <span>${sale.subtotal?.toFixed(2)}</span>
          </div>
          {sale.discount && sale.discount.amount > 0 && (
            <div className="ticket-total-row ticket-discount">
              <span>Descuento ({Math.round(sale.discount.percentage * 100)}%)</span>
              <span>-${sale.discount.amount.toFixed(2)}</span>
            </div>
          )}
          <div className="ticket-total-row ticket-grand-total">
            <span>Total</span>
            <span>${sale.total?.toFixed(2)}</span>
          </div>
        </div>

        <div className="ticket-actions">
          <button className="btn-ticket-secondary" onClick={handlePrint}>
            <Printer size={16} />
            Imprimir Ticket
          </button>
          <button className="btn-ticket-primary" onClick={onNewSale}>
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
}
