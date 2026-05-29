import Ticket from '../models/Ticket.js';
import Sale from '../models/Sale.js';
import SaleItem from '../models/SaleItem.js';

export const generateTicket = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.saleId);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found', id: req.params.saleId });
    }

    const existing = await Ticket.findOne({ saleId: sale._id });
    if (existing) {
      return res.json(formatTicketResponse(existing));
    }

    const items = await SaleItem.find({ saleId: sale._id })
      .populate('productId', 'name');

    const ticketItems = items.map((item) => ({
      name: item.productNameSnapshot || item.productId?.name || 'Unknown',
      qty: item.quantity,
      unitPrice: item.unitPriceSnapshot || 0,
      lineTotal: item.lineTotal || 0,
    }));

    const ticket = await Ticket.create({
      saleId: sale._id,
      date: sale.createdAt,
      items: ticketItems,
      subtotal: sale.subtotal,
      discountPercent: sale.discountPercent,
      discountAmount: sale.discountAmount,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
    });

    res.status(201).json(formatTicketResponse(ticket));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTicketBySaleId = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ saleId: req.params.saleId });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found', id: req.params.saleId });
    }
    res.json(formatTicketResponse(ticket));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets.map(formatTicketResponse));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function formatTicketResponse(ticket) {
  return {
    sale_id: ticket.saleId,
    timestamp: ticket.date || ticket.createdAt,
    store_name: ticket.storeName || 'Cafecito Feliz',
    items: (ticket.items || []).map((i) => ({
      name: i.name,
      qty: i.qty || i.quantity,
      unit_price: i.unitPrice || i.price,
      line_total: i.total || i.lineTotal,
    })),
    subtotal: ticket.subtotal,
    discount: `${ticket.discountPercent}% (-$${(ticket.discountAmount || 0).toFixed(2)})`,
    total: ticket.total,
    payment_method: ticket.paymentMethod,
  };
}
