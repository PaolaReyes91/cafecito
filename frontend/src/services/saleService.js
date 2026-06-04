import api from './api';

export const getSales = (params) =>
  api.get('/sales', { params }).then((res) => res.data);

export const getSaleById = (id) =>
  api.get(`/sales/${id}`).then((res) => res.data);

export const createSale = (data) =>
  api.post('/sales', data).then((res) => res.data);
