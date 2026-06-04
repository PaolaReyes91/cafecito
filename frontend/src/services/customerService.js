import api from './api';

export const getCustomers = (params) =>
  api.get('/customers', { params }).then((res) => res.data);

export const getCustomerById = (id) =>
  api.get(`/customers/${id}`).then((res) => res.data);

export const createCustomer = (data) =>
  api.post('/customers', data).then((res) => res.data);
