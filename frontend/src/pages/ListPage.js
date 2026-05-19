import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { listsAPI, itemsAPI } from '../api';
import { T, CATEGORIAS, CAT_META, Ico, Spinner } from '../theme';

const inp = {
  width: '100%', background: T.paper, borderRadius: 12,
  padding: '12px 14px', fontSize: 15, color: T.ink,
  boxShadow: T.elev, border: 'none', fontFamily: T.sans,
};

export default function ListPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listInfo, setListInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, comprados: 0, pendientes: 0, porcentaje: 0 });
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ articulo: '', cantidad: '1', categoria: 'Otros', agregado_por: user?.username || '' });
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const [filterCat, setFilterCat] = useState('Todas');
  const [showToast, setShowToast] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const itemsRes = await itemsAPI.getAll(id);
      setItems(itemsRes.data.items);
      setStats(itemsRes.data.stats);
    } catch {
      setError('Error al cargar la lista');
    } finally {
      setLoading(false);
    }
    try {
      const listRes = await listsAPI.get(id);
      setListInfo(listRes.data);
    } catch {}
    try {
      const catalogRes = await itemsAPI.getCatalog(id);
      setCatalog(catalogRes.data);
    } catch {}
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleArticuloChange = (value) => {
    setForm(f => ({ ...f, articulo: value }));
    if (value.length >= 2) {
      setSuggestions(
        catalog.filter(c => c.articulo.toLowerCase().includes(value.toLowerCase())).slice(0, 6)
      );
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item) => {
    setForm(f => ({ ...f, articulo: item.articulo, categoria: item.categoria }));
    setSuggestions([]);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.articulo.trim()) return;
    setAdding(true);
    try {
      const res = await itemsAPI.add(id, form.articulo.trim(), form.cantidad, form.categoria, form.agregado_por);
      setItems(prev => [...prev, res.data]);
      setStats(prev => {
        const total = prev.total + 1;
        return { total, pendientes: prev.pendientes + 1, comprados: prev.comprados, porcentaje: total > 0 ? Math.round(prev.comprados / total * 100) : 0 };
      });
      const nuevoArticulo = form.articulo.trim();
      setCatalog(prev => {
        if (prev.some(c => c.articulo.toLowerCase() === nuevoArticulo.toLowerCase())) return prev;
        return [...prev, { articulo: nuevoArticulo, categoria: form.categoria }]
          .sort((a, b) => a.articulo.toLowerCase().localeCompare(b.articulo.toLowerCase()));
      });
      setForm(f => ({ ...f, articulo: '', cantidad: '1', categoria: 'Otros' }));
      setSuggestions([]);
    } catch {
      setError('Error al agregar artículo');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (item) => {
    const newVal = !item.comprado;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, comprado: newVal } : i));
    setStats(prev => {
      const comprados = newVal ? prev.comprados + 1 : prev.comprados - 1;
      const pendientes = prev.total - comprados;
      if (pendientes === 0 && prev.total > 0) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      return { ...prev, comprados, pendientes, porcentaje: prev.total > 0 ? Math.round(comprados / prev.total * 100) : 0 };
    });
    try {
      await itemsAPI.update(id, item.id, { comprado: newVal });
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, comprado: item.comprado } : i));
    }
  };

  const handleDelete = async (itemId) => {
    const item = items.find(i => i.id === itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    setStats(prev => {
      const comprados = item.comprado ? prev.comprados - 1 : prev.comprados;
      const total = prev.total - 1;
      return { total, comprados, pendientes: total - comprados, porcentaje: total > 0 ? Math.round(comprados / total * 100) : 0 };
    });
    try {
      await itemsAPI.delete(id, itemId);
    } catch {
      fetchData();
    }
  };

  const handleReset = async () => {
    if (!window.confirm('¿Vaciar todos los artículos de esta lista?')) return;
    try {
      await itemsAPI.reset(id);
      setItems([]);
      setStats({ total: 0, comprados: 0, pendientes: 0, porcentaje: 0 });
    } catch {
      setError('Error al vaciar la lista');
    }
  };

  const normalizarCategoria = (cat) => CATEGORIAS.includes(cat) ? cat : 'Otros';

  const filteredItems = filterCat === 'Todas'
    ? items
    : items.filter(i => normalizarCategoria(i.categoria) === filterCat);

  const grouped = filteredItems.reduce((acc, item) => {
    const cat = normalizarCategoria(item.categoria);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink, paddingBottom: 120 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ padding: '56px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            width: 40, height: 40, borderRadius: 12, background: T.paper,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev,
          }}>
            <Ico.ChevL s={18} c={T.ink} />
          </button>
          <button onClick={handleReset} style={{
            padding: '0 14px', height: 36, borderRadius: 10,
            background: 'transparent', border: `1px solid ${T.hairline}`,
            fontSize: 12.5, fontWeight: 600, color: T.muted, fontFamily: T.sans,
          }}>Vaciar</button>
        </div>

        {/* Title + progress */}
        <div style={{ padding: '18px 24px 0' }}>
          <h1 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: 30, letterSpacing: -0.6 }}>
            {listInfo?.name || 'Lista'}
          </h1>
          {stats.total > 0 && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: T.hairline, borderRadius: 99 }}>
                <div style={{
                  width: `${Math.max(2, stats.porcentaje)}%`, height: '100%',
                  background: T.primary, borderRadius: 99, transition: 'width .3s',
                }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                {stats.comprados}<span style={{ color: T.muted, fontWeight: 500 }}>/{stats.total}</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            margin: '16px 20px 0', background: '#FEE2E2', border: '1px solid #FECACA',
            color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13.5,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {error}
            <button onClick={() => setError('')} style={{ fontSize: 18, color: '#B91C1C', lineHeight: 1, fontFamily: T.sans }}>×</button>
          </div>
        )}

        {/* Category filter chips */}
        <div className="scroll-x" style={{ padding: '20px 20px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {['Todas', ...CATEGORIAS].map(cat => {
            const active = filterCat === cat;
            const meta = CAT_META[cat];
            return (
              <button key={cat} onClick={() => setFilterCat(cat)} style={{
                flexShrink: 0, padding: '7px 12px', borderRadius: 99,
                background: active ? T.ink : T.paper,
                color: active ? '#fff' : T.muted,
                fontSize: 12.5, fontWeight: 600, fontFamily: T.sans,
                boxShadow: active ? 'none' : T.elev,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {meta && <span style={{ fontSize: 13 }}>{meta.emoji}</span>}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Items */}
        <div style={{ padding: '20px 16px 0' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.5 }}>🥬🍞🥚</div>
              <h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 22, fontWeight: 500 }}>
                {filterCat === 'Todas' ? 'Lista vacía' : `Sin artículos en ${filterCat}`}
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: T.muted, lineHeight: 1.5 }}>
                {filterCat === 'Todas'
                  ? 'Tocá el botón de abajo para agregar el primer artículo.'
                  : 'Cambiá el filtro para ver otros artículos.'}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, catItems], gi) => {
              const meta = CAT_META[cat] || { emoji: '📦', color: T.muted };
              return (
                <div key={cat} style={{ marginTop: gi === 0 ? 0 : 22 }}>
                  <div style={{ padding: '0 8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      padding: '3px 9px', borderRadius: 99, background: '#F1E5D2',
                      fontSize: 11, fontWeight: 600, color: T.ink,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <span>{meta.emoji}</span>{cat}
                    </span>
                    <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{catItems.length}</span>
                  </div>
                  <div style={{ background: T.paper, borderRadius: 20, overflow: 'hidden', boxShadow: T.elev }}>
                    {catItems.map((item, idx) => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px',
                        borderTop: idx === 0 ? 'none' : `1px solid ${T.hairline}`,
                      }}>
                        <button onClick={() => handleToggle(item)} style={{
                          width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                          background: item.comprado ? T.primary : 'transparent',
                          border: item.comprado ? `1.5px solid ${T.primary}` : `1.5px solid rgba(42,31,24,0.2)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {item.comprado && <Ico.Check s={14} c="#fff" />}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 15, fontWeight: 500,
                            textDecoration: item.comprado ? 'line-through' : 'none',
                            opacity: item.comprado ? 0.45 : 1,
                          }}>{item.articulo}</div>
                          {(item.cantidad && item.cantidad !== '1') || item.agregado_por ? (
                            <div style={{ marginTop: 2, fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 5, opacity: item.comprado ? 0.5 : 1 }}>
                              {item.cantidad && item.cantidad !== '1' && <span>× {item.cantidad}</span>}
                              {item.cantidad && item.cantidad !== '1' && item.agregado_por && (
                                <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.muted, flexShrink: 0 }} />
                              )}
                              {item.agregado_por && <span>{item.agregado_por}</span>}
                            </div>
                          ) : null}
                        </div>
                        <button onClick={() => handleDelete(item.id)} style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          background: 'transparent', border: `1px solid ${T.hairline}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Ico.Trash s={14} c={T.muted} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating add bar */}
      <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, zIndex: 10, padding: '0 16px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => setShowForm(true)} style={{
            width: '100%', background: T.ink, borderRadius: 24,
            padding: '10px 10px 10px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: T.elevHi, fontFamily: T.sans,
          }}>
            <Ico.Plus s={18} c="rgba(255,255,255,0.5)" w={2.2} />
            <span style={{ flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 14.5, textAlign: 'left' }}>
              Añadir producto…
            </span>
            <div style={{
              width: 40, height: 40, borderRadius: 14, background: T.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ico.Plus s={18} c="#fff" w={2.2} />
            </div>
          </button>
        </div>
      </div>

      {/* Add form bottom sheet */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setShowForm(false); setSuggestions([]); }}
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
              <span style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 19, letterSpacing: -0.3 }}>Añadir producto</span>
              <button
                onClick={() => { setShowForm(false); setSuggestions([]); }}
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: T.paper,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev,
                }}
              >
                <Ico.X s={14} c={T.ink} />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Artículo *</label>
                <input
                  type="text"
                  style={inp}
                  placeholder="¿Qué necesitás?"
                  value={form.articulo}
                  onChange={e => handleArticuloChange(e.target.value)}
                  autoFocus
                  required
                />
                {suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 200,
                    background: T.paper, borderRadius: 12, boxShadow: T.elevHi,
                    overflow: 'hidden', marginBottom: 4,
                  }}>
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        onMouseDown={() => selectSuggestion(s)}
                        style={{
                          padding: '11px 14px', cursor: 'pointer',
                          borderTop: i === 0 ? 'none' : `1px solid ${T.hairline}`,
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{CAT_META[s.categoria]?.emoji || '📦'}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{s.articulo}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{s.categoria}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: '0 0 80px' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Cantidad</label>
                  <input
                    type="text"
                    style={{ ...inp, textAlign: 'center' }}
                    value={form.cantidad}
                    onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Categoría</label>
                  <select
                    style={{ ...inp, paddingRight: 8 }}
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  >
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Quién lo agrega</label>
                <input
                  type="text"
                  style={inp}
                  placeholder="Tu nombre"
                  value={form.agregado_por}
                  onChange={e => setForm(f => ({ ...f, agregado_por: e.target.value }))}
                />
              </div>

              <button type="submit" disabled={adding} style={{
                height: 52, borderRadius: 14, background: T.primary, color: '#fff',
                fontFamily: T.sans, fontSize: 15, fontWeight: 600,
                opacity: adding ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4,
              }}>
                {adding && <Spinner size={18} color="#fff" />}
                Agregar artículo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast: compras completadas */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, background: T.ink, color: '#fff', borderRadius: 20,
          padding: '14px 24px', boxShadow: T.elevHi,
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: T.sans, fontSize: 14.5, fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 22 }}>🎉</span>
          ¡Compras listas!
        </div>
      )}
    </div>
  );
}
