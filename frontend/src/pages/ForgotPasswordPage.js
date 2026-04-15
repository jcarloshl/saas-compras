import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-card card">
        <div className="card-body">
          <div className="text-center mb-4">
            <div style={{ fontSize: '2.5rem' }}>🛒</div>
            <h4 className="fw-bold mt-2">Recuperar contraseña</h4>
            <p className="text-muted small">Te enviaremos un enlace a tu email</p>
          </div>

          {sent ? (
            <div>
              <div className="alert alert-success">
                <strong>Email enviado</strong><br />
                Si tu email está registrado, recibirás un enlace para restablecer
                tu contraseña. Revisa también la carpeta de spam.
              </div>
              <Link to="/login" className="btn btn-outline-primary w-100 mt-2">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  autoFocus
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
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                Enviar enlace de recuperación
              </button>

              <div className="text-center mt-3">
                <Link to="/login" className="text-muted small">
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
