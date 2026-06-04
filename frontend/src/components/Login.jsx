import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { registerCustomer, loginCustomer } from '../services/customerAuthService';
import './Login.css';

export default function Login() {
  const [tab, setTab] = useState('admin'); // 'admin' | 'customer'
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [customerConfirmPassword, setCustomerConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(adminEmail, adminPassword);
      navigate(data.user.role === 'admin' ? '/admin/products' : '/pos');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (customerPassword !== customerConfirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (customerPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const data = await registerCustomer(customerName, customerPhone, customerPassword);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.customer));
      navigate('/menu');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginCustomer(customerPhone, customerPassword);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.customer));
      navigate('/menu');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-tabs">
        <button
          className={`login-tab ${tab === 'admin' ? 'active' : ''}`}
          onClick={() => {
            setTab('admin');
            setError('');
            setIsRegistering(false);
          }}
        >
          Tienda
        </button>
        <button
          className={`login-tab ${tab === 'customer' ? 'active' : ''}`}
          onClick={() => {
            setTab('customer');
            setError('');
            setIsRegistering(false);
          }}
        >
          Cliente
        </button>
      </div>

      {tab === 'admin' && (
        <form className="login-form" onSubmit={handleAdminSubmit}>
          <h1>Cafecito</h1>
          <h2>Iniciar Sesión - Tienda</h2>
          {error && <div className="login-error">{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      )}

      {tab === 'customer' && (
        <form className="login-form" onSubmit={isRegistering ? handleCustomerRegister : handleCustomerLogin}>
          <h1>Cafecito</h1>
          <h2>{isRegistering ? 'Registrarse' : 'Iniciar Sesión - Cliente'}</h2>
          {error && <div className="login-error">{error}</div>}
          
          {isRegistering ? (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email o teléfono"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={customerPassword}
                onChange={(e) => setCustomerPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={customerConfirmPassword}
                onChange={(e) => setCustomerConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
              <button
                type="button"
                className="login-toggle-btn"
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                  setCustomerName('');
                  setCustomerPassword('');
                  setCustomerConfirmPassword('');
                }}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="Email o teléfono"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={customerPassword}
                onChange={(e) => setCustomerPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
              <button
                type="button"
                className="login-toggle-btn"
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                  setCustomerPhone('');
                  setCustomerPassword('');
                }}
              >
                ¿No tienes cuenta? Regístrate
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
