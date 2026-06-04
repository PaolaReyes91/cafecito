import api from './api';

export const registerCustomer = (name, phoneOrEmail, password) =>
  api.post('/customer/register', { name, phoneOrEmail, password }).then((res) => res.data);

export const loginCustomer = (phoneOrEmail, password) =>
  api.post('/customer/login', { phoneOrEmail, password }).then((res) => res.data);

export const getCustomerProfile = () =>
  api.get('/customer/me').then((res) => res.data);
