import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { listsAPI, suggestedAPI } from '../api';

const CACHE_KEY = 'dashboard_lists';

function loadCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY)) || null; } catch { return null; }
}
function saveCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

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

  // Edición inline del monto total
  const [editingTotalId, setEditingTotalId] = useState(null);
  const [editingTotalValue, setEditingTotalValue] = useState('');

  const fetchLists = useCallback(async () => {
    try {
      const res = await listsAPI.getAll();
      setLists(res.data);
      saveCache(res.data);
    } catch {
      if (!loadCache()) setError('No se pudo cargar las listas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Refetch al volver al tab o a la página
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchLists();
    };
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
      setLists(updated);
      saveCache(updated);
      setNewName('');
      setShowForm(false);
    } catch {
      setError('Error al crear la lista');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta lista y todos sus artículos?')) return;
    setDeletingId(id);
    try {
      await listsAPI.delete(id);
      const updated = lists.filter(l => l.id !== id);
      setLists(updated);
      saveCache(updated);
    } catch {
      setError('Error al eliminar la lista');
    } finally {
      setDeletingId(null);
    }
  };

  const startEditTotal = (lst) => {
    setEditingTotalId(lst.id);
    setEditingTotalValue(lst.monto_total != null ? String(lst.monto_total) : '');
  };

  const handleSaveTotal = async (id) => {
    const raw = editingTotalValue.trim();
    const val = raw === '' ? null : parseFloat(raw.replace(',', '.'));
    if (val !== null && isNaN(val)) return;
    try {
      const res = await listsAPI.update(id, { monto_total: val });
      const updated = lists.map(l => l.id === id ? { ...l, monto_total: res.data.monto_total } : l);
      setLists(updated);
      saveCache(updated);
    } catch {
      setError('Error al guardar el monto');
    } finally {
      setEditingTotalId(null);
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatMonto = (val) => {
    return Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ── Mercado Semanal ──────────────────────────────────────────────────────
  const isMonday = new Date().getDay() === 1;
  const [showSuggestedModal, setShowSuggestedModal] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [suggestedMeta, setSuggestedMeta] = useState({ semanas_disponibles: 0, semanas_requeridas: 4 });
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedCreating, setSuggestedCreating] = useState(false);

  const CATEGORIA_COLORS = {
    'Frutas y Verduras': 'success', 'Carnes y Pescados': 'danger',
    'Lácteos y Huevos': 'warning', 'Panadería': 'warning',
    'Almacén / Despensa': 'secondary', 'Bebidas': 'info',
    'Limpieza del Hogar': 'primary', 'Higiene Personal': 'primary',
    'Snacks y Dulces': 'warning', 'Congelados': 'info', 'Otros': 'secondary',
  };

  const handleOpenSuggested = async () => {
    setShowSuggestedModal(true);
    setSuggestedLoading(true);
    setSuggestedItems([]);
    try {
      const res = await suggestedAPI.preview();
      setSuggestedItems(res.data.items);
      setSuggestedMeta({ semanas_disponibles: res.data.semanas_disponibles, semanas_requeridas: res.data.semanas_requeridas });
    } catch {
      setSuggestedMeta({ semanas_disponibles: 0, semanas_requeridas: 4 });
    } finally {
      setSuggestedLoading(false);
    }
  };

  const handleCreateSuggested = async () => {
    setSuggestedCreating(true);
    try {
      const res = await suggestedAPI.create();
      setShowSuggestedModal(false);
      navigate(`/lists/${res.data.list.id}`);
    } catch (err) {
      if (err.response?.status === 409) {
        setShowSuggestedModal(false);
        navigate(`/lists/${err.response.data.list_id}`);
      }
    } finally {
      setSuggestedCreating(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary mb-4">
        <div className="container">
          <span className="navbar-brand">🛒 Mis Listas</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white small">Hola, {user?.username}</span>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => navigate('/catalog')}
              title="Catálogo de artículos"
            >
              Catálogo
            </button>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => navigate('/history')}
              title="Historial de compras"
            >
              Historial
            </button>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="container pb-5">
        {error && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')} />
          </div>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">
            {lists.length} {lists.length === 1 ? 'lista' : 'listas'}
          </h5>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-success btn-sm"
              onClick={handleOpenSuggested}
              disabled={!isMonday}
              title={isMonday ? 'Generar lista sugerida para esta semana' : 'Disponible los lunes'}
            >
              ✨ Mercado Semanal
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowForm(!showForm)}
            >
              + Nueva lista
            </button>
          </div>
        </div>

        {/* Form nueva lista */}
        {showForm && (
          <div className="card mb-4">
            <div className="card-body">
              <form onSubmit={handleCreate} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre de la lista (ej: Semana del 14)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={creating}
                >
                  {creating ? <span className="spinner-border spinner-border-sm" /> : 'Crear'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => { setShowForm(false); setNewName(''); }}
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Lista de listas */}
        {loading ? (
          <div className="spinner-center">
            <div className="spinner-border text-primary" />
          </div>
        ) : lists.length === 0 ? (
          <div className="empty-state card">
            <div className="card-body">
              <div className="empty-icon">📋</div>
              <h6>No tienes listas todavía</h6>
              <p className="small">Crea tu primera lista de compras</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                + Crear lista
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {lists.map(lst => (
              <div className="col-12 col-sm-6 col-md-4" key={lst.id}>
                <div className="card h-100">
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title fw-bold mb-1">{lst.name}</h6>
                    <p className="text-muted small mb-2">
                      Creada el {formatDate(lst.created_at)}
                    </p>

                    {/* Badge estado items */}
                    {lst.total > 0 && (
                      <p className="mb-2">
                        <span className={`badge ${lst.pendientes > 0 ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {lst.pendientes > 0
                            ? `${lst.pendientes} pendiente${lst.pendientes !== 1 ? 's' : ''}`
                            : '✓ Todo comprado'}
                        </span>
                      </p>
                    )}

                    {/* Monto total de la compra */}
                    <div className="mb-3">
                      {editingTotalId === lst.id ? (
                        <div className="d-flex gap-1">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="0.00"
                            value={editingTotalValue}
                            onChange={e => setEditingTotalValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveTotal(lst.id);
                              if (e.key === 'Escape') setEditingTotalId(null);
                            }}
                            autoFocus
                            min="0"
                            step="0.01"
                            style={{ maxWidth: '120px' }}
                          />
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleSaveTotal(lst.id)}
                          >
                            ✓
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setEditingTotalId(null)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : lst.monto_total != null ? (
                        <button
                          className="btn btn-link btn-sm p-0 text-success fw-semibold"
                          onClick={() => startEditTotal(lst)}
                          title="Editar monto"
                        >
                          💰 ${formatMonto(lst.monto_total)}
                        </button>
                      ) : (
                        <button
                          className="btn btn-link btn-sm p-0 text-muted"
                          onClick={() => startEditTotal(lst)}
                        >
                          + Agregar total de compra
                        </button>
                      )}
                    </div>

                    <div className="mt-auto d-flex gap-2">
                      <button
                        className="btn btn-primary btn-sm flex-fill"
                        onClick={() => navigate(`/lists/${lst.id}`)}
                      >
                        Abrir
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(lst.id)}
                        disabled={deletingId === lst.id}
                      >
                        {deletingId === lst.id
                          ? <span className="spinner-border spinner-border-sm" />
                          : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                            </svg>
                          )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Mercado Semanal ── */}
      {showSuggestedModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowSuggestedModal(false)}>
          <div className="modal-dialog modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">✨ Mercado Semanal</h5>
                <button className="btn-close" onClick={() => setShowSuggestedModal(false)} />
              </div>
              <div className="modal-body">
                {suggestedLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-success" />
                    <p className="mt-2 text-muted small">Analizando historial...</p>
                  </div>
                ) : suggestedMeta.semanas_disponibles < suggestedMeta.semanas_requeridas ? (
                  <div className="text-center py-3">
                    <div style={{ fontSize: '2rem' }}>📅</div>
                    <p className="mt-2 mb-1 fw-semibold">Historial insuficiente</p>
                    <p className="text-muted small">
                      Necesitás al menos <strong>4 semanas</strong> de compras registradas.<br />
                      Tenés {suggestedMeta.semanas_disponibles} semana{suggestedMeta.semanas_disponibles !== 1 ? 's' : ''} hasta ahora.
                    </p>
                  </div>
                ) : suggestedItems.length === 0 ? (
                  <div className="text-center py-3">
                    <div style={{ fontSize: '2rem' }}>🤔</div>
                    <p className="mt-2 mb-1 fw-semibold">Sin artículos recurrentes</p>
                    <p className="text-muted small">
                      Todavía no hay artículos comprados las 4 semanas seguidas.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-muted small mb-3">
                      {suggestedItems.length} artículo{suggestedItems.length !== 1 ? 's' : ''} comprados todas las semanas del último mes:
                    </p>
                    {Object.entries(
                      suggestedItems.reduce((acc, item) => {
                        const cat = item.categoria || 'Otros';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item);
                        return acc;
                      }, {})
                    ).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
                      <div key={cat} className="mb-3">
                        <span className={`badge bg-${CATEGORIA_COLORS[cat] || 'secondary'} mb-1`}>{cat}</span>
                        <ul className="list-group list-group-flush">
                          {items.map((item, i) => (
                            <li key={i} className="list-group-item py-1 px-2 d-flex justify-content-between align-items-center">
                              <span>{item.articulo}</span>
                              {item.cantidad && item.cantidad !== '1' && (
                                <span className="text-muted small">× {item.cantidad}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowSuggestedModal(false)}>
                  Cancelar
                </button>
                {suggestedItems.length > 0 && !suggestedLoading && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={handleCreateSuggested}
                    disabled={suggestedCreating}
                  >
                    {suggestedCreating
                      ? <><span className="spinner-border spinner-border-sm me-1" />Creando...</>
                      : '✔ Crear lista'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
