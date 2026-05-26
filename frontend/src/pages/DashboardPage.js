import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { listsAPI, suggestedAPI } from '../api';
import { CAT_META, Ico, Spinner, tileBg } from '../theme';
import AProgressBar from '../components/ui/AProgressBar';
import APillTag from '../components/ui/APillTag';
import BottomTabBar from '../components/BottomTabBar';

const CACHE_KEY = 'dashboard_lists';
function loadCache() { try { return JSON.parse(sessionStorage.getItem(CACHE_KEY)) || null; } catch { return null; } }
function saveCache(data) { try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {} }

function catEmoji(name) { return CAT_META[name]?.emoji || '📦'; }
function formatMonto(val) { return Number(val).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function formatDate(iso) { return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }); }

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { T, dark, toggleDark } = useTheme();

  const [lists, setLists] = useState(() => loadCache() || []);
  const [loading, setLoading] = useState(!loadCache());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchLists = useCallback(async () => {
    try {
      const res = await listsAPI.getAll();
      setLists(res.data); saveCache(res.data);
    } catch {
      if (!loadCache()) setError('No se pudo cargar las listas');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchLists(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchLists]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim() || 'Mi lista';
    setCreating(true);
    try {
      const res = await listsAPI.create(name);
      const updated = [res.data, ...lists];
      setLists(updated); saveCache(updated);
      setNewName(''); setShowForm(false);
    } catch { setError('Error al crear la lista'); } finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta lista y todos sus artículos?')) return;
    setDeletingId(id);
    try {
      await listsAPI.delete(id);
      const updated = lists.filter(l => l.id !== id);
      setLists(updated); saveCache(updated);
    } catch { setError('Error al eliminar la lista'); } finally { setDeletingId(null); }
  };

  // Mercado Semanal
  const isMonday = new Date().getDay() === 1;
  const [showSuggestedModal, setShowSuggestedModal] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [suggestedMeta, setSuggestedMeta] = useState({ semanas_disponibles: 0, semanas_requeridas: 4 });
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedCreating, setSuggestedCreating] = useState(false);

  const handleOpenSuggested = async () => {
    setShowSuggestedModal(true); setSuggestedLoading(true); setSuggestedItems([]);
    try {
      const res = await suggestedAPI.preview();
      setSuggestedItems(res.data.items);
      setSuggestedMeta({ semanas_disponibles: res.data.semanas_disponibles, semanas_requeridas: res.data.semanas_requeridas });
    } catch { setSuggestedMeta({ semanas_disponibles: 0, semanas_requeridas: 4 }); }
    finally { setSuggestedLoading(false); }
  };

  const handleCreateSuggested = async () => {
    setSuggestedCreating(true);
    try {
      const res = await suggestedAPI.create();
      setShowSuggestedModal(false);
      navigate(`/lists/${res.data.list.id}`);
    } catch (err) {
      if (err.response?.status === 409) { setShowSuggestedModal(false); navigate(`/lists/${err.response.data.list_id}`); }
    } finally { setSuggestedCreating(false); }
  };

  const initials = (user?.username || '?')[0].toUpperCase();
  const username = user?.username || '';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink, maxWidth: 480, margin: '0 auto', paddingBottom: 120, boxSizing: 'border-box' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ padding: '52px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>{greeting()}</div>
          <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.4 }}>{username}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Dark mode toggle */}
          <button onClick={toggleDark} style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: T.paper, boxShadow: T.elev, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            {dark ? '☀️' : '🌙'}
          </button>
          {/* Bell → /budget */}
          <button onClick={() => navigate('/budget')} style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: T.paper, boxShadow: T.elev, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ico.Bell s={20} c={T.ink} w={1.8}/>
          </button>
          {/* Avatar → logout */}
          <button onClick={logout} title="Cerrar sesión" style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: T.primary, color: '#fff', cursor: 'pointer',
            fontFamily: T.serif, fontWeight: 500, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {initials}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: '14px 20px 0', background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '10px 14px', fontSize: 13.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')}><Ico.X s={16} c="#B91C1C"/></button>
        </div>
      )}

      {/* ── Carrusel "Para ti, hoy" ─────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Ico.Sparkle s={14} c={T.olive} w={2}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.olive, letterSpacing: 1, textTransform: 'uppercase' }}>Para ti, hoy</span>
        </div>
        <div style={{
          display: 'flex', overflowX: 'auto', gap: 12,
          padding: '4px 24px 12px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }} className="scroll-x">
          {/* Card 1: Mercado Semanal */}
          <button
            onClick={handleOpenSuggested}
            disabled={!isMonday}
            style={{
              scrollSnapAlign: 'start',
              flexShrink: 0, width: 200,
              background: dark ? '#2A1F18' : '#2A1F18',
              borderRadius: 20, padding: 16,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
              border: 'none', cursor: isMonday ? 'pointer' : 'default',
              opacity: isMonday ? 1 : 0.6, boxShadow: T.elevHi,
            }}
          >
            <div style={{ fontSize: 28 }}>🛒</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#F1E7DA', lineHeight: 1.2, textAlign: 'left' }}>Mercado Semanal</div>
            <div style={{ fontSize: 11.5, color: 'rgba(241,231,218,0.6)', textAlign: 'left' }}>{isMonday ? 'Lista sugerida lista' : 'Disponible los lunes'}</div>
            <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 99 }}>
              <Ico.Sparkle s={12} c="#E0B259" w={2}/>
              <span style={{ fontSize: 11, color: '#E0B259', fontWeight: 600 }}>Generar</span>
            </div>
          </button>

          {/* Card 2: Historial reciente */}
          <button
            onClick={() => navigate('/history')}
            style={{
              scrollSnapAlign: 'start',
              flexShrink: 0, width: 180,
              background: tileBg(dark, 1),
              borderRadius: 20, padding: 16,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
              border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 26 }}>📊</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink, lineHeight: 1.2, textAlign: 'left' }}>Historial reciente</div>
            <div style={{ fontSize: 11.5, color: T.muted, textAlign: 'left' }}>Ver lo que compraste</div>
          </button>

          {/* Card 3: Próximamente */}
          <div
            style={{
              scrollSnapAlign: 'start',
              flexShrink: 0, width: 160,
              background: tileBg(dark, 3),
              borderRadius: 20, padding: 16,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
            }}
          >
            <div style={{ fontSize: 26 }}>✨</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>Recetas</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>Próximamente</div>
          </div>
        </div>
      </div>

      {/* ── Listas activas ──────────────────────────────────────── */}
      <div style={{ padding: '8px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.4 }}>Listas activas</span>
            {!loading && <span style={{ fontSize: 12, color: T.muted, marginLeft: 8 }}>{lists.length}</span>}
          </div>
          {!loading && lists.length > 0 && (
            <button onClick={() => setShowForm(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: T.primary, color: '#fff', border: 'none',
              borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
              fontFamily: T.sans, fontWeight: 600, fontSize: 13,
            }}>
              <Ico.Plus s={15} c="#fff" w={2.4}/>
              Nueva
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spinner size={32}/>
          </div>
        ) : lists.length === 0 ? (
          <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🧺</div>
            <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: 22, letterSpacing: -0.4 }}>Tu cesta está vacía</h2>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: T.muted, lineHeight: 1.5, maxWidth: 260 }}>
              Creá tu primera lista de compras para empezar.
            </p>
            <button onClick={() => setShowForm(true)} style={{
              marginTop: 20, padding: '13px 22px', borderRadius: 14,
              background: T.primary, color: '#fff',
              fontFamily: T.sans, fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
            }}><Ico.Plus s={16} c="#fff" w={2.4}/> Crear primera lista</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lists.map((lst, i) => {
              const pendientes = lst.pendientes ?? 0;
              const total = lst.total ?? 0;
              const done = total - pendientes;
              const bg = tileBg(dark, i);
              return (
                <button
                  key={lst.id}
                  onClick={() => navigate(`/lists/${lst.id}`)}
                  style={{
                    background: bg,
                    borderRadius: 20, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                    border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                    position: 'relative',
                  }}
                >
                  {/* Nombre + fecha + badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: -0.2 }}>{lst.name}</div>
                      <div style={{ marginTop: 2, fontSize: 11, color: T.muted }}>{formatDate(lst.created_at)}</div>
                    </div>
                    {total > 0 && (
                      <APillTag
                        bg={pendientes > 0 ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.06)'}
                        color={pendientes > 0 ? T.ink : T.olive}
                        T={T}
                      >
                        {pendientes > 0 ? `${pendientes} pendiente${pendientes !== 1 ? 's' : ''}` : '✓ Todo comprado'}
                      </APillTag>
                    )}
                  </div>

                  {/* Progress bar */}
                  {total > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <AProgressBar value={done} total={total} color={pendientes === 0 ? T.olive : T.primary} T={T}/>
                      </div>
                      <span style={{ fontSize: 11, color: T.muted, flexShrink: 0, fontWeight: 600 }}>{done}/{total}</span>
                    </div>
                  )}

                  {/* Monto + delete row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.faint || T.muted }}>
                      {lst.monto_total != null ? `💰 $${formatMonto(lst.monto_total)} registrado` : 'Sin monto registrado'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(lst.id); }}
                      disabled={deletingId === lst.id}
                      style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none',
                        background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: deletingId === lst.id ? 0.4 : 1,
                      }}
                    >
                      {deletingId === lst.id ? <Spinner size={13}/> : <Ico.Trash s={14} c={T.muted} w={1.6}/>}
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────── */}
      <BottomTabBar active="home"/>

      {/* ── Modal: nueva lista ─────────────────────────────────── */}
      {showForm && (
        <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.cream, borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', width: '100%', maxWidth: 480, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: T.hairline }}/>
            </div>
            <h3 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 22, letterSpacing: -0.4, marginBottom: 16, color: T.ink }}>Nueva lista</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" placeholder="Nombre de la lista (ej: Semana del 14)"
                value={newName} onChange={e => setNewName(e.target.value)} autoFocus
                style={{ width: '100%', background: T.paper, borderRadius: 12, padding: '14px 16px', fontSize: 15, color: T.ink, boxShadow: T.elev, border: 'none', fontFamily: T.sans, boxSizing: 'border-box' }}/>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setNewName(''); }} style={{
                  flex: 1, padding: '14px 0', borderRadius: 14, border: `1px solid ${T.hairline}`,
                  fontSize: 13.5, fontWeight: 600, color: T.ink, background: 'transparent', cursor: 'pointer',
                }}>Cancelar</button>
                <button type="submit" disabled={creating} style={{
                  flex: 2, padding: '14px 0', borderRadius: 14, background: T.primary, color: '#fff',
                  fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  {creating ? <Spinner size={18} color="#fff"/> : <Ico.Check s={16} c="#fff" w={2.5}/>}
                  Crear lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Mercado Semanal ─────────────────────────────── */}
      {showSuggestedModal && (
        <div onClick={() => setShowSuggestedModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.cream, borderRadius: '26px 26px 0 0', padding: '14px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: T.hairline }}/>
            </div>
            <div style={{ padding: '10px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Ico.Sparkle s={15} c={T.olive} w={2.2}/>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.olive, letterSpacing: 1, textTransform: 'uppercase' }}>Mercado Semanal</span>
                </div>
                <h2 style={{ margin: '4px 0 0', fontFamily: T.serif, fontWeight: 500, fontSize: 22, letterSpacing: -0.4, lineHeight: 1.2, color: T.ink }}>
                  Artículos que llevás <em style={{ color: T.primary }}>cada semana</em>
                </h2>
              </div>
              <button onClick={() => setShowSuggestedModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev, marginLeft: 12, flexShrink: 0, border: 'none', cursor: 'pointer' }}>
                <Ico.X s={14} c={T.ink}/>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 12px' }}>
              {suggestedLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
                  <Spinner size={32}/>
                  <span style={{ fontSize: 13, color: T.muted }}>Analizando historial…</span>
                </div>
              ) : suggestedMeta.semanas_disponibles < suggestedMeta.semanas_requeridas ? (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <div style={{ fontSize: 48 }}>📅</div>
                  <p style={{ marginTop: 12, fontWeight: 600, fontSize: 16, color: T.ink }}>Historial insuficiente</p>
                  <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.5 }}>
                    Necesitás al menos <strong>4 semanas</strong> de compras registradas.<br/>
                    Tenés {suggestedMeta.semanas_disponibles} semana{suggestedMeta.semanas_disponibles !== 1 ? 's' : ''} hasta ahora.
                  </p>
                </div>
              ) : suggestedItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <div style={{ fontSize: 48 }}>🤔</div>
                  <p style={{ marginTop: 12, fontWeight: 600, fontSize: 16, color: T.ink }}>Sin artículos recurrentes</p>
                  <p style={{ color: T.muted, fontSize: 13.5 }}>Todavía no hay artículos comprados las 4 semanas seguidas.</p>
                </div>
              ) : (
                <>
                  <p style={{ color: T.muted, fontSize: 12.5, marginBottom: 14 }}>
                    {suggestedItems.length} artículo{suggestedItems.length !== 1 ? 's' : ''} comprados todas las semanas:
                  </p>
                  {Object.entries(
                    suggestedItems.reduce((acc, it) => { const cat = it.categoria || 'Otros'; (acc[cat] = acc[cat] || []).push(it); return acc; }, {})
                  ).sort(([a],[b]) => a.localeCompare(b)).map(([cat, items]) => (
                    <div key={cat} style={{ marginBottom: 18 }}>
                      <div style={{ padding: '0 4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ padding: '3px 9px', borderRadius: 99, background: '#F1E5D2', fontSize: 11, fontWeight: 600, color: T.ink, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>{catEmoji(cat)}</span>{cat}
                        </span>
                        <span style={{ fontSize: 11, color: T.muted }}>{items.length}</span>
                      </div>
                      <div style={{ background: T.paper, borderRadius: 14, overflow: 'hidden', boxShadow: T.elev }}>
                        {items.map((it, idx) => (
                          <div key={it.articulo} style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: idx === 0 ? 'none' : `1px solid ${T.hairline}` }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{it.articulo}</span>
                            {it.cantidad && it.cantidad !== '1' && <span style={{ fontSize: 11.5, color: T.muted }}>× {it.cantidad}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div style={{ padding: '12px 16px 32px', display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSuggestedModal(false)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: `1px solid ${T.hairline}`, fontSize: 13.5, fontWeight: 600, color: T.ink, background: 'transparent', cursor: 'pointer' }}>
                Cancelar
              </button>
              {suggestedItems.length > 0 && !suggestedLoading && (
                <button onClick={handleCreateSuggested} disabled={suggestedCreating} style={{ flex: 2, padding: '14px 0', borderRadius: 14, background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  {suggestedCreating ? <Spinner size={18} color="#fff"/> : <Ico.Check s={16} c="#fff" w={2.5}/>}
                  Crear lista
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
