import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { listsAPI } from '../api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchLists = useCallback(async () => {
    try {
      const res = await listsAPI.getAll();
      setLists(res.data);
    } catch {
      setError('No se pudo cargar las listas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim() || 'Mi lista';
    setCreating(true);
    try {
      const res = await listsAPI.create(name);
      setLists([...lists, res.data]);
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
      setLists(lists.filter(l => l.id !== id));
    } catch {
      setError('Error al eliminar la lista');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary mb-4">
        <div className="container">
          <span className="navbar-brand">🛒 Mis Listas</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white small">Hola, {user?.username}</span>
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
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(!showForm)}
          >
            + Nueva lista
          </button>
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
                    <p className="text-muted small mb-3">
                      Creada el {formatDate(lst.created_at)}
                    </p>
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
    </div>
  );
}
