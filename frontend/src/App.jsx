import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Login from './components/Login';
import AdminLayout from './components/Layout/AdminLayout';
import ProductList from './components/ProductList';
import CustomerList from './components/CustomerList';
import SalesHistory from './components/SalesHistory';
import POS from './components/POS';
import DigitalMenu from './components/DigitalMenu';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/menu" element={<DigitalMenu />} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="products" replace />} />
              <Route path="products" element={<ProductList />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="sales" element={<SalesHistory />} />
            </Route>
            <Route path="/pos" element={<ProtectedRoute role="seller"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<POS />} />
              <Route path="products" element={<ProductList viewOnly />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="sales" element={<SalesHistory />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
