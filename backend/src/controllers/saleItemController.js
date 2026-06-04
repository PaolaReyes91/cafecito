import SaleItem from '../models/SaleItem.js';

export const createSaleItem = async (req, res) => {
  try {
    const saleItem = await SaleItem.create(req.body);
    res.status(201).json(saleItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getItemsBySaleId = async (req, res) => {
  try {
    const items = await SaleItem.find({ saleId: req.params.saleId })
      .populate('productId', 'name price');
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSaleItem = async (req, res) => {
  try {
    const saleItem = await SaleItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!saleItem) return res.status(404).json({ error: 'Sale item not found' });
    res.json(saleItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSaleItem = async (req, res) => {
  try {
    const saleItem = await SaleItem.findByIdAndDelete(req.params.id);
    if (!saleItem) return res.status(404).json({ error: 'Sale item not found' });
    res.json({ message: 'Sale item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
