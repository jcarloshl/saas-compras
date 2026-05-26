import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Ico, Spinner } from '../theme';
import { familyAPI } from '../api';
import BottomTabBar from '../components/BottomTabBar';

const AVATAR_COLORS = ['#C76A4D', '#6B7A4D', '#D9A04A', '#8E5B8C', '#5A8FA8', '#7A6A5C'];
const MEMBER_KEY = 'cesta_member';

function getMemberActive() {
  try { return JSON.parse(localStorage.getItem(MEMBER_KEY)); } catch { return null; }
}

export default function FamilyPage() {
  const { T } = useTheme();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const activeNombre = getMemberActive()?.nombre;

  const fetchMembers = useCallback(async () => {
    try {
      const res = await familyAPI.getAll();
      setMembers(res.data);
    } catch {
      setError('No se pudo cargar los integrantes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const nombre = newName.trim();
    if (!nombre) return;
    setSaving(true);
    try {
      const res = await familyAPI.create(nombre, newColor);
      setMembers(prev => [...prev, res.data]);
      setNewName(''); setShowAddForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar integrante');
    } finally { setSaving(false); }
  };

  const handleEditSave = async (id) => {
    const nombre = editName.trim();
    if (!nombre) return;
    try {
      const res = await familyAPI.update(id, { nombre });
      setMembers(prev => prev.map(m => m.id === id ? res.data : m));
      // Actualizar localStorage si era el miembro activo
      const active = getMemberActive();
      if (active && active.id === id) {
        localStorage.setItem(MEMBER_KEY, JSON.stringify(res.data));
      }
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este integrante?')) return;
    setDeletingId(id);
    try {
      await familyAPI.delete(id);
      setMembers(prev => prev.filter(m => m.id !== id));
      const active = getMemberActive();
      if (active && active.id === id) localStorage.removeItem(MEMBER_KEY);
    } catch {
      setError('Error al eliminar');
    } finally { setDeletingId(null); }
  };

  const handleSelectActive = (member) => {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink, maxWidth: 480, margin: '0 auto', paddingBottom: 120, boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 16px' }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.paper, boxShadow: T.elev, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico.ChevL s={18} c={T.ink} w={2}/>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: 26, letterSpacing: -0.5 }}>Familia</h1>
          {activeNombre && (
            <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>Eres: <strong style={{ color: T.ink }}>{activeNombre}</strong></div>
          )}
        </div>
        {members.length < 5 && (
          <button onClick={() => setShowAddForm(true)} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico.Plus s={18} c="#fff" w={2.4}/>
          </button>
        )}
      </div>

      {error && (
        <div style={{ margin: '0 20px 12px', background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '10px 14px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')}><Ico.X s={14} c="#B91C1C"/></button>
        </div>
      )}

      <div style={{ padding: '0 20px' }}>

        {/* Intro */}
        <div style={{ marginBottom: 20, background: T.paper, borderRadius: 16, padding: '14px 16px', boxShadow: T.elev }}>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            Registra hasta <strong style={{ color: T.ink }}>5 integrantes</strong>. Cada persona elige su nombre al abrir la app y sus compras quedan registradas a su nombre.
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spinner size={32}/>
          </div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 56 }}>👨‍👩‍👧‍👦</div>
            <p style={{ marginTop: 12, color: T.muted, fontSize: 14, lineHeight: 1.5 }}>
              Aún no hay integrantes registrados.<br/>Toca el <strong>+</strong> para agregar el primero.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map((m, i) => {
              const color = m.color || AVATAR_COLORS[i % AVATAR_COLORS.length];
              const isActive = activeNombre === m.nombre;
              return (
                <div key={m.id} style={{ background: T.paper, borderRadius: 16, padding: '14px 16px', boxShadow: T.elev, border: isActive ? `2px solid ${T.primary}` : '2px solid transparent' }}>
                  {editingId === m.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEditSave(m.id)}
                        style={{ flex: 1, background: T.cream, borderRadius: 10, padding: '8px 12px', fontSize: 14, color: T.ink, border: `1px solid ${T.hairline}`, fontFamily: T.sans }}
                      />
                      <button onClick={() => handleEditSave(m.id)} style={{ width: 36, height: 36, borderRadius: 10, background: T.primary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ico.Check s={15} c="#fff" w={2.5}/>
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ width: 36, height: 36, borderRadius: 10, background: T.cream, border: `1px solid ${T.hairline}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ico.X s={14} c={T.muted}/>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontFamily: T.serif, fontWeight: 600, flexShrink: 0 }}>
                        {m.nombre[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{m.nombre}</div>
                        {isActive && <div style={{ fontSize: 11, color: T.primary, fontWeight: 600, marginTop: 1 }}>Activo ahora</div>}
                      </div>
                      <button onClick={() => handleSelectActive(m)} style={{ padding: '5px 12px', borderRadius: 10, border: isActive ? `1.5px solid ${T.primary}` : `1px solid ${T.hairline}`, background: isActive ? T.primary + '15' : 'transparent', color: isActive ? T.primary : T.muted, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>
                        {isActive ? 'Eres tú' : 'Soy yo'}
                      </button>
                      <button onClick={() => { setEditingId(m.id); setEditName(m.nombre); }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: T.cream, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ico.Edit s={14} c={T.muted} w={1.8}/>
                      </button>
                      <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: T.cream, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deletingId === m.id ? 0.4 : 1 }}>
                        {deletingId === m.id ? <Spinner size={12}/> : <Ico.Trash s={14} c={T.muted} w={1.6}/>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {members.length >= 5 && (
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12.5, color: T.muted }}>
            Límite de 5 integrantes alcanzado
          </div>
        )}
      </div>

      <BottomTabBar active="family"/>

      {/* Modal agregar */}
      {showAddForm && (
        <div onClick={() => setShowAddForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.cream, borderRadius: '24px 24px 0 0', padding: '20px 20px 48px', width: '100%', maxWidth: 480, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: T.hairline }}/>
            </div>
            <h3 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 20, letterSpacing: -0.3, marginBottom: 16, color: T.ink }}>Agregar integrante</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                autoFocus type="text" placeholder="Nombre (ej: Mamá, Juan)"
                value={newName} onChange={e => setNewName(e.target.value)}
                style={{ width: '100%', background: T.paper, borderRadius: 12, padding: '14px 16px', fontSize: 15, color: T.ink, boxShadow: T.elev, border: 'none', fontFamily: T.sans, boxSizing: 'border-box' }}
              />
              {/* Color selector */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 8 }}>Color</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {AVATAR_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: newColor === c ? `3px solid ${T.ink}` : '3px solid transparent', cursor: 'pointer' }}/>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowAddForm(false); setNewName(''); }} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: `1px solid ${T.hairline}`, fontSize: 13.5, fontWeight: 600, color: T.ink, background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '14px 0', borderRadius: 14, background: T.primary, color: '#fff', fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {saving ? <Spinner size={18} color="#fff"/> : <Ico.Check s={16} c="#fff" w={2.5}/>}
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
