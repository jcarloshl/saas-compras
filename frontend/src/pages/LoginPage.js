import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';


export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        if (!form.username.trim()) {
          setError('El nombre es requerido');
          return;
        }
        await register(form.email, form.password, form.username);
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al procesar la solicitud';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-card card">
        <div className="card-body">
          {/* Logo / Header */}
          <div className="text-center mb-4">
            <div style={{ fontSize: '2.5rem' }}>🛒</div>
            <h4 className="fw-bold mt-2">Lista de Compras</h4>
            <p className="text-muted small">Tu lista familiar siempre al día</p>
          </div>

          {/* Tabs */}
          <ul className="nav nav-pills nav-fill mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${!isRegister ? 'active' : ''}`}
                onClick={() => { setIsRegister(false); setError(''); }}
              >
                Iniciar sesión
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${isRegister ? 'active' : ''}`}
                onClick={() => { setIsRegister(true); setError(''); }}
              >
                Registrarse
              </button>
            </li>
          </ul>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="mb-3">
                <label className="form-label small fw-semibold">Nombre</label>
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  placeholder="Tu nombre"
                  value={form.username}
                  onChange={handleChange}
                  required={isRegister}
                />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label small fw-semibold mb-0">Contraseña</label>
                {!isRegister && (
                  <Link to="/forgot-password" className="small text-muted">
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
              <input
                type="password"
                name="password"
                className="form-control mt-1"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 mt-1"
              disabled={loading}
            >
              {loading
                ? <span className="spinner-border spinner-border-sm me-2" />
                : null}
              {isRegister ? 'Crear cuenta' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
