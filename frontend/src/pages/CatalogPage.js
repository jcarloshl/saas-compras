import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogAPI } from '../api';
import { T, CATEGORIAS, CAT_META, Ico, Spinner } from '../theme';

const inp = {
  width: '100%', background: T.paper, borderRadius: 12,
  padding: '14px 16px', fontSize: 15, color: T.ink,
  boxShadow: T.elev, border: 'none', fontFamily: T.sans,
};

export default function CatalogPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
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

  const handleEdit = (entry) => { setEditing({ ...entry }); setSaveError(''); };

  const handleSave = async () => {
    if (!editing.articulo.trim()) { setSaveError('El nombre no puede estar vacío'); return; }
    setSaving(true); setSaveError('');
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

  const groups = filtered.reduce((acc, it) => {
    const l = it.articulo[0].toUpperCase();
    (acc[l] = acc[l] || []).push(it);
    return acc;
  }, {});
  const letters = Object.keys(groups).sort();

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink, paddingBottom: 60 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ padding: '56px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '0 14px 0 10px', height: 40, borderRadius: 12, background: T.paper,
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: T.elev,
            fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: T.sans,
          }}>
            <Ico.ChevL s={16} c={T.ink} /> Listas
          </button>
          <span style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>
            {entries.length} artículo{entries.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Title */}
        <div style={{ padding: '18px 24px 0' }}>
          <h1 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: 30, letterSpacing: -0.6 }}>
            Catálogo
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.muted, lineHeight: 1.45 }}>
            Tus artículos guardados — aparecen como sugerencia al agregar a una lista.
          </p>
        </div>

        {/* Search */}
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{
            background: T.paper, borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: T.elev,
          }}>
            <Ico.Search s={18} c={T.muted} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar artículo…"
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 14.5, color: T.ink, fontFamily: T.sans, padding: 0,
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                width: 20, height: 20, borderRadius: '50%', background: T.hairline,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Ico.X s={10} c={T.muted} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            margin: '14px 20px 0', background: '#FEE2E2', border: '1px solid #FECACA',
            color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13.5,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {error}
            <button onClick={() => setError('')} style={{ fontSize: 18, color: '#B91C1C', fontFamily: T.sans }}>×</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Spinner size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.5 }}>📦</div>
            <h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 22, fontWeight: 500 }}>
              {search ? 'Sin resultados' : 'Catálogo vacío'}
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: T.muted, lineHeight: 1.5 }}>
              Los artículos se agregan automáticamente cuando los cargás en tus listas.
            </p>
          </div>
        ) : (
          <div style={{ padding: '20px 16px 0' }}>
            {letters.map((L, li) => (
              <div key={L} style={{ marginTop: li === 0 ? 0 : 18 }}>
                <div style={{
                  padding: '0 8px 8px',
                  fontFamily: T.serif, fontWeight: 500, fontSize: 17,
                  color: T.primary, letterSpacing: -0.2,
                }}>{L}</div>
                <div style={{ background: T.paper, borderRadius: 18, overflow: 'hidden', boxShadow: T.elev }}>
                  {groups[L].map((it, idx) => (
                    <div key={it.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      borderTop: idx === 0 ? 'none' : `1px solid ${T.hairline}`,
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, background: '#F1E5D2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 17, flexShrink: 0,
                      }}>
                        {CAT_META[it.categoria]?.emoji || '📦'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: -0.1 }}>{it.articulo}</div>
                        <div style={{ marginTop: 1, fontSize: 11, color: T.muted }}>{it.categoria}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEdit(it)} style={{
                          width: 32, height: 32, borderRadius: 9,
                          background: 'transparent', border: `1px solid ${T.hairline}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Ico.Edit s={14} c={T.muted} />
                        </button>
                        <button onClick={() => handleDelete(it.id)} style={{
                          width: 32, height: 32, borderRadius: 9,
                          background: 'transparent', border: `1px solid ${T.hairline}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Ico.Trash s={14} c={T.primary} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal bottom sheet */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={() => !saving && setEditing(null)}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: T.cream, borderRadius: '24px 24px 0 0',
            padding: '14px 0 40px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: T.hairline }} />
            </div>
            <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 19, letterSpacing: -0.3 }}>
                Editar artículo
              </span>
              <button
                onClick={() => !saving && setEditing(null)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: T.paper,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev,
                }}
              >
                <Ico.X s={14} c={T.ink} />
              </button>
            </div>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {saveError && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13.5 }}>
                  {saveError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Nombre</label>
                <input
                  type="text"
                  style={inp}
                  value={editing.articulo}
                  onChange={e => setEditing({ ...editing, articulo: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Categoría</label>
                <select
                  style={{ ...inp, paddingRight: 8 }}
                  value={editing.categoria}
                  onChange={e => setEditing({ ...editing, categoria: e.target.value })}
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleSave} disabled={saving} style={{
                height: 52, borderRadius: 14, background: T.primary, color: '#fff',
                fontFamily: T.sans, fontSize: 15, fontWeight: 600,
                opacity: saving ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4,
              }}>
                {saving && <Spinner size={18} color="#fff" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
