import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { T, Spinner } from '../theme';

const inp = {
  width: '100%', background: T.paper, borderRadius: 12,
  padding: '14px 16px', fontSize: 15, color: T.ink,
  boxShadow: T.elev, border: 'none', fontFamily: T.sans,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isRegister) {
        if (!form.username.trim()) { setError('El nombre es requerido'); return; }
        await register(form.email, form.password, form.username);
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const tab = isRegister ? 'register' : 'login';

  return (
    <div style={{
      minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink,
      display: 'flex', flexDirection: 'column',
      padding: '60px 24px 40px', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box',
    }}>
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <div style={{
          width: 60, height: 60, borderRadius: 18, background: T.primary,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: T.serif, fontWeight: 500, fontSize: 38, lineHeight: 1,
        }}>c</div>
        <h1 style={{ margin: '20px 0 4px', fontFamily: T.serif, fontWeight: 500, fontSize: 32, letterSpacing: -0.6 }}>
          Lista de Compras
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: T.muted }}>Tu lista familiar siempre al día</p>
      </div>

      <div style={{ marginTop: 40, padding: 4, background: '#F1E5D2', borderRadius: 14, display: 'flex' }}>
        {[{ k: 'login', label: 'Iniciar sesión' }, { k: 'register', label: 'Registrarse' }].map(o => (
          <button key={o.k} onClick={() => { setIsRegister(o.k === 'register'); setError(''); }} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, textAlign: 'center',
            background: tab === o.k ? T.paper : 'transparent',
            color: tab === o.k ? T.ink : T.muted,
            fontSize: 13.5, fontWeight: 600,
            boxShadow: tab === o.k ? T.elev : 'none',
            transition: 'background .15s', fontFamily: T.sans,
          }}>{o.label}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isRegister && (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Nombre</label>
            <input type="text" name="username" style={inp} placeholder="Tu nombre" value={form.username} onChange={handleChange} required={isRegister}/>
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Email</label>
          <input type="email" name="email" style={inp} placeholder="correo@ejemplo.com" value={form.email} onChange={handleChange} required/>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Contraseña</label>
            {!isRegister && (
              <Link to="/forgot-password" style={{ fontSize: 12, color: T.primary, fontWeight: 600 }}>
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>
          <input type="password" name="password" style={inp} placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6}/>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13.5 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          marginTop: 8, height: 52, borderRadius: 14,
          background: T.primary, color: '#fff',
          fontFamily: T.sans, fontSize: 15, fontWeight: 600, letterSpacing: 0.1,
          opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {loading && <Spinner size={18} color="#fff"/>}
          {isRegister ? 'Crear cuenta' : 'Entrar'}
        </button>
      </form>

      <div style={{ flex: 1 }}/>
      <div style={{ textAlign: 'center', fontSize: 11.5, color: T.muted, marginTop: 24 }}>
        Al continuar aceptás los <strong style={{ color: T.ink }}>Términos</strong> y la <strong style={{ color: T.ink }}>Privacidad</strong>
      </div>
    </div>
  );
}
