import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { listsAPI, suggestedAPI } from '../api';
import { T, CAT_META, Ico, Spinner } from '../theme';

const CACHE_KEY = 'dashboard_lists';
function loadCache() { try { return JSON.parse(sessionStorage.getItem(CACHE_KEY)) || null; } catch { return null; } }
function saveCache(data) { try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {} }

function catEmoji(name) { return CAT_META[name]?.emoji || '📦'; }

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [lists, setLists] = useState(() => loadCache() || []);
  const [loading, setLoading] = useState(!loadCache());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [editingTotalId, setEditingTotalId] = useState(null);
  const [editingTotalValue, setEditingTotalValue] = useState('');

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
      const updated = [...lists, res.data];
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

  const startEditTotal = (lst) => { setEditingTotalId(lst.id); setEditingTotalValue(lst.monto_total != null ? String(lst.monto_total) : ''); };
  const handleSaveTotal = async (id) => {
    const raw = editingTotalValue.trim();
    const val = raw === '' ? null : parseFloat(raw.replace(',', '.'));
    if (val !== null && isNaN(val)) return;
    try {
      const res = await listsAPI.update(id, { monto_total: val });
      const updated = lists.map(l => l.id === id ? { ...l, monto_total: res.data.monto_total } : l);
      setLists(updated); saveCache(updated);
    } catch { setError('Error al guardar el monto'); } finally { setEditingTotalId(null); }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatMonto = (val) => Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const totalMonth = lists.reduce((s, l) => s + (l.monto_total || 0), 0);
  const initials = (user?.username || '?')[0].toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink, maxWidth: 480, margin: '0 auto', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: T.paper,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: T.elev, fontFamily: T.serif, fontWeight: 500, color: T.ink, fontSize: 20,
        }}>c</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/catalog')} style={{
            padding: '0 12px', height: 38, borderRadius: 12, background: T.paper,
            display: 'flex', alignItems: 'center', gap: 5, boxShadow: T.elev,
            fontSize: 13, fontWeight: 600, color: T.ink,
          }}><Ico.Grid s={15} c={T.ink} w={2}/> Catálogo</button>
          <button onClick={() => navigate('/history')} style={{
            padding: '0 12px', height: 38, borderRadius: 12, background: T.paper,
            display: 'flex', alignItems: 'center', gap: 5, boxShadow: T.elev,
            fontSize: 13, fontWeight: 600, color: T.ink,
          }}><Ico.Clock s={15} c={T.ink} w={2}/> Historial</button>
          <button onClick={logout} title="Salir" style={{
            width: 38, height: 38, borderRadius: 12, background: T.paper,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: T.elev, fontSize: 15, fontWeight: 700, color: T.primary,
            fontFamily: T.serif,
          }}>{initials}</button>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>
          {lists.length} {lists.length === 1 ? 'lista' : 'listas'}
        </div>
        <h1 style={{ margin: '2px 0 0', fontFamily: T.serif, fontWeight: 500, fontSize: 30, letterSpacing: -0.6 }}>Mis Listas</h1>
      </div>

      {error && (
        <div style={{ margin: '14px 20px 0', background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '10px 14px', fontSize: 13.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ color: '#B91C1C', fontSize: 16, lineHeight: 1 }}><Ico.X s={16} c="#B91C1C"/></button>
        </div>
      )}

      {/* Gastado este mes */}
      {totalMonth > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ background: T.paper, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: T.elev }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: T.muted }}>Gastado este mes</div>
              <div style={{ marginTop: 4, fontFamily: T.serif, fontSize: 26, fontWeight: 500, letterSpacing: -0.8 }}>${formatMonto(totalMonth)}</div>
            </div>
            <button onClick={() => navigate('/history')} style={{ fontSize: 12.5, color: T.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver detalle <Ico.ChevR s={11} c={T.primary} w={2.5}/>
            </button>
          </div>
        </div>
      )}

      {/* Action row */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={handleOpenSuggested} disabled={!isMonday} style={{
          flex: 1, padding: '12px 14px', borderRadius: 16,
          background: '#EEEDD9',
          display: 'flex', alignItems: 'center', gap: 10,
          opacity: isMonday ? 1 : 0.5,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.olive, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico.Sparkle s={20} c="#fff" w={2.2}/>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>Mercado Semanal</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{isMonday ? 'Lista sugerida lista' : 'Disponible los lunes'}</div>
          </div>
        </button>
        <button onClick={() => setShowForm(true)} style={{
          padding: '12px 16px', borderRadius: 14, background: T.primary, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
        }}>
          <Ico.Plus s={16} c="#fff" w={2.4}/>Nueva
        </button>
      </div>

      {/* Lists */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size={32}/>
        </div>
      ) : lists.length === 0 ? (
        <div style={{ padding: '60px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 12 }}>📋</div>
          <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: 26, letterSpacing: -0.5 }}>No tenés listas todavía</h2>
          <p style={{ margin: '10px 0 0', fontSize: 14.5, color: T.muted, lineHeight: 1.5, maxWidth: 280 }}>
            Creá tu primera lista de compras y empezá a tachar productos.
          </p>
          <button onClick={() => setShowForm(true)} style={{
            marginTop: 24, padding: '14px 24px', borderRadius: 16,
            background: T.primary, color: '#fff',
            fontFamily: T.sans, fontWeight: 600, fontSize: 14.5,
            display: 'flex', alignItems: 'center', gap: 8,
          }}><Ico.Plus s={18} c="#fff" w={2.4}/> Crear primera lista</button>
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lists.map(lst => {
            const pendientes = (lst.pendientes ?? 0);
            return (
              <div key={lst.id} style={{ background: T.paper, borderRadius: 22, padding: 16, boxShadow: T.elev }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>{lst.name}</div>
                    <div style={{ marginTop: 3, fontSize: 11.5, color: T.muted }}>Creada el {formatDate(lst.created_at)}</div>
                  </div>
                  {lst.total > 0 && (
                    <span style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600,
                      background: pendientes > 0 ? '#FBEFE3' : '#EEEDD9',
                      color: pendientes > 0 ? T.mustard : T.olive,
                      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                    }}>
                      {pendientes > 0 ? `${pendientes} pendiente${pendientes !== 1 ? 's' : ''}` : <><Ico.Check s={12} c={T.olive} w={2.5}/>Todo comprado</>}
                    </span>
                  )}
                </div>

                {/* Monto total */}
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: T.paperHi, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {editingTotalId === lst.id ? (
                    <div style={{ display: 'flex', gap: 6, width: '100%', alignItems: 'center' }}>
                      <input
                        type="number" placeholder="0.00" value={editingTotalValue}
                        onChange={e => setEditingTotalValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveTotal(lst.id); if (e.key === 'Escape') setEditingTotalId(null); }}
                        autoFocus min="0" step="0.01"
                        style={{ flex: 1, background: T.paper, borderRadius: 8, padding: '8px 12px', fontSize: 15, color: T.ink, border: 'none', fontFamily: T.sans, boxShadow: T.elev }}
                      />
                      <button onClick={() => handleSaveTotal(lst.id)} style={{ width: 34, height: 34, borderRadius: 8, background: T.olive, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ico.Check s={16} c="#fff" w={2.5}/>
                      </button>
                      <button onClick={() => setEditingTotalId(null)} style={{ width: 34, height: 34, borderRadius: 8, background: T.hairline, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ico.X s={16} c={T.muted}/>
                      </button>
                    </div>
                  ) : lst.monto_total != null ? (
                    <>
                      <button onClick={() => startEditTotal(lst)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>💰</span>
                        <span style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 18, color: T.olive, letterSpacing: -0.3 }}>${formatMonto(lst.monto_total)}</span>
                      </button>
                      <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>Editar</span>
                    </>
                  ) : (
                    <button onClick={() => startEditTotal(lst)} style={{ fontSize: 12.5, color: T.muted, fontWeight: 500 }}>
                      + Agregar total de compra
                    </button>
                  )}
                </div>

                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button onClick={() => navigate(`/lists/${lst.id}`)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, textAlign: 'center',
                    background: T.primary, color: '#fff', fontSize: 13.5, fontWeight: 600,
                  }}>Abrir</button>
                  <button onClick={() => handleDelete(lst.id)} disabled={deletingId === lst.id} style={{
                    width: 40, height: 40, borderRadius: 12,
                    border: `1px solid ${T.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: deletingId === lst.id ? 0.5 : 1,
                  }}>
                    {deletingId === lst.id ? <Spinner size={16}/> : <Ico.Trash s={16} c={T.muted}/>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: nueva lista */}
      {showForm && (
        <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.cream, borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', width: '100%', maxWidth: 480, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: T.hairline }}/>
            </div>
            <h3 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 22, letterSpacing: -0.4, marginBottom: 16 }}>Nueva lista</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" placeholder="Nombre de la lista (ej: Semana del 14)"
                value={newName} onChange={e => setNewName(e.target.value)} autoFocus
                style={{ width: '100%', background: T.paper, borderRadius: 12, padding: '14px 16px', fontSize: 15, color: T.ink, boxShadow: T.elev, border: 'none', fontFamily: T.sans }}/>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setNewName(''); }} style={{
                  flex: 1, padding: '14px 0', borderRadius: 14, border: `1px solid ${T.hairline}`,
                  fontSize: 13.5, fontWeight: 600, color: T.ink,
                }}>Cancelar</button>
                <button type="submit" disabled={creating} style={{
                  flex: 2, padding: '14px 0', borderRadius: 14, background: T.primary, color: '#fff',
                  fontSize: 13.5, fontWeight: 700,
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

      {/* Modal: Mercado Semanal */}
      {showSuggestedModal && (
        <div onClick={() => setShowSuggestedModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
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
                <h2 style={{ margin: '4px 0 0', fontFamily: T.serif, fontWeight: 500, fontSize: 22, letterSpacing: -0.4, lineHeight: 1.2 }}>
                  Artículos que llevás <em style={{ color: T.primary }}>cada semana</em>
                </h2>
              </div>
              <button onClick={() => setShowSuggestedModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev, marginLeft: 12, flexShrink: 0 }}>
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
                  <p style={{ marginTop: 12, fontWeight: 600, fontSize: 16 }}>Historial insuficiente</p>
                  <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.5 }}>
                    Necesitás al menos <strong>4 semanas</strong> de compras registradas.<br/>
                    Tenés {suggestedMeta.semanas_disponibles} semana{suggestedMeta.semanas_disponibles !== 1 ? 's' : ''} hasta ahora.
                  </p>
                </div>
              ) : suggestedItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <div style={{ fontSize: 48 }}>🤔</div>
                  <p style={{ marginTop: 12, fontWeight: 600, fontSize: 16 }}>Sin artículos recurrentes</p>
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
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{it.articulo}</span>
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
              <button onClick={() => setShowSuggestedModal(false)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: `1px solid ${T.hairline}`, fontSize: 13.5, fontWeight: 600, color: T.ink }}>
                Cancelar
              </button>
              {suggestedItems.length > 0 && !suggestedLoading && (
                <button onClick={handleCreateSuggested} disabled={suggestedCreating} style={{ flex: 2, padding: '14px 0', borderRadius: 14, background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13.5, fontWeight: 700 }}>
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
