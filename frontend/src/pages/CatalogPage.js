import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { catalogAPI } from '../api';

const CATEGORIAS = [
  'Frutas y Verduras',
  'Carnes y Pescados',
  'Lácteos y Huevos',
  'Panadería',
  'Almacén / Despensa',
  'Bebidas',
  'Limpieza del Hogar',
  'Higiene Personal',
  'Snacks y Dulces',
  'Congelados',
  'Otros',
];

export default function CatalogPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Estado del modal de edición
  const [editing, setEditing] = useState(null); // { id, articulo, categoria }
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogAPI.getAll();
      setEntries(res.data);
    } catch {
      setError('No se pudo cargar el catálogo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const handleEdit = (entry) => {
    setEditing({ ...entry });
    setSaveError('');
  };

  const handleSave = async () => {
    if (!editing.articulo.trim()) {
      setSaveError('El nombre no puede estar vacío');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await catalogAPI.update(editing.id, {
        articulo: editing.articulo.trim(),
        categoria: editing.categoria,
      });
      setEntries(entries.map(e => e.id === editing.id ? res.data : e));
      setEditing(null);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este artículo del catálogo?')) return;
    try {
      await catalogAPI.delete(id);
      setEntries(entries.filter(e => e.id !== id));
    } catch {
      setError('Error al eliminar');
    }
  };

  const filtered = entries.filter(e =>
    e.articulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <nav className="navbar navbar-dark bg-primary mb-4">
        <div className="container">
          <button
            className="btn btn-link text-white text-decoration-none p-0 navbar-brand"
            onClick={() => navigate('/dashboard')}
          >
            ← Mis Listas
          </button>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white small">Hola, {user?.username}</span>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="container pb-5">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold mb-0">Catálogo de artículos</h5>
          <span className="text-muted small">{entries.length} artículo{entries.length !== 1 ? 's' : ''}</span>
        </div>

        <p className="text-muted small mb-3">
          Estos artículos aparecen como sugerencias al agregar ítems a tus listas.
          Se agregan automáticamente cuando agregás artículos nuevos.
        </p>

        {error && (
          <div className="alert alert-danger alert-dismissible">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')} />
          </div>
        )}

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar artículo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center mt-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-5">
            <div className="card-body">
              <div style={{ fontSize: '2.5rem' }}>📦</div>
              <h6 className="mt-2">
                {search ? 'Sin resultados para esa búsqueda' : 'El catálogo está vacío'}
              </h6>
              <p className="text-muted small">
                Los artículos se agregan automáticamente cuando los cargás en tus listas.
              </p>
            </div>
          </div>
        ) : (
          <div className="list-group">
            {filtered.map(entry => (
              <div
                key={entry.id}
                className="list-group-item d-flex justify-content-between align-items-center py-2 px-3"
              >
                <div>
                  <span className="fw-semibold">{entry.articulo}</span>
                  <span className="badge bg-secondary ms-2 fw-normal" style={{ fontSize: '0.75rem' }}>
                    {entry.categoria}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleEdit(entry)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editing && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Editar artículo</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                />
              </div>
              <div className="modal-body">
                {saveError && (
                  <div className="alert alert-danger py-2 small">{saveError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editing.articulo}
                    onChange={e => setEditing({ ...editing, articulo: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Categoría</label>
                  <select
                    className="form-select"
                    value={editing.categoria}
                    onChange={e => setEditing({ ...editing, categoria: e.target.value })}
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <span className="spinner-border spinner-border-sm" /> : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
