import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="container">
        <div className="auth-card card">
          <div className="card-body text-center">
            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
            <h5 className="fw-bold mt-2">Enlace inválido</h5>
            <p className="text-muted small">
              Este enlace de recuperación no es válido o ha expirado.
            </p>
            <Link to="/forgot-password" className="btn btn-primary w-100 mt-2">
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña.');
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
            <h4 className="fw-bold mt-2">Nueva contraseña</h4>
            <p className="text-muted small">Elige una contraseña segura</p>
          </div>

          {success ? (
            <div>
              <div className="alert alert-success">
                <strong>Contraseña actualizada</strong><br />
                Ya puedes iniciar sesión con tu nueva contraseña.
                Redirigiendo...
              </div>
              <Link to="/login" className="btn btn-primary w-100 mt-2">
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Nueva contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Confirmar contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(''); }}
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
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                Guardar nueva contraseña
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
