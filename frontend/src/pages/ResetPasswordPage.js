import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';
import { T, Spinner } from '../theme';

const inp = {
  width: '100%', background: T.paper, borderRadius: 12,
  padding: '14px 16px', fontSize: 15, color: T.ink,
  boxShadow: T.elev, border: 'none', fontFamily: T.sans,
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const wrap = {
    minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink,
    display: 'flex', flexDirection: 'column',
    padding: '60px 24px 40px', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box',
  };

  if (!token) {
    return (
      <div style={wrap}>
        <div style={{ marginTop: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 28, letterSpacing: -0.5 }}>Enlace inválido</h2>
          <p style={{ margin: '10px 0 0', fontSize: 14.5, color: T.muted, lineHeight: 1.5 }}>
            Este enlace de recuperación no es válido o ha expirado.
          </p>
          <Link to="/forgot-password" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 28, height: 52, borderRadius: 14, background: T.primary, color: '#fff',
            fontFamily: T.sans, fontSize: 15, fontWeight: 600,
          }}>Solicitar nuevo enlace</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
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
    <div style={wrap}>
      <div>
        <Link to="/login" style={{
          width: 40, height: 40, borderRadius: 12, background: T.paper,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev,
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke={T.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: '#FBEFE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🔐</div>
        <h1 style={{ margin: '24px 0 0', fontFamily: T.serif, fontWeight: 500, fontSize: 32, letterSpacing: -0.6 }}>Nueva contraseña</h1>
        <p style={{ margin: '10px 0 0', fontSize: 14.5, color: T.muted }}>Elegí una contraseña segura para tu cuenta.</p>
      </div>

      {success ? (
        <div style={{ marginTop: 28 }}>
          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: 14, padding: '16px 18px', fontSize: 14, lineHeight: 1.5 }}>
            <strong>Contraseña actualizada ✓</strong><br/>Ya podés iniciar sesión con tu nueva contraseña. Redirigiendo…
          </div>
          <Link to="/login" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 14, height: 52, borderRadius: 14, background: T.primary, color: '#fff',
            fontFamily: T.sans, fontSize: 15, fontWeight: 600,
          }}>Ir al inicio de sesión</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Nueva contraseña</label>
            <input type="password" style={inp} placeholder="••••••••" value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }} required minLength={6} autoFocus/>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Confirmar contraseña</label>
            <input type="password" style={inp} placeholder="••••••••" value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }} required minLength={6}/>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13.5 }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            height: 52, borderRadius: 14, background: T.primary, color: '#fff',
            fontFamily: T.sans, fontSize: 15, fontWeight: 600,
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading && <Spinner size={18} color="#fff"/>}
            Guardar nueva contraseña
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>Volver al inicio de sesión</Link>
          </div>
        </form>
      )}
    </div>
  );
}
