import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import { T, Spinner } from '../theme';

const inp = {
  width: '100%', background: T.paper, borderRadius: 12,
  padding: '14px 16px', fontSize: 15, color: T.ink,
  boxShadow: T.elev, border: 'none', fontFamily: T.sans,
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
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
    <div style={{
      minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink,
      display: 'flex', flexDirection: 'column',
      padding: '60px 24px 40px', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box',
    }}>
      <div>
        <Link to="/login" style={{
          width: 40, height: 40, borderRadius: 12, background: T.paper,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev,
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke={T.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: '#FBEFE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🔑</div>
        <h1 style={{ margin: '24px 0 0', fontFamily: T.serif, fontWeight: 500, fontSize: 32, letterSpacing: -0.6, lineHeight: 1.1 }}>
          Recuperá el acceso<br/>a tu cesta
        </h1>
        <p style={{ margin: '12px 0 0', fontSize: 14.5, color: T.muted, lineHeight: 1.5 }}>
          Te enviamos un enlace al correo para restablecer la contraseña.
        </p>
      </div>

      {sent ? (
        <div style={{ marginTop: 28 }}>
          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: 14, padding: '16px 18px', fontSize: 14, lineHeight: 1.5 }}>
            <strong>Email enviado ✓</strong><br/>
            Si tu email está registrado, recibirás un enlace. Revisá también la carpeta de spam.
          </div>
          <Link to="/login" style={{
            marginTop: 14, height: 52, borderRadius: 14,
            background: T.primary, color: '#fff',
            fontFamily: T.sans, fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>Volver al inicio de sesión</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Email de la cuenta</label>
            <input type="email" style={inp} placeholder="correo@ejemplo.com" value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }} required autoFocus/>
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
            Enviar enlace de recuperación
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>Volver al inicio de sesión</Link>
          </div>
        </form>
      )}

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '14px 16px', borderRadius: 14, background: T.paperHi, fontSize: 12.5, color: T.muted, lineHeight: 1.5, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <div>El enlace caduca en <strong style={{ color: T.ink }}>1 hora</strong>. Si cambiás la contraseña antes de usarlo, el enlace dejará de funcionar.</div>
      </div>
    </div>
  );
}
